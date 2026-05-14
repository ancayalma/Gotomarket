import { prismadbCrm } from "@/lib/prisma-crm";
import { runSerpScraperForJob } from "@/lib/scraper/serp";
import { enrichCompaniesForJob } from "@/lib/scraper/company-enrichment";
import { calculateCompanyICPScore } from "@/lib/scraper/icp-scoring";
import { runAgenticLeadGeneration } from "@/lib/scraper/agentic-scraper";
import { enrichPeopleForJob } from "@/lib/scraper/people-enrichment";

/**
 * Lead Generation Pipeline
 * Orchestrates SERP discovery, company enrichment, ToS-safe people enrichment, and ICP scoring.
 * Supports agentic AI mode (autonomous search/analysis/save) and standard mode (SERP + crawlers).
 * Updates job status, counters, and logs with production-grade steps and error handling.
 */
export async function runLeadGenPipeline({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}): Promise<{ createdCandidates: number; createdContacts: number }> {
  const db: any = prismadbCrm;
  const mainDb = (await import("@/lib/prisma")).prismadb;
  const { getTeamLeadGenCredits, consumeLeadGenCredits } = await import("@/lib/scraper/credits");

  // Fetch job
  const job = await db.crm_Lead_Gen_Jobs.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  // 1. Fetch team, role, and check initial credits
  const user = await mainDb.users.findUnique({
    where: { id: userId },
    select: {
      team_id: true,
      is_admin: true,
      is_account_admin: true,
      assigned_role: { select: { name: true } },
      assigned_team: {
        include: {
          assigned_plan: true
        }
      }
    }
  });
  if (!user?.team_id) throw new Error("User has no team association for billing.");
  const teamId = user.team_id;

  // Platform admins bypass credits entirely
  const isPlatformAdmin = user.assigned_role?.name === "SuperAdmin" || user.is_admin || user.is_account_admin;

  const planSlug = user.assigned_team?.assigned_plan?.slug || user.assigned_team?.subscription_plan || "FREE";
  const isFreePlan = planSlug.toUpperCase() === "FREE" || planSlug.toUpperCase() === "FREE_TRIAL";

  // ── FREE PLAN LIMITS ──────────────────────────────────────────────────
  // Free accounts: max 1 lead gen run per month, max 50 contacts per month
  const FREE_MONTHLY_RUNS = 1;
  const FREE_MONTHLY_CONTACTS = 50;

  if (isFreePlan && !isPlatformAdmin) {
    // Count completed/running jobs for this team in the current calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const teamMemberIds = (await mainDb.users.findMany({
      where: { team_id: teamId },
      select: { id: true }
    })).map((u: any) => u.id);

    const monthlyJobs = await db.crm_Lead_Gen_Jobs.findMany({
      where: {
        user: { in: teamMemberIds },
        startedAt: { gte: monthStart },
        status: { in: ["SUCCESS", "RUNNING", "QUEUED"] },
        id: { not: jobId } // Don't count this job itself
      },
      select: { id: true, counters: true }
    });

    if (monthlyJobs.length >= FREE_MONTHLY_RUNS) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          logs: [
            ...(Array.isArray(job.logs) ? job.logs : []),
            { ts: new Date().toISOString(), level: "ERROR", msg: `Free plan limit: ${FREE_MONTHLY_RUNS} lead gen run(s) per month. Upgrade for unlimited runs.` }
          ]
        },
      });
      throw new Error(`Free plan allows ${FREE_MONTHLY_RUNS} lead gen run(s) per month. Upgrade your plan for unlimited access.`);
    }

    // Count contacts already captured this month
    let monthlyContacts = 0;
    monthlyJobs.forEach((j: any) => {
      monthlyContacts += (j.counters?.contactsCreated || j.counters?.contactsSaved || 0);
    });
    const remainingContacts = Math.max(0, FREE_MONTHLY_CONTACTS - monthlyContacts);
    if (remainingContacts <= 0) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          logs: [
            ...(Array.isArray(job.logs) ? job.logs : []),
            { ts: new Date().toISOString(), level: "ERROR", msg: `Free plan limit: ${FREE_MONTHLY_CONTACTS} contacts per month reached. Upgrade for unlimited contacts.` }
          ]
        },
      });
      throw new Error(`Free plan contact limit (${FREE_MONTHLY_CONTACTS}/month) reached. Upgrade your plan.`);
    }

    // Cap the target for this job
    job._freeContactCap = remainingContacts;

    // Enforce Puppeteer scraping for FREE plans (disable paid APIs)
    if (!job.providers) job.providers = {};
    job.providers.agenticAI = false;
    job.providers.aiQueries = false;
    job.providers.aiAnalysis = false;
    job.providers.serp = true; // Rely on Puppeteer DDG SERP 
    job.providers.crawler = true; // Rely on Puppeteer enrichment
  }

  if (!isPlatformAdmin) {
    const { resetLeadGenCredits } = await import("@/lib/scraper/credits");
    let currentCredits = await getTeamLeadGenCredits(teamId);
    // Auto-initialize credits on first run if no config exists (0 balance)
    if (currentCredits === 0) {
      currentCredits = await resetLeadGenCredits(teamId);
    }
    
    // Only fail if exactly 0. Negative balances signify unlimited mode (e.g. starting at -1 and decrementing down to track usage)
    if (currentCredits === 0) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), level: "ERROR", msg: "Out of LeadGen credits. Please top up in AI Settings." }
          ]
        },
      });
      throw new Error("No LeadGen credits remaining.");
    }
  }

  // Mark RUNNING
  const isResume = !!job.startedAt;
  await db.crm_Lead_Gen_Jobs.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: job.startedAt || new Date()
    },
  });

  let createdCandidates = 0;
  let createdContacts = 0;
  let creditsConsumed = 0;
  // Aggregation counters from SERP step
  let uniqueDomains: string[] = [];
  let serpEvents = 0;
  let enrichedCount = 0;
  let enrichmentFailed = 0;
  let peopleContactsAdded = 0;

  // Use agentic AI mode by default (most powerful)
  // Only fall back to old SERP scraper if explicitly disabled
  const useOldSerpScraper = job.providers?.agenticAI === false;

  if (!useOldSerpScraper) {
    // Autonomous AI agent mode - AI makes all decisions
    const pool = await db.crm_Lead_Pools.findUnique({
      where: { id: job.pool },
      select: { icpConfig: true }
    });

    let maxCredits = job.counters?.targetCredits || (pool?.icpConfig as any)?.limits?.maxCompanies || 100;
    // Cap for free plan contact limit
    if (job._freeContactCap && job._freeContactCap < maxCredits) {
      maxCredits = job._freeContactCap;
    }

    const result = await runAgenticLeadGeneration(
      jobId,
      userId,
      pool?.icpConfig as any || {},
      job.pool,
      maxCredits,
      {
        companiesSaved: job.counters?.companiesSaved || 0,
        contactsSaved: job.counters?.contactsSaved || 0,
        queryTemplates: Array.isArray(job.queryTemplates) ? job.queryTemplates : []
      }
    );

    // Check if the job was stopped by the user during the agent phase
    const postAgentJob = await db.crm_Lead_Gen_Jobs.findUnique({ where: { id: jobId }, select: { status: true } });
    if (postAgentJob?.status === "STOPPED" || postAgentJob?.status === "FAILED") {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: `Pipeline halted: Job was ${postAgentJob.status.toLowerCase()} during AI phase. Skipping downstream enrichment.` }
          ]
        }
      });
      return { createdCandidates: result.companiesSaved, createdContacts: result.contactsSaved };
    }

    // SERP fallback: only run if agentic returned zero companies and SERP is enabled
    let serpAddedCandidates = 0;
    const agentSaved = result.companiesSaved || 0;
    const allowSerpFallback = (job.providers?.serpFallback === true) && (job.providers?.serp !== false) && agentSaved === 0;
    if (allowSerpFallback) {
      // Log fallback
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: "Agentic found 0 companies; SERP fallback enabled -> running SERP..." }
          ]
        }
      });
      try {
        const serpRes = await runSerpScraperForJob(jobId, userId);
        serpAddedCandidates = serpRes.createdCandidates || 0;
        serpEvents += serpRes.sourceEvents || 0;
        uniqueDomains = Array.from(new Set([...(uniqueDomains || []), ...(serpRes.uniqueDomains || [])]));
      } catch (error) {
        await db.crm_Lead_Gen_Jobs.update({
          where: { id: jobId },
          data: {
            logs: [
              ...(job.logs || []),
              { ts: new Date().toISOString(), level: "ERROR", msg: `SERP fallback failed: ${(error as Error)?.message || String(error)}` }
            ]
          }
        });
      }
    } else {
      // SERP disabled — purely agentic mode, no fallback needed
    }

    // People enrichment is SKIPPED in agentic mode — the AI agent already
    // discovers and saves contacts during its crawl loop. Running it here
    // would cause duplicate contacts and inflated credit consumption.
    const peopleContactsAdded = 0;

    createdCandidates = result.companiesSaved + serpAddedCandidates;

    // (Agentic real-time credit deduction occurs directly inside agent loop now)
    // Fetch the latest counters from the agent's own writes (includes targetCredits, tokenHistory, etc.)
    const latestJob = await db.crm_Lead_Gen_Jobs.findUnique({ where: { id: jobId }, select: { counters: true, logs: true } });
    const agentCounters = latestJob?.counters ?? {};
    await db.crm_Lead_Gen_Jobs.update({
      where: { id: jobId },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        counters: {
          ...agentCounters,
          companiesFound: result.companiesSaved,
          candidatesCreated: result.companiesSaved + serpAddedCandidates,
          contactsCreated: result.contactsSaved || 0,
          agentIterations: result.iterations,
          sourceEvents: (agentCounters.sourceEvents ?? 0) + serpEvents,
          peopleContactsAdded
        },
        logs: [
          ...(latestJob?.logs || []),
          { ts: new Date().toISOString(), msg: `🤖 Agentic AI complete: ${result.companiesSaved} companies, ${result.contactsSaved} contacts` },
        ]
      }
    });

    return { createdCandidates: result.companiesSaved + serpAddedCandidates, createdContacts: result.contactsSaved || 0 };
  }

  // Standard pipeline mode
  const serpEnabled = job.providers?.serp !== false;
  if (serpEnabled) {
    try {
      const res = await runSerpScraperForJob(jobId, userId);
      createdCandidates += res.createdCandidates;
      serpEvents += res.sourceEvents;
      uniqueDomains = res.uniqueDomains;

      uniqueDomains = res.uniqueDomains;
    } catch (error) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs ?? []),
            { ts: new Date().toISOString(), level: "ERROR", msg: `SERP scraping failed: ${(error as Error)?.message || String(error)}` },
          ],
        },
      });
    }
  }

  // Check if standard pipeline stopped
  const postSerpJob = await db.crm_Lead_Gen_Jobs.findUnique({ where: { id: jobId }, select: { status: true } });
  if (postSerpJob?.status === "STOPPED" || postSerpJob?.status === "FAILED") {
      return { createdCandidates, createdContacts };
  }

  // Run company enrichment when enabled
  const enrichmentEnabled = job.providers?.crawler !== false;
  if (enrichmentEnabled && createdCandidates > 0) {
    try {
      const enrichmentResult = await enrichCompaniesForJob(jobId, 50, userId);
      enrichedCount = enrichmentResult.enriched;
      enrichmentFailed = enrichmentResult.failed;

      enrichmentFailed = enrichmentResult.failed;

      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs ?? []),
            { ts: new Date().toISOString(), msg: `Company enrichment: ${enrichedCount} enriched, ${enrichmentFailed} failed.` },
          ],
        },
      });
    } catch (error) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs ?? []),
            { ts: new Date().toISOString(), level: "ERROR", msg: `Company enrichment failed: ${(error as Error)?.message || String(error)}` },
          ],
        },
      });
    }
  }

  // Check if standard pipeline stopped before people enrichment
  const postEnrichJob = await db.crm_Lead_Gen_Jobs.findUnique({ where: { id: jobId }, select: { status: true } });
  if (postEnrichJob?.status === "STOPPED" || postEnrichJob?.status === "FAILED") {
      return { createdCandidates, createdContacts };
  }

  // ToS-safe people enrichment (company site parsing) when enabled
  const peopleEnrichmentEnabled = job.providers?.peopleEnrichment !== false;
  if (peopleEnrichmentEnabled && (createdCandidates > 0)) {
    try {
      const pe = await enrichPeopleForJob(jobId, userId);
      createdContacts += pe.contactsAdded || 0;
      
      if (pe.contactsAdded > 0 && !isPlatformAdmin) {
        await consumeLeadGenCredits(teamId, pe.contactsAdded);
        creditsConsumed += pe.contactsAdded;

        // Gamification hook: Raw XP awarded per enrichment credit
        const { addRawXP } = await import("@/actions/quests/add-raw-xp");
        await addRawXP({ userId, xpAmount: pe.contactsAdded, reason: "Lead Gen Enrichment Credits" }).catch(() => {});
      }

      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs ?? []),
            { ts: new Date().toISOString(), msg: `People enrichment: ${pe.contactsAdded} contacts added across ${pe.companiesProcessed} companies.` },
          ],
          counters: {
            ...(job.counters ?? {}),
            peopleContactsAdded: (job.counters?.peopleContactsAdded ?? 0) + (pe.contactsAdded || 0),
            peopleCompaniesProcessed: (job.counters?.peopleCompaniesProcessed ?? 0) + (pe.companiesProcessed || 0),
          } as any
        },
      });
    } catch (error) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs ?? []),
            { ts: new Date().toISOString(), level: "ERROR", msg: `People enrichment failed: ${(error as Error)?.message || String(error)}` },
          ],
        },
      });
    }
  }

  // Calculate ICP scores for all candidates
  const pool = await db.crm_Lead_Pools.findUnique({
    where: { id: job.pool },
    select: { icpConfig: true }
  });

  if (pool?.icpConfig) {
    const candidates = await db.crm_Lead_Candidates.findMany({
      where: { pool: job.pool },
      select: {
        id: true,
        domain: true,
        companyName: true,
        description: true,
        industry: true,
        techStack: true,
        score: true
      }
    });

    // Update each candidate with ICP score
    for (const candidate of candidates) {
      try {
        const icpScore = calculateCompanyICPScore(candidate as any, pool.icpConfig as any);
        const finalScore = Math.round((icpScore * 0.6) + ((candidate.score || 0) * 0.4)); // 60% ICP, 40% enrichment

        await db.crm_Lead_Candidates.update({
          where: { id: candidate.id },
          data: { score: finalScore }
        });
      } catch (error) {
        console.error(`Failed to score candidate ${candidate.id}:`, error);
      }
    }
  }

  // Update counters and mark SUCCESS
  const updatedCounters = {
    ...(job.counters ?? {}),
    companiesFound: (job.counters?.companiesFound ?? 0) + (uniqueDomains?.length ?? 0),
    candidatesCreated: (job.counters?.candidatesCreated ?? 0) + createdCandidates,
    contactsCreated: (job.counters?.contactsCreated ?? 0) + createdContacts,
    sourceEvents: (job.counters?.sourceEvents ?? 0) + (serpEvents ?? 0),
    companiesEnriched: (job.counters?.companiesEnriched ?? 0) + enrichedCount,
    enrichmentFailed: (job.counters?.enrichmentFailed ?? 0) + enrichmentFailed,
  };

  await db.crm_Lead_Gen_Jobs.update({
    where: { id: jobId },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      counters: updatedCounters,
      logs: [
        ...(job.logs ?? []),
        { ts: new Date().toISOString(), msg: `LeadGen pipeline complete: domains=${uniqueDomains?.length ?? 0}, candidates=${createdCandidates}, enriched=${enrichedCount}, contacts=${createdContacts}, sourceEvents=${serpEvents ?? 0}.` },
      ],
    },
  });

  return { createdCandidates, createdContacts };
}
