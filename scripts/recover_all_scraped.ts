
import { prismadbCrm } from "../lib/prisma-crm";

async function recoverAllScraped() {
    console.log("🚀 STARTING SCRAPED DATA RECOVERY...");

    // 1. Map all jobs to pools
    const allJobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({
        select: { id: true, pool: true, user: true }
    });
    const jobToPool = new Map();
    allJobs.forEach((j: any) => {
        jobToPool.set(j.id, { poolId: j.pool, userId: j.user });
    });
    console.log(`Mapped ${jobToPool.size} jobs.`);

    // 2. Fetch all global companies
    const globalCompanies = await (prismadbCrm as any).crm_Global_Companies.findMany();
    console.log(`Processing ${globalCompanies.length} global companies...`);

    let candidateLinksCreated = 0;
    let accountsCreated = 0;
    let errors = 0;

    for (const gc of globalCompanies) {
        try {
            // Extract job ID from provenance
            const jobId = gc.provenance?.jobId || gc.provenance?.sources?.[0]?.jobId;
            if (!jobId || !jobToPool.has(jobId)) continue;

            const { poolId, userId } = jobToPool.get(jobId);

            // a. Find or create account
            let account = await (prismadbCrm as any).crm_Accounts.findFirst({
                where: {
                    OR: [
                        { website: gc.domain || undefined },
                        { name: gc.companyName }
                    ]
                }
            });

            if (!account) {
                account = await (prismadbCrm as any).crm_Accounts.create({
                    data: {
                        name: gc.companyName,
                        website: gc.domain || "",
                        description: gc.description || "",
                        type: "Prospect",
                        status: "Active",
                        createdBy: userId || null,
                        team_id: "6934998c7038863976a7a5fd", // Default team
                        v: 1
                    }
                });
                accountsCreated++;
            }

            // b. Find or create lead candidate
            const existingCand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                where: { pool: poolId, accountsIDs: account.id }
            });

            if (!existingCand) {
                await (prismadbCrm as any).crm_Lead_Candidates.create({
                    data: {
                        pool: poolId,
                        companyName: gc.companyName,
                        domain: gc.domain || null,
                        industry: gc.industry || null,
                        status: "NEW",
                        accountsIDs: account.id,
                        dedupeKey: `recovery_gc_${gc.id}`,
                        v: 1
                    }
                });
                candidateLinksCreated++;
            }
        } catch (e) {
            console.error(`Error processing GC ${gc.id}:`, e);
            errors++;
        }
    }

    console.log(`--- Recovery Summary ---`);
    console.log(`Candidate links created: ${candidateLinksCreated}`);
    console.log(`New Accounts created: ${accountsCreated}`);
    console.log(`Errors: ${errors}`);
}

recoverAllScraped().catch(console.error);
