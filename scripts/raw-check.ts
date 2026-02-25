import { crmDbAdapter } from "../lib/database/db-adapter";
import { prismadbCrm } from "../lib/prisma-crm";

async function run() {
    const collection = (prismadbCrm as any).crm_Lead_Candidates;
    const count = await collection.count();
    console.log("Total candidates (Prisma count):", count);

    // Try raw find
    const raw: any = await crmDbAdapter.executeRawCommand({
        aggregate: "crm_Lead_Candidates",
        pipeline: [
            { $group: { _id: "$pool", count: { $sum: 1 } } }
        ],
        cursor: {}
    });
    console.log("Groups by pool (Raw):", JSON.stringify(raw.cursor.firstBatch, null, 2));

    // Search for any account that has "Crypto" in the name and check its candidate linkage
    const cryptoAccs = await (prismadbCrm as any).crm_Accounts.findMany({
        where: { name: { contains: "Crypto", mode: "insensitive" } },
        take: 20
    });

    console.log(`\nFound ${cryptoAccs.length} accounts with 'Crypto' in name.`);
    for (const acc of cryptoAccs) {
        const cand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
            where: { accountsIDs: acc.id }
        });
        console.log(`Account: ${acc.name} -> Candidate: ${cand ? 'Found' : 'MISSING'}`);
    }
}

run().catch(console.error);
