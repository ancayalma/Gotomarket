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

/**
 * Recursively update strings in an object
 */
function updateStrings(obj) {
    if (!obj || typeof obj !== 'object' || obj instanceof Date || obj instanceof ObjectId) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => updateStrings(item));
    }

    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            if (value.includes(AZURE_BASE)) {
                newObj[key] = value.replace(AZURE_BASE, OVH_BASE);
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

async function fixUrls() {
    console.log("Starting URL Migration (Azure -> OVH)...");
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();

    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name).filter(n => !n.startsWith('system.'));

    for (const name of names) {
        const col = db.collection(name);
        const cursor = col.find({});
        let updateCount = 0;
        let totalCount = 0;
        let bulkOps = [];

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            totalCount++;

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
        if (updateCount > 0) {
            console.log(`Updated ${updateCount}/${totalCount} docs in ${name}`);
        }
    }

    // Task 2: Elevate the Admin User
    console.log("\nElevating Admin Users to God Mode...");
    const usersCol = db.collection('Users');
    const adminEmails = ['sysadm@basalthq.com', 'michaelm@theutilitycompany.co'];

    await usersCol.updateMany(
        { email: { $in: adminEmails } },
        {
            $set: {
                is_admin: true,
                is_account_admin: true,
                userStatus: 'ACTIVE'
            }
        }
    );
    console.log(`Elevated: ${adminEmails.join(', ')}`);

    await client.close();
    console.log("\nURL Migration and User Elevation Complete!");
}

fixUrls().catch(console.error);
