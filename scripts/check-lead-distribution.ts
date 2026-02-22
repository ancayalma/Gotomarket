
import { prismadbCrm } from  "../lib/prisma-crm";

async function check() {
    const pools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
        select: {
            id: true,
            name: true,
            _count: { select: { lead_maps: true } }
        }
    });

    console.log("Pool ID | Lead Maps | Name");
    console.log("-------------------------------");
    for (const pool of pools) {
        console.log(`${pool.id} | ${pool._count.lead_maps} | ${pool.name}`);
    }
}

check().catch(console.error);
