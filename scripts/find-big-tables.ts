import { PrismaClient } from "@prisma/client";
import { DatabaseAdapter } from "../lib/database/db-adapter";

async function run() {
    const dbs = ["intelligent_agent", "ledger1crm", "basalt-onyx", "ledger1cms", "BasaltCRM"];
    const baseUrl = process.env.DATABASE_URL;

    for (const db of dbs) {
        console.log(`\n--- Database: ${db} ---`);
        const u = new URL(baseUrl!);
        u.pathname = `/${db}`;
        const prisma = new PrismaClient({ datasources: { db: { url: u.toString() } } });
        const adapter = new DatabaseAdapter(prisma);

        try {
            const collectionsResult: any = await adapter.executeRawCommand({ listCollections: 1 });
            const collections = collectionsResult.cursor.firstBatch.map((c: any) => c.name);

            for (const coll of collections) {
                try {
                    const count: any = await adapter.executeRawCommand({ count: coll });
                    if (count.n > 0) {
                        console.log(`Collection [${coll}]: ${count.n} records`);
                        if (coll.toLowerCase().includes("candidate")) {
                            const first: any = await adapter.executeRawCommand({ find: coll, limit: 1 });
                            console.log("  Sample Candidate Pool:", first.cursor.firstBatch[0]?.pool);
                        }
                    }
                } catch (e) { }
            }
        } catch (e: any) {
            console.log(`Error: ${e.message}`);
        } finally {
            await prisma.$disconnect();
        }
    }
}

run().catch(console.error);
