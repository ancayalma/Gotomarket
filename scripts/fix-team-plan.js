const { MongoClient } = require('mongodb');
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

async function main() {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();

    const teamCol = db.collection('Team');

    // Set EXEMPT for exempt teams
    await teamCol.updateMany(
        { slug: { $in: ['basalthq', 'basalt'] } },
        { $set: { subscription_plan: 'EXEMPT' } }
    );
    console.log("Updated basalthq team plan to EXEMPT");

    // Replace FREE with TESTING
    await teamCol.updateMany(
        { subscription_plan: 'FREE' },
        { $set: { subscription_plan: 'TESTING' } }
    );
    console.log("Updated FREE teams to TESTING");

    await client.close();
}
main().catch(console.error);
