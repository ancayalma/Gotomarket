
import { prismadbCrm } from  "../lib/prisma-crm";

async function run() {
    const pools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
        select: { id: true, name: true }
    });

    console.log("Found", pools.length, "pools.");

    for (const pool of pools) {
        const count = await (prismadbCrm as any).crm_Lead_Candidates.count({
            where: { pool: pool.id }
        });
        console.log(`Pool: ${pool.name} (${pool.id}) -> Candidates: ${count}`);
    }

    const totalCandidates = await (prismadbCrm as any).crm_Lead_Candidates.count();
    console.log("\nTotal Candidates in DB:", totalCandidates);

    if (totalCandidates > 0) {
        const sample = await (prismadbCrm as any).crm_Lead_Candidates.findMany({ take: 1 });
        console.log("Sample Candidate:", JSON.stringify(sample, null, 2));
    }
}

run().catch(console.error);
