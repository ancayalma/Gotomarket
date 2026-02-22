
import { prismadbCrm } from "./lib/prisma-crm";

async function run() {
    const cryptoAccs = await (prismadbCrm as any).crm_Accounts.findMany({
        where: { name: { contains: "Crypto", mode: "insensitive" } },
        take: 50,
        select: { id: true, name: true }
    });

    console.log(`Checking ${cryptoAccs.length} accounts for any candidate links...`);

    const accIds = cryptoAccs.map((a: any) => a.id);

    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
        where: { accountsIDs: { in: accIds } }
    });

    console.log(`Found ${candidates.length} candidates linked to these accounts.`);

    if (candidates.length > 0) {
        console.log("Sample Linked Candidate:", JSON.stringify(candidates[0], null, 2));
    } else {
        // Search ALL candidates for any links
        const allLinked = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
            where: { accountsIDs: { not: null } },
            select: { accountsIDs: true, pool: true }
        });
        console.log(`Total candidates WITH account links: ${allLinked.length}`);

        const pools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
            where: { id: { in: allLinked.map((l: any) => l.pool) } },
            select: { id: true, name: true }
        });
        console.log("Pools that HAVE candidates:", pools.map((p: any) => p.name));
    }
}

run().catch(console.error);
