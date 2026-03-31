import { prismadbCrm } from "../lib/prisma-crm";

async function run() {
    const jobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({});
    const job = jobs[jobs.length - 1]; // dirty but works for a quick test 
    console.log("Latest job counters:", JSON.stringify(job?.counters, null, 2));
}

run().catch(console.error).finally(() => process.exit(0));
