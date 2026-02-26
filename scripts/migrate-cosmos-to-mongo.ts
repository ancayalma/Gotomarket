/**
 * Universal Migration Script: Azure Cosmos DB (MongoDB vCore) → MongoDB
 *
 * Connects to Azure Cosmos DB for MongoDB (vCore) as SOURCE and a standard
 * MongoDB instance as TARGET. Auto-discovers all collections and migrates
 * documents with optional brand rewriting and URL rewriting.
 *
 * Usage:
 *   # Auto-discover and migrate ALL collections
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts
 *
 *   # Migrate specific collections only
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --collections crm_events users
 *
 *   # Rename a collection during migration
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --rename payportal_events:basaltsurge_events
 *
 *   # Rewrite brand names in document data
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --rewrite portalpay:basaltsurge --rewrite payportal:basaltsurge
 *
 *   # Dry run (connect and count, no data written)
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts --dry-run
 *
 *   # Full example for BasaltSurge migration:
 *   npx ts-node scripts/migrate-cosmos-to-mongo.ts \
 *     --rename payportal_events:basaltsurge_events \
 *     --rewrite portalpay:basaltsurge --rewrite payportal:basaltsurge \
 *     --rewrite PortalPay:BasaltSurge --rewrite PayPortal:BasaltSurge \
 *     --rewrite PORTALPAY:BASALTSURGE --rewrite PAYPORTAL:BASALTSURGE
 *
 * Required env vars (one from each pair):
 *   CRM_DATABASE_URL / DATABASE_URL           — Source: Azure Cosmos DB for MongoDB (vCore) connection string
 *   MONGODB_CONNECTION_STRING / DB_CONNECTION_STRING — Target: MongoDB connection string
 *
 * Optional env vars:
 *   DB_NAME                                — Target MongoDB database name override
 *   AZURE_STORAGE_CONNECTION_STRING        — For auto-detecting Azure Blob hostname (URL rewriting)
 *   S3_ENDPOINT                            — Target S3 endpoint (URL rewriting)
 *   S3_BUCKET_NAME                         — Target S3 bucket (URL rewriting)
 */

import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from "mongodb";

// ── CLI Argument Parsing ────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArgValues(flag: string): string[] {
    const values: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === flag && i + 1 < args.length) {
            values.push(args[i + 1]);
            i++; // skip value
        }
    }
    return values;
}

const DRY_RUN = args.includes("--dry-run");

// --collections crm_events users (also supports legacy --containers flag)
const collFlag = args.indexOf("--collections") >= 0 ? args.indexOf("--collections") : args.indexOf("--containers");
const explicitCollections: string[] = [];
if (collFlag >= 0) {
    for (let i = collFlag + 1; i < args.length && !args[i].startsWith("--"); i++) {
        explicitCollections.push(args[i]);
    }
}

// --rename payportal_events:basaltsurge_events (can repeat)
const renameRaw = getArgValues("--rename");
const COLLECTION_MAP: Record<string, string> = {};
for (const r of renameRaw) {
    const [from, to] = r.split(":");
    if (from && to) COLLECTION_MAP[from] = to;
}

// --rewrite portalpay:basaltsurge (can repeat)
const rewriteRaw = getArgValues("--rewrite");
const BRAND_REWRITES: Array<{ from: string; to: string }> = [];
for (const r of rewriteRaw) {
    const [from, to] = r.split(":");
    if (from && to) BRAND_REWRITES.push({ from, to });
}

// ── Configuration ───────────────────────────────────────────────────────

// Source: Azure Cosmos DB for MongoDB (vCore)
const SOURCE_URI = process.env.CRM_DATABASE_URL || process.env.DATABASE_URL || "";

// Target: Standard MongoDB (e.g. OVH)
const TARGET_URI = process.env.MONGODB_CONNECTION_STRING || process.env.DB_CONNECTION_STRING || "";

// Target database name override
const TARGET_DB_OVERRIDE = process.env.DB_NAME || "";

// Fields to cast from Strings/Numbers to MongoDB Date objects
const DATE_FIELDS = ["createdAt", "updatedAt", "timestamp", "deletedAt", "resolvedAt", "lastSeen", "firstSeen"];

// Batch size for cursor reads
const BATCH_SIZE = 500;

// System collections to skip during auto-discovery
const SYSTEM_COLLECTION_PREFIXES = ["system."];

// ── Azure URL → S3 URL rewriting (auto-configured from env) ────────────

function detectAzureBlobHostname(): string {
    if (process.env.AZURE_BLOB_HOSTNAME) return process.env.AZURE_BLOB_HOSTNAME;
    const azConn = process.env.AZURE_STORAGE_CONNECTION_STRING
        || process.env.AZURE_BLOB_CONNECTION_STRING
        || process.env.BLOB_STORAGE_CONNECTION_STRING
        || "";
    const match = azConn.match(/AccountName=([^;]+)/i);
    if (match) return `${match[1]}.blob.core.windows.net`;
    return "";
}

const AZURE_BLOB_HOST = detectAzureBlobHostname();
const S3_ENDPOINT = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
const S3_BUCKET = process.env.S3_BUCKET_NAME || "";
const AZURE_AFD_HOST = process.env.NEXT_PUBLIC_AFD_HOSTNAME || "";
const URL_REWRITE_ENABLED = !!(AZURE_BLOB_HOST && S3_ENDPOINT && S3_BUCKET);

// ── Helpers ─────────────────────────────────────────────────────────────

/** Extract database name from a MongoDB connection string */
function extractDbName(uri: string): string {
    try {
        const url = new URL(uri);
        // pathname is like /ledger1crm or /admin
        const dbName = url.pathname.replace(/^\//, "");
        return dbName || "";
    } catch {
        // Fallback: try regex
        const match = uri.match(/\/([^/?]+)(\?|$)/);
        return match ? match[1] : "";
    }
}

/** Mask credentials in a connection string for safe logging */
function maskUri(uri: string): string {
    return uri.replace(/:([^@:]+)@/, ":****@");
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
    if (!SOURCE_URI) {
        console.error("❌ Source connection string not set (need CRM_DATABASE_URL or DATABASE_URL)");
        process.exit(1);
    }
    if (!TARGET_URI) {
        console.error("❌ Target connection string not set (need MONGODB_CONNECTION_STRING or DB_CONNECTION_STRING)");
        process.exit(1);
    }

    // Determine source database name from connection string
    const sourceDbName = extractDbName(SOURCE_URI);
    if (!sourceDbName) {
        console.error("❌ Could not determine source database name from connection string");
        console.error("   Make sure your CRM_DATABASE_URL includes a database name in the path");
        process.exit(1);
    }

    // Determine target database name
    const targetDbName = TARGET_DB_OVERRIDE || sourceDbName;

    console.log("╔════════════════════════════════════════════════╗");
    console.log("║  Cosmos DB (MongoDB vCore) → MongoDB Migration ║");
    console.log("╚════════════════════════════════════════════════╝\n");

    console.log(`🔗 Source: ${maskUri(SOURCE_URI)}`);
    console.log(`   Database: ${sourceDbName}`);
    console.log(`🔗 Target: ${maskUri(TARGET_URI)}`);
    console.log(`   Database: ${targetDbName}`);

    // Connect to source (Azure Cosmos DB for MongoDB vCore)
    console.log("\n🔗 Connecting to source (Cosmos DB MongoDB vCore)...");
    const sourceClient = new MongoClient(SOURCE_URI, {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 120000,
    });
    await sourceClient.connect();
    const sourceDb = sourceClient.db(sourceDbName);
    console.log("   ✅ Source connected");

    // Connect to target (standard MongoDB)
    console.log("🔗 Connecting to target MongoDB...");
    const targetClient = new MongoClient(TARGET_URI, {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 120000,
    });
    await targetClient.connect();
    const targetDb = targetClient.db(targetDbName);
    console.log("   ✅ Target connected");

    // Log configuration
    if (DRY_RUN) console.log("\n⚠️  DRY RUN — no data will be written\n");

    if (BRAND_REWRITES.length > 0) {
        console.log(`\n🔤 Brand Rewrites:`);
        for (const r of BRAND_REWRITES) console.log(`   "${r.from}" → "${r.to}"`);
    }

    if (URL_REWRITE_ENABLED) {
        console.log(`\n🔗 URL Rewriting enabled:`);
        console.log(`   Azure: https://${AZURE_BLOB_HOST}/...`);
        if (AZURE_AFD_HOST) console.log(`   AFD:   https://${AZURE_AFD_HOST}/...`);
        console.log(`   →  S3: ${S3_ENDPOINT}/${S3_BUCKET}/...`);
    } else {
        const missing: string[] = [];
        if (!AZURE_BLOB_HOST) missing.push("AZURE_BLOB_HOSTNAME or BLOB_STORAGE_CONNECTION_STRING");
        if (!S3_ENDPOINT) missing.push("S3_ENDPOINT");
        if (!S3_BUCKET) missing.push("S3_BUCKET_NAME");
        console.log(`\n📌 URL Rewriting: DISABLED (missing: ${missing.join(", ")})`);
    }

    if (Object.keys(COLLECTION_MAP).length > 0) {
        console.log(`\n📝 Collection Renames:`);
        for (const [from, to] of Object.entries(COLLECTION_MAP)) console.log(`   ${from} → ${to}`);
    }

    // ── Discover collections ────────────────────────────────────────
    let collectionNames: string[];

    if (explicitCollections.length > 0) {
        collectionNames = explicitCollections;
        console.log(`\n📦 Migrating specified collections: ${collectionNames.join(", ")}`);
    } else {
        console.log("\n🔍 Auto-discovering source collections...");
        const collections = await sourceDb.listCollections().toArray();
        collectionNames = collections
            .map(c => c.name)
            .filter(name => !SYSTEM_COLLECTION_PREFIXES.some(prefix => name.startsWith(prefix)));
        console.log(`   Found ${collectionNames.length}: ${collectionNames.join(", ")}`);
    }

    // ── Migrate each collection ─────────────────────────────────────
    let totalDocs = 0;
    let totalErrors = 0;

    for (const collName of collectionNames) {
        const targetName = COLLECTION_MAP[collName] || collName;
        console.log(`\n📦 ${collName} → ${targetName}`);

        try {
            const sourceCollection = sourceDb.collection(collName);
            const targetCollection = targetDb.collection(targetName);

            // Get source count for progress tracking
            const sourceCount = await sourceCollection.countDocuments();
            console.log(`   Source documents: ${sourceCount}`);

            if (sourceCount === 0) {
                if (!DRY_RUN) {
                    // Create the empty collection on target to replicate schema
                    await targetDb.createCollection(targetName).catch(() => { });
                }
                console.log(`   ⏭️ Empty — created on target (0 documents)`);
                continue;
            }

            // Use cursor with batching for memory-safe reads
            const cursor = sourceCollection.find({}).batchSize(BATCH_SIZE);

            let collDocCount = 0;
            let batch: Record<string, any>[] = [];

            for await (const doc of cursor) {
                const transformed = transformDocument(doc as Record<string, any>);
                batch.push(transformed);

                if (batch.length >= BATCH_SIZE) {
                    if (DRY_RUN) {
                        collDocCount += batch.length;
                        totalDocs += batch.length;
                    } else {
                        const result = await insertBatch(targetCollection, batch);
                        collDocCount += result.inserted;
                        totalDocs += result.inserted;
                        totalErrors += result.errors;
                    }
                    process.stdout.write(`   Progress: ${collDocCount}/${sourceCount} documents...\r`);
                    batch = [];
                }
            }

            // Flush remaining batch
            if (batch.length > 0) {
                if (DRY_RUN) {
                    collDocCount += batch.length;
                    totalDocs += batch.length;
                } else {
                    const result = await insertBatch(targetCollection, batch);
                    collDocCount += result.inserted;
                    totalDocs += result.inserted;
                    totalErrors += result.errors;
                }
            }

            console.log(`\n   ✅ ${collDocCount} documents`);
        } catch (err: any) {
            console.error(`\n   ❌ Error: ${err.message}`);
            totalErrors++;
        }
    }

    // ── Summary ─────────────────────────────────────────────────────
    console.log(`\n════════════════════════════════════════`);
    console.log(`📊 Migration Summary`);
    console.log(`   Total documents: ${totalDocs}`);
    console.log(`   Errors/skipped:  ${totalErrors}`);
    console.log(`════════════════════════════════════════`);

    // ── Verify counts ───────────────────────────────────────────────
    if (!DRY_RUN) {
        console.log("\n🔍 Verifying document counts...");
        for (const collName of collectionNames) {
            const targetName = COLLECTION_MAP[collName] || collName;
            try {
                const sourceCount = await sourceDb.collection(collName).countDocuments();
                const mongoCount = await targetDb.collection(targetName).countDocuments();

                const match = sourceCount === mongoCount ? "✅" : "⚠️";
                console.log(`   ${match} ${collName}: Source=${sourceCount}, Target=${mongoCount}`);
            } catch {
                console.log(`   ⚠️ Could not verify ${collName}`);
            }
        }
    }

    await sourceClient.close();
    await targetClient.close();
    console.log("\n🎉 Migration complete!");
}

// ── Batch insert with duplicate handling ────────────────────────────────

async function insertBatch(
    collection: ReturnType<ReturnType<MongoClient["db"]>["collection"]>,
    docs: Record<string, any>[]
): Promise<{ inserted: number; errors: number }> {
    try {
        const result = await collection.insertMany(docs as any[], { ordered: false });
        return { inserted: result.insertedCount, errors: 0 };
    } catch (err: any) {
        if (err.code === 11000) {
            // Duplicate key errors — some docs inserted, some skipped
            const inserted = err.result?.insertedCount || 0;
            const skipped = docs.length - inserted;
            if (skipped > 0) {
                console.warn(`\n   ⚠️ ${skipped} duplicates skipped`);
            }
            return { inserted, errors: skipped };
        }
        throw err;
    }
}

// ── Document transformation ─────────────────────────────────────────────

function transformDocument(doc: Record<string, any>): Record<string, any> {
    let transformed = { ...doc };

    // Cosmos DB for MongoDB vCore uses _id natively, but if there's a
    // separate `id` field (e.g. from Prisma/app layer), ensure _id is set
    if (transformed.id && !transformed._id) {
        transformed._id = transformed.id;
        delete transformed.id;
    }

    // Remove any residual Cosmos-specific metadata (shouldn't be present
    // in MongoDB API mode, but clean up just in case)
    delete transformed._rid;
    delete transformed._self;
    delete transformed._etag;
    delete transformed._attachments;
    delete transformed._ts;

    // Cast date fields to native MongoDB Date objects
    for (const field of DATE_FIELDS) {
        if (transformed[field]) {
            if (typeof transformed[field] === "string") {
                const d = new Date(transformed[field]);
                if (!isNaN(d.getTime())) transformed[field] = d;
            } else if (typeof transformed[field] === "number") {
                const num = transformed[field];
                const ms = num < 10000000000 ? num * 1000 : num;
                const d = new Date(ms);
                if (!isNaN(d.getTime())) transformed[field] = d;
            }
        }
    }

    // Apply brand rewrites (from --rewrite CLI args)
    if (BRAND_REWRITES.length > 0) {
        transformed = deepRewriteBrands(transformed);
    }

    // Rewrite Azure Blob URLs → S3 URLs
    if (URL_REWRITE_ENABLED) {
        transformed = deepRewriteUrls(transformed);
    }

    return transformed;
}

// ── Brand rewriting ─────────────────────────────────────────────────────

function rewriteBrands(value: string): string {
    for (const { from, to } of BRAND_REWRITES) {
        // Use global replace for each rewrite pair
        value = value.split(from).join(to);
    }
    return value;
}

function deepRewriteBrands(obj: any): any {
    if (typeof obj === "string") return rewriteBrands(obj);
    if (Array.isArray(obj)) return obj.map(deepRewriteBrands);
    if (obj instanceof Date) return obj;
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = deepRewriteBrands(val);
        }
        return result;
    }
    return obj;
}

// ── Azure URL → S3 URL rewriting ────────────────────────────────────────

function rewriteAzureUrl(value: string): string {
    // Match Azure Blob URLs and strip the container prefix
    const blobPattern = new RegExp(
        `https?://${AZURE_BLOB_HOST.replace(/\./g, "\\.")}(/[^"'\\s]*)`,
        "gi"
    );
    value = value.replace(blobPattern, (_match, fullPath) => {
        const segs = fullPath.split("/").filter(Boolean);
        return `${S3_ENDPOINT}/${S3_BUCKET}/${segs.slice(1).join("/")}`;
    });

    // Also catch ANY Azure Front Door URL (*.azurefd.net)
    const afdPattern = /https?:\/\/[^"'\s]*\.azurefd\.net(\/[^"'\s]*)/gi;
    value = value.replace(afdPattern, (_match, fullPath) => {
        const segs = fullPath.split("/").filter(Boolean);
        return `${S3_ENDPOINT}/${S3_BUCKET}/${segs.slice(1).join("/")}`;
    });

    return value;
}

function deepRewriteUrls(obj: any): any {
    if (typeof obj === "string") return rewriteAzureUrl(obj);
    if (Array.isArray(obj)) return obj.map(deepRewriteUrls);
    if (obj instanceof Date) return obj;
    if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, val] of Object.entries(obj)) {
            result[key] = deepRewriteUrls(val);
        }
        return result;
    }
    return obj;
}

// ── Entry point ─────────────────────────────────────────────────────────

main().catch((err) => {
    console.error("💥 Migration failed:", err);
    process.exit(1);
});
