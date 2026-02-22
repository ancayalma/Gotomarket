
import { prismadbCrm } from "./lib/prisma-crm";

async function run() {
    const collection = (prismadbCrm as any).crm_Lead_Candidates;

    // Find candidates created yesterday or later
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    const raw = await (prismadbCrm as any).$runCommandRaw({
        find: "crm_Lead_Candidates",
        filter: {
            // If candidates don't have createdAt, we can't filter by it.
            // But let's look for anything that ISN'T the ISO Campaign pool.
            pool: { $ne: "699792e83e5cb6e1f2525326" }
        },
        limit: 5
    });

    console.log("Other candidates (raw):", JSON.stringify(raw.cursor.firstBatch, null, 2));

    // Check if there are ANY records in crm_Lead_Candidates besides the 188
    const totalRaw = await (prismadbCrm as any).$runCommandRaw({
        count: "crm_Lead_Candidates"
    });
    console.log("Total Raw Count:", totalRaw.n);
}

run().catch(console.error);
