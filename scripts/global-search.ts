
import { prismadbCrm } from  "../lib/prisma-crm";

async function run() {
    const dbs = ["intelligent_agent", "ledger1crm", "basalt-onyx", "ledger1cms", "BasaltCRM"];
    const targetName = "Crypto Yield Capital";

    for (const db of dbs) {
        console.log(`\n--- Searching Database: ${db} ---`);
        const baseUrl = process.env.DATABASE_URL;
        const u = new URL(baseUrl!);
        u.pathname = `/${db}`;

        // Using raw command to list all collections and search them
        const collectionsResult = await (prismadbCrm as any).$runCommandRaw({ listCollections: 1 });
        const collections = collectionsResult.cursor.firstBatch.map((c: any) => c.name);

        for (const coll of collections) {
            try {
                const count = await (prismadbCrm as any).$runCommandRaw({
                    count: coll,
                    query: { $or: [{ name: targetName }, { companyName: targetName }, { fullName: targetName }] }
                });
                if (count.n > 0) {
                    console.log(`Found ${count.n} records in collection [${coll}] in DB [${db}]`);
                }
            } catch (e) { }
        }
    }
}

run().catch(console.error);
