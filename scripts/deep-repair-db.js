const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

function getEnv(key) {
    const envPath = path.join(process.cwd(), '.env');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        if (line.trim().startsWith('#')) continue;
        const [k, ...v] = line.split('=');
        if (k.trim() === key) {
            let val = v.join('=').trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            return val;
        }
    }
    return null;
}

const url = getEnv('DATABASE_URL');
const AZURE_HOST = "engram1.blob.core.windows.net";
const OVH_HOST = "basaltcrm.s3.us-west-or.io.cloud.ovh.us";

function deepReplace(obj, stats) {
    if (!obj || typeof obj !== 'object' || obj instanceof Date || obj instanceof ObjectId) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => deepReplace(item, stats));
    }

    const newObj = {};
    for (let [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            if (value.includes(AZURE_HOST)) {
                // Precise replacement for the user's pattern
                // https://engram1.blob.core.windows.net/ledger1crm/avatars/...
                // -> https://basaltcrm.s3.us-west-or.io.cloud.ovh.us/avatars/
                const oldVal = value;
                const newVal = value.replace(new RegExp(`https?://${AZURE_HOST}/ledger1crm/`, 'g'), `https://${OVH_HOST}/`);
                if (oldVal !== newVal) {
                    newObj[key] = newVal;
                    stats.found++;
                    console.log(`  [MATCH] Found Azure URL in field '${key}': ${oldVal} -> ${newVal}`);
                } else {
                    newObj[key] = value;
                }
            } else {
                newObj[key] = value;
            }
        } else if (value && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
            newObj[key] = deepReplace(value, stats);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

async function run() {
    console.log("Starting DEEP DATABASE REPAIR...");
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();

    // 1. ELEVATE ADMINS (AGAIN)
    const adminEmails = ['michaelm@theutilitycompany.co', 'sysadm@basalthq.com', 'founders@theutilitycompany.co', 'info@basalthq.com'];
    console.log(`Ensuring Admin access for: ${adminEmails.join(', ')}`);
    await db.collection('Users').updateMany(
        { email: { $in: adminEmails } },
        { $set: { is_admin: true, is_account_admin: true, team_role: 'PLATFORM_ADMIN', userStatus: 'ACTIVE' } }
    );

    // 2. REPAIR PLAN (AGAIN)
    console.log("Ensuring basalthq is on ENTERPRISE plan...");
    await db.collection('Team').updateMany(
        { slug: 'basalthq' },
        { $set: { subscription_plan: 'ENTERPRISE' } }
    );

    // 3. DEEP SCAN ALL COLLECTIONS
    const collections = await db.listCollections().toArray();
    for (const colInfo of collections) {
        const colName = colInfo.name;
        if (colName.startsWith('system.')) continue;

        console.log(`Scanning collection: ${colName}...`);
        const col = db.collection(colName);
        const cursor = col.find({});
        let bulkOps = [];
        const stats = { found: 0 };

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const originalJson = JSON.stringify(doc);
            const repaired = deepReplace(doc, stats);
            const repairedJson = JSON.stringify(repaired);

            if (originalJson !== repairedJson) {
                bulkOps.push({
                    replaceOne: {
                        filter: { _id: doc._id },
                        replacement: repaired
                    }
                });
            }

            if (bulkOps.length >= 100) {
                await col.bulkWrite(bulkOps);
                bulkOps = [];
            }
        }

        if (bulkOps.length > 0) {
            await col.bulkWrite(bulkOps);
        }

        if (stats.found > 0) {
            console.log(`[DONE] ${colName}: Repaired ${stats.found} fields.`);
        }
    }

    await client.close();
    console.log("\nDEEP REPAIR COMPLETE.");
}

run().catch(console.error);
