/**
 * Built-in cron scheduler — runs inside the Next.js process.
 * 
 * Jobs are stored in `crm_Cron_Jobs` (per-team, per-user).
 * The scheduler polls the DB every tick interval and executes
 * any jobs whose `next_run_at` has passed.
 * 
 * Starts automatically via instrumentation.ts on app boot.
 */

import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

// ─── Singleton Guard ─────────────────────────────────────────────────────────

let isRunning = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;

// How often the scheduler checks for due jobs (default: 60s)
const TICK_INTERVAL_MS = parseInt(process.env.CRON_TICK_INTERVAL_MS || "60000", 10);

// ─── Job Executors ───────────────────────────────────────────────────────────

type JobExecutor = (job: any) => Promise<{ processed: number; errors: number }>;

const JOB_EXECUTORS: Record<string, JobExecutor> = {
  AUTO_FOLLOWUP: executeAutoFollowup,
  EMAIL_SYNC: executeEmailSync,
  DEAL_AGENT_CHECK: executeDealAgentCheck,
};

async function executeAutoFollowup(job: any): Promise<{ processed: number; errors: number }> {
  const { prismadbCrm } = await import("@/lib/prisma-crm");

  // Find eligible outreach items for this campaign
  const campaignId = job.campaign_id;
  if (!campaignId) return { processed: 0, errors: 0 };

  const campaign = await (prismadbCrm as any).crm_Outreach_Campaigns.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      followup_enabled: true,
      followup_delay_hours: true,
      followup_max_count: true,
      followup_prompt: true,
      status: true,
    },
  });

  if (!campaign || !campaign.followup_enabled || campaign.status !== "ACTIVE") {
    return { processed: 0, errors: 0 };
  }

  const delayMs = (campaign.followup_delay_hours || 72) * 3600 * 1000;
  const maxFollowups = campaign.followup_max_count || 2;
  const cutoff = new Date(Date.now() - delayMs);

  const eligibleItems = await (prismadbCrm as any).crm_Outreach_Items.findMany({
    where: {
      campaign_id: campaignId,
      status: { in: ["SENT", "DELIVERED"] },
      followup_count: { lt: maxFollowups },
      sentAt: { lte: cutoff },
    },
    select: {
      id: true,
      lead: true,
      followup_count: true,
      candidate_email: true,
      candidate_name: true,
    },
    take: 50, // Process in batches
  });

  let processed = 0;
  let errors = 0;

  for (const item of eligibleItems) {
    try {
      if (!item.lead) continue;

      // Check lead status
      const lead = await (prismadbCrm as any).crm_Leads.findUnique({
        where: { id: item.lead },
        select: { id: true, opt_out: true, status: true },
      });

      if (!lead || lead.opt_out || lead.status === "UNSUBSCRIBED") continue;

      // Trigger follow-up via the existing endpoint logic
      const followupRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/outreach/followup/${item.lead}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            campaignId,
            promptOverride: campaign.followup_prompt || undefined,
          }),
        }
      );

      if (followupRes.ok) {
        await (prismadbCrm as any).crm_Outreach_Items.update({
          where: { id: item.id },
          data: {
            followup_count: (item.followup_count || 0) + 1,
            next_followup_at: new Date(Date.now() + delayMs),
          },
        });
        processed++;
      } else {
        errors++;
      }
    } catch (err: any) {
      systemLogger.warn(`[CRON] Follow-up error for item ${item.id}: ${err?.message}`);
      errors++;
    }
  }

  return { processed, errors };
}

async function executeEmailSync(_job: any): Promise<{ processed: number; errors: number }> {
  // Placeholder — wire to existing Gmail sync when needed
  return { processed: 0, errors: 0 };
}

async function executeDealAgentCheck(_job: any): Promise<{ processed: number; errors: number }> {
  // Placeholder — wire to deal agent batch processing when needed
  return { processed: 0, errors: 0 };
}

// ─── Core Scheduler ──────────────────────────────────────────────────────────

async function tick() {
  try {
    const now = new Date();

    // Find all jobs that are due
    const dueJobs = await prismadb.crm_Cron_Jobs.findMany({
      where: {
        status: "ACTIVE",
        next_run_at: { lte: now },
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } },
        ],
      },
      orderBy: { next_run_at: "asc" },
      take: 20, // Limit concurrent processing
    });

    if (dueJobs.length === 0) return;

    systemLogger.info(`[CRON] Tick: ${dueJobs.length} job(s) due`);

    for (const job of dueJobs) {
      const executor = JOB_EXECUTORS[job.job_type];

      if (!executor) {
        systemLogger.warn(`[CRON] Unknown job type: ${job.job_type} (job ${job.id})`);
        continue;
      }

      // Check max_runs limit
      if (job.max_runs && job.run_count >= job.max_runs) {
        await prismadb.crm_Cron_Jobs.update({
          where: { id: job.id },
          data: { status: "COMPLETED" },
        });
        systemLogger.info(`[CRON] Job ${job.id} completed (max_runs=${job.max_runs} reached)`);
        continue;
      }

      try {
        const result = await executor(job);

        // Update job tracking
        await prismadb.crm_Cron_Jobs.update({
          where: { id: job.id },
          data: {
            last_run_at: now,
            next_run_at: new Date(now.getTime() + job.interval_ms),
            run_count: { increment: 1 },
            error_count: result.errors > 0 ? { increment: 1 } : undefined,
            last_error: result.errors > 0 ? `${result.errors} errors in batch` : null,
            last_result: result as any,
          },
        });

        systemLogger.info(
          `[CRON] Job ${job.id} (${job.job_type}): processed=${result.processed}, errors=${result.errors}`
        );
      } catch (err: any) {
        const newErrorCount = (job.error_count || 0) + 1;

        await prismadb.crm_Cron_Jobs.update({
          where: { id: job.id },
          data: {
            last_run_at: now,
            next_run_at: new Date(now.getTime() + job.interval_ms),
            error_count: newErrorCount,
            last_error: err?.message || String(err),
            // Auto-pause after 10 consecutive errors
            ...(newErrorCount >= 10 ? { status: "FAILED" } : {}),
          },
        });

        systemLogger.error(`[CRON] Job ${job.id} failed: ${err?.message}`);
      }
    }
  } catch (err: any) {
    systemLogger.error(`[CRON] Tick error: ${err?.message}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startCronScheduler() {
  if (isRunning) {
    systemLogger.info("[CRON] Scheduler already running — skipping duplicate start");
    return;
  }

  isRunning = true;
  systemLogger.info(
    `[CRON] ═══════════════════════════════════════════════`
  );
  systemLogger.info(
    `[CRON]   Built-in scheduler started (tick: ${TICK_INTERVAL_MS}ms)`
  );
  systemLogger.info(
    `[CRON] ═══════════════════════════════════════════════`
  );

  // Run first tick after 10s to let the app fully boot
  setTimeout(() => {
    tick();
    tickTimer = setInterval(tick, TICK_INTERVAL_MS);
  }, 10_000);
}

export function stopCronScheduler() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  systemLogger.info("[CRON] Scheduler stopped");
}

/**
 * Register a new cron job for a team/user.
 * Returns the created job record.
 */
export async function registerCronJob(params: {
  teamId: string;
  userId: string;
  jobType: string;
  label?: string;
  campaignId?: string;
  intervalMs?: number;
  cronExpression?: string;
  maxRuns?: number;
  expiresAt?: Date;
}): Promise<any> {
  const {
    teamId,
    userId,
    jobType,
    label,
    campaignId,
    intervalMs = 3600000,
    cronExpression,
    maxRuns,
    expiresAt,
  } = params;

  // Check for existing active job of same type for same campaign (prevent duplicates)
  if (campaignId) {
    const existing = await prismadb.crm_Cron_Jobs.findFirst({
      where: {
        campaign_id: campaignId,
        job_type: jobType,
        status: "ACTIVE",
      },
    });
    if (existing) {
      systemLogger.info(
        `[CRON] Job already exists for campaign ${campaignId} type ${jobType} — returning existing`
      );
      return existing;
    }
  }

  const job = await prismadb.crm_Cron_Jobs.create({
    data: {
      team_id: teamId,
      user_id: userId,
      campaign_id: campaignId || undefined,
      job_type: jobType,
      label: label || `${jobType} — ${new Date().toLocaleDateString()}`,
      status: "ACTIVE",
      interval_ms: intervalMs,
      cron_expression: cronExpression || undefined,
      next_run_at: new Date(Date.now() + intervalMs),
      max_runs: maxRuns || undefined,
      expires_at: expiresAt || undefined,
    },
  });

  systemLogger.info(
    `[CRON] Registered job: ${job.id} (${jobType}) for team=${teamId}, user=${userId}, interval=${intervalMs}ms`
  );

  return job;
}

/**
 * Get all cron jobs for a team (with optional filters).
 */
export async function getTeamCronJobs(
  teamId: string,
  filters?: { status?: string; jobType?: string; userId?: string }
) {
  const where: any = { team_id: teamId };
  if (filters?.status) where.status = filters.status;
  if (filters?.jobType) where.job_type = filters.jobType;
  if (filters?.userId) where.user_id = filters.userId;

  return prismadb.crm_Cron_Jobs.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Count active jobs for a team (for quota enforcement).
 */
export async function countActiveJobs(teamId: string): Promise<number> {
  return prismadb.crm_Cron_Jobs.count({
    where: { team_id: teamId, status: "ACTIVE" },
  });
}
