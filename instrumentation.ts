
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { prismadbCrm } = await import('@/lib/prisma-crm');
        const { runLeadGenPipeline } = await import('@/actions/leads/run-pipeline');

        try {
            const stuckJobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({
                where: { status: 'RUNNING' }
            });

            if (stuckJobs.length > 0) {
                console.log('==================================================');
                console.log('   Self-Healing: Resuming stuck LeadGen jobs...   ');
                console.log('==================================================');
                console.log(`[SELF-HEALING] Found ${stuckJobs.length} stuck jobs from previous session.`);

                for (const job of stuckJobs) {
                    // ... rest of the loop logic stays same
                    console.log(`[SELF-HEALING] Attempting to resume job: ${job.id}`);

                    await (prismadbCrm as any).crm_Lead_Gen_Jobs.update({
                        where: { id: job.id },
                        data: {
                            logs: [
                                ...(Array.isArray(job.logs) ? job.logs : []),
                                {
                                    ts: new Date().toISOString(),
                                    msg: '🔄 Server reboot detected. Resuming pipeline execution from last checkpoint...'
                                }
                            ]
                        }
                    });

                    runLeadGenPipeline({
                        jobId: job.id,
                        userId: job.user || 'system',
                    }).catch(async (error) => {
                        console.error(`[SELF-HEALING_RESUME_ERROR] Failed to resume job ${job.id}:`, error);
                        try {
                            await (prismadbCrm as any).crm_Lead_Gen_Jobs.update({
                                where: { id: job.id },
                                data: {
                                    status: 'FAILED',
                                    finishedAt: new Date(),
                                    logs: [
                                        { ts: new Date().toISOString(), level: 'ERROR', msg: `Resume Failed: ${error?.message || String(error)}` }
                                    ]
                                }
                            });
                        } catch (dbErr) {
                            console.error("Critical DB failure", dbErr);
                        }
                    });
                }
                console.log(`[SELF-HEALING] Successfully re-queued ${stuckJobs.length} jobs.`);
                console.log('==================================================');
            }
        } catch (error) {
            // Quietly log error if DB isn't ready yet (common in dev boot)
        }
    }
}
