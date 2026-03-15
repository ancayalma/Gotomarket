import { prismadbCrm } from "@/lib/prisma-crm";
import { generateAISearchQueries } from "./ai-helpers";
import { runGoogleSearchForJob } from "./google-search";

type ICPConfig = {
  industries?: string[];
  companySizes?: string[];
  geos?: string[];
  techStack?: string[];
  titles?: string[];
  languages?: string[];
  excludeDomains?: string[];
  notes?: string;
  limits?: {
    maxCompanies?: number;
    maxContactsPerCompany?: number;
  };
};

type LeadGenJob = {
  id: string;
  pool: string;
  user: string;
  providers?: { serp?: boolean;[k: string]: any };
  queryTemplates?: { base?: string[] };
  counters?: Record<string, number>;
  logs?: any[];
};

type SerpResult = {
  title: string;
  href: string;
  domain: string | null;
};

/**
 * Build queries by expanding templates with ICP config.
 * Limits the number of queries to avoid explosion.
 */
function buildQueries(templates: string[], icp: ICPConfig, maxQueries = 30): string[] {
  const pick = (vals?: string[], fallback = ""): string[] =>
    vals && vals.length ? vals.slice(0, 3) : fallback ? [fallback] : [""];

  const industries = pick(icp.industries, "");
  const geos = pick(icp.geos, "");
  const techs = pick(icp.techStack, "");
  const titles = pick(icp.titles, "");
  const languages = pick(icp.languages, "");

  const out: string[] = [];
  for (const tpl of templates) {
    for (const ind of industries) {
      for (const geo of geos) {
        for (const tech of techs) {
          for (const title of titles) {
            for (const lang of languages) {
              let q = tpl
                .replace(/{industry}/g, ind)
                .replace(/{geo}/g, geo)
                .replace(/{tech}/g, tech)
                .replace(/{title}/g, title)
                .replace(/{language}/g, lang);
              q = q.replace(/\s+/g, " ").trim();
              if (!q) continue;
              out.push(q);
              if (out.length >= maxQueries) return dedupe(out);
            }
          }
        }
      }
    }
  }
  return dedupe(out);
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function getDomainFromUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

// Normalization & aggregation helpers
function normalizeDomain(d: string): string {
  return d.trim().toLowerCase().replace(/^www\./i, "");
}

function canonicalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    // strip trailing slashes and query params (tracking)
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    return url.toString();
  } catch {
    return u;
  }
}

function deriveCompanyName(domain: string): string {
  const parts = domain.split(".");
  const base = (parts[0] || domain).replace(/[-_]/g, " ");
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeCompanyDedupeKey(domain: string): string {
  return `company:${normalizeDomain(domain)}`;
}

function mergeProvenance(prev: any, addition: any): any {
  try {
    const p = prev && typeof prev === "object" ? prev : {};
    const sources = Array.isArray(p.sources) ? p.sources : [];
    return { ...p, sources: [...sources, { ...addition, ts: new Date().toISOString() }] };
  } catch {
    return addition;
  }
}

/** Strip HTML tags from a string */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

/**
 * Primary search: Google via Serper.dev API (fast, reliable, structured).
 * Fallback: DuckDuckGo HTML scrape if SERPER_API_KEY is not set.
 */
async function webSearch(query: string): Promise<SerpResult[]> {
  // Try Serper.dev (Google) first
  if (process.env.SERPER_API_KEY) {
    try {
      const { googleCustomSearch } = await import("./google-search");
      const results = await googleCustomSearch(query, 10);
      console.log(`[Google SERP] "${query}" -> ${results.length} results`);
      return results.map(r => ({
        title: r.title,
        href: r.link,
        domain: r.domain,
      }));
    } catch (error) {
      console.error(`Google search error for "${query}":`, error);
    }
  }

  // Fallback: Puppeteer Google search
  let browser;
  try {
    const { launchBrowser, newPageWithDefaults, closeBrowser } = await import("@/lib/browser");
    browser = await launchBrowser();
    const page = await newPageWithDefaults(browser);

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=15&hl=en`;
    await page.goto(googleUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results = await page.evaluate(() => {
      const items: Array<{ title: string; href: string; domain: string | null }> = [];
      const excludePatterns = [
        'wikipedia.org', 'youtube.com', 'facebook.com', 'twitter.com',
        'linkedin.com', 'instagram.com', 'reddit.com', 'medium.com',
        'github.com', 'google.com', 'bing.com', 'yahoo.com',
      ];

      // Try multiple selector strategies for Google results
      const anchors = document.querySelectorAll('#search a[href^="http"], #rso a[href^="http"]');
      const seen = new Set<string>();

      for (let i = 0; i < anchors.length && items.length < 15; i++) {
        const a = anchors[i] as HTMLAnchorElement;
        const href = a.href;
        if (!href || href.includes('google.com/') || seen.has(href)) continue;

        // Only take links that have an h3 (organic results)
        const h3 = a.querySelector('h3');
        if (!h3) continue;

        seen.add(href);
        try {
          const u = new URL(href);
          const hostname = u.hostname.replace(/^www\./i, '');
          if (excludePatterns.some(p => hostname.includes(p))) continue;
          items.push({
            title: h3.textContent?.trim() || '',
            href,
            domain: hostname,
          });
        } catch { continue; }
      }
      return items;
    });

    console.log(`[Google Puppeteer SERP] "${query}" -> ${results.length} results`);
    await closeBrowser(browser);
    return results;
  } catch (error) {
    console.error(`Google Puppeteer search error for "${query}":`, error);
    if (browser) {
      const { closeBrowser } = await import("@/lib/browser");
      await closeBrowser(browser);
    }
    return [];
  }
}

/**
 * Run SERP scraping for a job and persist:
 * - Lead source events (one per query, summarizing domains)
 * - Lead candidates (unique domains) for the job's pool
 */
export async function runSerpScraperForJob(jobId: string, userId?: string): Promise<{
  createdCandidates: number;
  sourceEvents: number;
  uniqueDomains: string[];
}> {
  const db: any = prismadbCrm;

  // Fetch job and pool ICP
  const job: LeadGenJob | null = await db.crm_Lead_Gen_Jobs.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      pool: true,
      user: true,
      providers: true,
      queryTemplates: true,
      counters: true,
      logs: true,
    },
  });
  if (!job) throw new Error("Job not found for SERP");

  const effectiveUserId = userId || job.user;

  const pool = await db.crm_Lead_Pools.findUnique({
    where: { id: job.pool },
    select: { id: true, icpConfig: true },
  });
  const icp: ICPConfig = (pool?.icpConfig as ICPConfig) || {};

  // Try AI-powered query generation first
  const maxCompanies = icp.limits?.maxCompanies ?? 100;
  let queries: string[] = [];

  const useAI = job.providers?.aiQueries !== false;
  if (useAI && effectiveUserId) {
    try {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: "Generating AI-powered search queries..." },
          ],
        },
      });

      queries = await generateAISearchQueries(icp, effectiveUserId, Math.min(15, Math.ceil(maxCompanies / 5)));

      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: `Generated ${queries.length} AI queries` },
          ],
        },
      });
    } catch (error) {
      console.error("AI query generation failed:", error);
    }
  }

  // Fallback to template-based queries if AI fails or disabled
  const templates =
    (job.queryTemplates?.base && job.queryTemplates.base.length
      ? job.queryTemplates.base
      : [
        "site:linkedin.com/company {industry} {geo}",
        "site:crunchbase.com/organization {industry} {geo}",
        "{industry} companies in {geo} using {tech}",
      ]);

  if (queries.length === 0) {
    queries = buildQueries(templates, icp, Math.min(30, Math.max(5, Math.ceil(maxCompanies / 3))));
  }

  let createdCandidates = 0;
  let sourceEvents = 0;
  let allDomains: string[] = [];
  const exclude = new Set((icp.excludeDomains || []).map((d) => d.toLowerCase()));

  // Use DuckDuckGo as primary search method
  await db.crm_Lead_Gen_Jobs.update({
    where: { id: jobId },
    data: {
      logs: [
        ...(job.logs || []),
        { ts: new Date().toISOString(), msg: "Starting DuckDuckGo search..." },
      ],
    },
  });

  // Rate limiting between queries
  const perQueryDelayMs = Number(process.env.SCRAPER_QUERY_DELAY_MS || 1500);

  // Progressive loosening: If we don't find enough results, try broader queries
  let attemptLevel = 0;
  const maxAttempts = 3;

  while (attemptLevel < maxAttempts && allDomains.length < Math.min(10, maxCompanies)) {
    if (attemptLevel > 0) {
      // Log that we're loosening search
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: `Loosening search criteria (attempt ${attemptLevel + 1}/${maxAttempts})...` },
          ],
        },
      });

      // Generate broader queries for next attempt
      if (attemptLevel === 1) {
        // Remove tech stack requirement
        const broaderICP = { ...icp, techStack: [] };
        queries = buildQueries(templates, broaderICP, 15);
      } else if (attemptLevel === 2) {
        // Use generic fallback queries
        const industry = icp.industries?.[0] || "companies";
        const geo = icp.geos?.[0] || "United States";
        queries = [
          `${industry} companies`,
          `${industry} startups`,
          `${industry} businesses in ${geo}`,
          `top ${industry} companies`,
          `best ${industry} firms`
        ];
      }
    }

    for (const q of queries) {
      let results: SerpResult[] = [];
      try {
        results = await webSearch(q);
      } catch (err) {
        // Log error but continue
        await db.crm_Lead_Gen_Jobs.update({
          where: { id: jobId },
          data: {
            logs: [
              ...(job.logs || []),
              { ts: new Date().toISOString(), level: "WARN", msg: `SERP error for "${q}": ${(err as Error).message}` },
            ],
          },
        });
      }

      const domains = dedupe(
        results
          .map((r) => r.domain)
          .filter((d): d is string => !!d)
          .map((d) => d.toLowerCase())
          .filter((d) => !exclude.has(d))
      );

      allDomains.push(...domains);

      // Persist a single source event per query with metadata summary
      try {
        await db.crm_Lead_Source_Events.create({
          data: {
            job: jobId,
            type: "serp",
            query: q,
            url: results[0]?.href || null,
            fetchedAt: new Date(),
            metadata: {
              note: "SERP query results",
              domains: domains.slice(0, 20),
              totalResults: results.length,
            },
          },
        });
        sourceEvents++;
      } catch {
        // ignore individual event errors
      }

      // delay
      if (perQueryDelayMs > 0) {
        await sleep(perQueryDelayMs);
      }

      // If we've found enough domains for this attempt level, break early
      if (allDomains.length >= maxCompanies) {
        break;
      }
    }

    attemptLevel++;
  }

  // Final check: If still no results after all attempts
  if (allDomains.length === 0) {
    await db.crm_Lead_Gen_Jobs.update({
      where: { id: jobId },
      data: {
        logs: [
          ...(job.logs || []),
          {
            ts: new Date().toISOString(),
            level: "ERROR",
            msg: "No companies found after all search attempts. This may indicate: (1) ICP criteria too narrow, (2) Search engine blocking, (3) No matching companies exist. Try broader ICP criteria or check logs for search errors."
          },
        ],
      },
    });
  }

  // Deduplicate domains and respect maxCompanies
  const uniqueDomains = dedupe(allDomains).slice(0, maxCompanies);

  // Upsert into private global aggregation index (companies)
  for (const domainRaw of uniqueDomains) {
    const domain = normalizeDomain(domainRaw);
    const dedupeKey = computeCompanyDedupeKey(domain);
    try {
      const existing = await db.crm_Global_Companies.findFirst({
        where: { OR: [{ domain }, { dedupeKey }] },
        select: { id: true, provenance: true },
      });

      const baseData = {
        domain,
        companyName: deriveCompanyName(domain),
        homepageUrl: canonicalizeUrl(`https://${domain}`),
        lastSeen: new Date(),
        status: "ACTIVE",
      };

      if (existing?.id) {
        await db.crm_Global_Companies.update({
          where: { id: existing.id },
          data: {
            ...baseData,
            provenance: mergeProvenance(existing.provenance, { jobId, source: "serp" }),
          },
        });
      } else {
        await db.crm_Global_Companies.create({
          data: {
            ...baseData,
            dedupeKey,
            firstSeen: new Date(),
            provenance: { sources: [{ jobId, source: "serp", ts: new Date().toISOString() }] },
          },
        });
      }
    } catch {
      // tolerate global index write errors per-domain
    }
  }

  // Create candidates in the user's pool if not exists
  for (const domainRaw of uniqueDomains) {
    const domain = normalizeDomain(domainRaw);
    const exists = await db.crm_Lead_Candidates.findFirst({
      where: { pool: job.pool, domain },
      select: { id: true },
    });
    if (exists) continue;

    try {
      await db.crm_Lead_Candidates.create({
        data: {
          pool: job.pool,
          domain,
          companyName: deriveCompanyName(domain),
          homepageUrl: canonicalizeUrl(`https://${domain}`),
          dedupeKey: computeCompanyDedupeKey(domain),
          score: 50,
          freshnessAt: new Date(),
          status: "NEW",
          provenance: { jobId, source: "serp" },
        },
      });
      createdCandidates++;
    } catch {
      // skip failures on individual domains
    }
  }

  return { createdCandidates, sourceEvents, uniqueDomains };
}
