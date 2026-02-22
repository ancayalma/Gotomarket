
import { prismadb } from  "../lib/prisma";
import { prismadbCrm } from  "../lib/prisma-crm";

async function check() {
    console.log("--- MAIN DB (prismadb) ---");
    const poolsMain = await (prismadb as any).crm_Lead_Pools.count();
    const candidatesMain = await (prismadb as any).crm_Lead_Candidates.count();
    console.log("Pools:", poolsMain);
    console.log("Candidates:", candidatesMain);

    console.log("\n--- CRM DB (prismadbCrm) ---");
    const poolsCrm = await (prismadbCrm as any).crm_Lead_Pools.count();
    const candidatesCrm = await (prismadbCrm as any).crm_Lead_Candidates.count();
    console.log("Pools:", poolsCrm);
    console.log("Candidates:", candidatesCrm);

    if (candidatesCrm > 0) {
        const samplePools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
            take: 5,
            include: { _count: { select: { candidates: true } } }
        });
        console.log("\nSample Pools (CRM DB):", JSON.stringify(samplePools, null, 2));
    }
}

check().catch(console.error);
