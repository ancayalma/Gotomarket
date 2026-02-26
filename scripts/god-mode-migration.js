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
const AZURE_BASE = "engram1.blob.core.windows.net/ledger1crm";
const OVH_BASE = "basaltcrm.s3.us-west-or.io.cloud.ovh.us";

function updateStrings(obj) {
    if (!obj || typeof obj !== 'object' || obj instanceof Date || obj instanceof ObjectId) return obj;
    if (Array.isArray(obj)) return obj.map(item => updateStrings(item));
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            if (value.includes(AZURE_BASE)) {
                // Ensure proper replacement of the whole URL part
                newObj[key] = value.replace(new RegExp(`https?://${AZURE_BASE}/?`, 'g'), `https://${OVH_BASE}/`);
            } else if (value.includes("blob.core.windows.net")) {
                // Catch any other azure blob variations
                newObj[key] = value.replace(/https?:\/\/[a-z0-9]+\.blob\.core\.windows\.net\/[a-z0-9]+\/?/g, `https://${OVH_BASE}/`);
            } else {
                newObj[key] = value;
            }
        } else if (value && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
            newObj[key] = updateStrings(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

async function main() {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();

    // 1. ELEVATE ADMINS
    console.log("Setting Admin Users to God Mode (PLATFORM_ADMIN + is_admin)...");
    const usersCol = db.collection('Users');
    const adminEmails = ['sysadm@basalthq.com', 'michaelm@theutilitycompany.co', 'founders@theutilitycompany.co', 'info@basalthq.com'];

    await usersCol.updateMany(
        { email: { $in: adminEmails } },
        {
            $set: {
                is_admin: true,
                is_account_admin: true,
                team_role: 'PLATFORM_ADMIN',
                userStatus: 'ACTIVE'
            }
        }
    );

    // 2. FIX TEAM PLAN (Unlock Reports)
    // We'll set the main team to INDIVIDUAL_PRO so it uses the 'all' features fallback
    console.log("Upgrading 'basalthq' team plan to INDIVIDUAL_PRO to unlock all features...");
    const teamCol = db.collection('Team');
    await teamCol.updateMany(
        { slug: { $in: ['basalthq', 'basalt'] } },
        { $set: { subscription_plan: 'INDIVIDUAL_PRO' } }
    );

    // 3. GLOBAL URL MIGRATION
    console.log("Migrating all Azure URLs to OVH S3...");
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name).filter(n => !n.startsWith('system.'));

    for (const name of names) {
        const col = db.collection(name);
        const cursor = col.find({});
        let updateCount = 0;
        let bulkOps = [];

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const fixed = updateStrings(doc);
            if (JSON.stringify(doc) !== JSON.stringify(fixed)) {
                bulkOps.push({
                    replaceOne: {
                        filter: { _id: doc._id },
                        replacement: fixed
                    }
                });
                updateCount++;
            }

            if (bulkOps.length >= 200) {
                await col.bulkWrite(bulkOps);
                bulkOps = [];
            }
        }
        if (bulkOps.length > 0) await col.bulkWrite(bulkOps);
        if (updateCount > 0) console.log(`- Updated ${updateCount} docs in ${name}`);
    }

    await client.close();
    console.log("\nGOD MODE ACTIVATED & MIGRATION COMPLETE.");
}

main().catch(console.error);
