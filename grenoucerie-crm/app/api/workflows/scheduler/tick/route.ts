import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { resumeWorkflowExecution } from "@/lib/workflow/engine";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/workflows/scheduler/tick
 * Cron-triggered endpoint that checks for paused workflows
 * whose scheduled_at has elapsed and resumes them.
 * 
 * Call this via a cron job every minute:
 *   curl -X POST https://crm.basalthq.com/api/workflows/scheduler/tick \
 *     -H "Authorization: Bearer CRON_SECRET"
 * 
 * Or use Vercel Cron, AWS EventBridge, or any cron scheduler.
 */
export async function POST(req: Request) {
    try {
        // Simple auth check for cron
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Find all paused executions whose delay has elapsed
        const readyExecutions = await prismadb.crm_Workflow_Execution.findMany({
            where: {
                status: "RUNNING",
                scheduled_at: { lte: new Date() },
            },
            select: { id: true },
            take: 10, // Process in batches to avoid timeouts
        });

        if (readyExecutions.length === 0) {
            return NextResponse.json({ resumed: 0 });
        }

        systemLogger.info(`[WORKFLOW_SCHEDULER] Found ${readyExecutions.length} executions ready to resume.`);

        let resumed = 0;
        for (const exec of readyExecutions) {
            try {
                await resumeWorkflowExecution(exec.id);
                resumed++;
            } catch (err: any) {
                systemLogger.error(`[WORKFLOW_SCHEDULER] Failed to resume ${exec.id}:`, err);
            }
        }

        return NextResponse.json({ resumed, total: readyExecutions.length });
    } catch (error: any) {
        systemLogger.error("[WORKFLOW_SCHEDULER] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
