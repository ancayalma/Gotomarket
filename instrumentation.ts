
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { prismadbCrm } = await import('@/lib/prisma-crm');
        const { runLeadGenPipeline } = await import('@/actions/leads/run-pipeline');

        console.log('==================================================');
        console.log('   Self-Healing: Resuming stuck LeadGen jobs...   ');
        console.log('==================================================');

        try {
            // Find all jobs that were stuck in RUNNING state
            const stuckJobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({
                where: { status: 'RUNNING' }
            });

            if (stuckJobs.length > 0) {
                console.log(`[SELF-HEALING] Found ${stuckJobs.length} stuck jobs from previous session.`);

                for (const job of stuckJobs) {
                    console.log(`[SELF-HEALING] Attempting to resume job: ${job.id}`);

                    // 1. Log the resumption attempt
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

                    // 2. Re-trigger the background process
                    // We don't await this as we want the server to finish booting
                    runLeadGenPipeline({
                        jobId: job.id,
                        userId: job.user || 'system', // Fallback if user ID is missing
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
                            console.error("Critical DB failure during resume error logging", dbErr);
                        }
                    });
                }

                console.log(`[SELF-HEALING] Successfully re-queued ${stuckJobs.length} jobs for background processing.`);
            } else {
                console.log('[SELF-HEALING] No stuck jobs found. System healthy.');
            }
        } catch (error) {
            console.error('[SELF-HEALING] Error during job resumption:', error);
        }
        console.log('==================================================');
    }
}
