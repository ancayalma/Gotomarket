import { prismadbCrm } from "@/lib/prisma-crm";
import { z } from "zod";

// Schema for the Lead Generation Wizard input
export const LeadGenWizardSchema = z.object({
  name: z.string().min(1, "Name your Lead Pool"),
  description: z.string().optional(),
  icp: z.object({
    industries: z.array(z.string()).optional(),
    companySizes: z.array(z.string()).optional(),
    geos: z.array(z.string()).optional(),
    techStack: z.array(z.string()).optional(),
    titles: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    excludeDomains: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  providers: z
    .object({
      agenticAI: z.boolean().default(true).optional(), // Autonomous AI agent mode (ENABLED BY DEFAULT)
      serp: z.boolean().default(true).optional(),
      serpFallback: z.boolean().default(false).optional(), // When agentic is enabled: allow SERP fallback only if explicitly true
      crawler: z.boolean().default(true).optional(),
      peopleEnrichment: z.boolean().default(true).optional(), // Company site team/about pages parsing (ToS-safe)
      aiQueries: z.boolean().default(true).optional(),
      aiAnalysis: z.boolean().default(true).optional(),
      scraperApi: z.boolean().default(false).optional(), // High-perfm ScraperAPI bypass (Exempt Plan Only)
    })
    .optional(),
  // Optional advanced params for the pipeline
  limits: z
    .object({
      maxCompanies: z.number().int().min(-1).max(100000).default(100).optional(),
      maxContactsPerCompany: z.number().int().min(-1).max(50).default(3).optional(),
    })
    .optional(),
  // Link to a project (optional - legacy)
  projectId: z.string().optional(),
  // Link to a campaign (optional - preferred)
  campaignId: z.string().optional(),
  // Append to existing pool (optional)
  existingPoolId: z.string().optional(),
});

export type LeadGenWizardInput = z.infer<typeof LeadGenWizardSchema>;

export type StartLeadGenJobParams = {
  userId: string;
  wizard: LeadGenWizardInput;
};

export type StartLeadGenJobResult = {
  poolId: string;
  jobId: string;
};

/**
 * Creates a Lead Pool and an associated Lead Generation Job in QUEUED status.
 * This is the entry point called by the Lead Generation Wizard.
 *
 * Notes:
 * - This writes to crm_Lead_Pools and crm_Lead_Gen_Jobs using the new Prisma models.
 * - The actual scraping/enrichment pipeline should be queued separately and update crm_Lead_Gen_Jobs.status.
 * - We store the wizard ICP config and provider toggles on the pool (icpConfig) and job (providers/queryTemplates).
 */
export async function startLeadGenJob(
  params: StartLeadGenJobParams
): Promise<StartLeadGenJobResult> {
  const { userId, wizard } = params;

  // Validate wizard payload
  const parsed = LeadGenWizardSchema.safeParse(wizard);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`).join("; ");
    throw new Error(`Invalid wizard input - ${msg}`);
  }

  const mainDb = (await import("@/lib/prisma")).prismadb;
  const user = await mainDb.users.findUnique({
    where: { id: userId },
    select: { team_id: true, assigned_team: { include: { assigned_plan: true } } }
  });

  if (parsed.data.providers?.scraperApi) {
    const planSlug = user?.assigned_team?.assigned_plan?.slug || user?.assigned_team?.subscription_plan || "FREE";
    if (planSlug.toUpperCase() !== "EXEMPT") {
      parsed.data.providers.scraperApi = false; // Force false if not exempt
    }
  }

  let poolId = wizard.existingPoolId;

  if (poolId) {
    // Verify existence and access
    const existingPool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
      where: { id: poolId },
      select: { id: true, user: true }
    });

    // Simple check: owner or admin? For now just check existence. 
    // Ideally we should check if userId matches or if shared. 
    // Assuming the API route that calls this checked general admin access, 
    // but specific pool access should be checked if we were stricter.
    if (!existingPool) {
      throw new Error("Selected list (pool) not found");
    }
    // We reuse this pool.
  } else {
    // Fetch user's team_id (already fetched above, reuse it)

    // Create New Lead Pool
    const pool = await (prismadbCrm as any).crm_Lead_Pools.create({
      data: {
        name: wizard.name,
        description: wizard.description,
        user: userId,
        team_id: user?.team_id,
        icpConfig: {
          ...parsed.data.icp,
          limits: parsed.data.limits ?? {},
          assignedProjectId: parsed.data.projectId || undefined,
          assignedCampaignId: parsed.data.campaignId || undefined,
        },
        // status defaults to "ACTIVE"
      },
      select: { id: true },
    });
    poolId = pool.id;
  }

  // Initialize counters/logs
  const counters = {
    targetCredits: parsed.data.limits?.maxCompanies ?? 100,
    companiesFound: 0,
    companiesCrawled: 0,
    candidatesCreated: 0,
    contactsCreated: 0,
    emailsVerified: 0,
    errors: 0,
  };

  // Create Lead Gen Job in QUEUED status
  const job = await (prismadbCrm as any).crm_Lead_Gen_Jobs.create({
    data: {
      user: userId,
      pool: poolId!,
      status: "QUEUED" as any, // LeadGenJobStatus
      providers: parsed.data.providers ?? {},
      queryTemplates: {
        // Seed with simple defaults; can be expanded by an LLM helper later
        base: [
          "site:linkedin.com/company {industry} {geo}",
          "site:crunchbase.com/organization {industry} {geo}",
          "site:news.ycombinator.com {industry} {geo}",
          "{industry} companies in {geo} using {tech}",
        ],
      },
      counters,
      logs: [],
    },
    select: { id: true },
  });

  // Link pool to campaign if campaignId provided
  const campaignId = parsed.data.campaignId;
  if (campaignId && poolId) {
    try {
      await (prismadbCrm as any).crm_Outreach_Campaigns.update({
        where: { id: campaignId },
        data: {
          pool: poolId,
          total_leads: { increment: 0 }, // Will be updated when candidates are created
        },
      });
    } catch {
      // Campaign may not exist or not be accessible — non-fatal
    }
  }

  return { poolId: poolId!, jobId: job.id };
}
