
import { PrismaClient } from "@prisma/client";

async function checkDb(url: string, name: string) {
    console.log(`\n--- Checking Database: ${name} ---`);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        const pools = await prisma.crm_Lead_Pools.count();
        const candidates = await prisma.crm_Lead_Candidates.count();
        const accounts = await prisma.crm_Accounts.count();
        const contacts = await prisma.crm_Contacts.count();
        console.log(`Pools: ${pools}`);
        console.log(`Candidates: ${candidates}`);
        console.log(`Accounts: ${accounts}`);
        console.log(`Contacts: ${contacts}`);

        if (candidates > 0) {
            const sample = await prisma.crm_Lead_Candidates.findFirst({
                include: { assigned_pool: true }
            });
            console.log(`Sample Candidate Pool: ${sample?.assigned_pool?.name} (${sample?.pool})`);
        }
    } catch (e: any) {
        console.log(`Error checking ${name}: ${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

async function run() {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
        console.error("No DATABASE_URL found");
        return;
    }

    const dbs = ["intelligent_agent", "ledger1crm", "basalt-onyx", "ledger1cms", "BasaltCRM"];

    for (const db of dbs) {
        const u = new URL(baseUrl);
        u.pathname = `/${db}`;
        await checkDb(u.toString(), db);
    }
}

run().catch(console.error);
