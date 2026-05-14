/**
 * Serper.dev API Integration
 * Provides fast, reliable, and cost-effective company discovery via Google Search
 */

import { prismadbCrm } from "@/lib/prisma-crm";

type SearchResult = {
  title: string;
  link: string;
  snippet?: string;
  domain: string | null;
};

/**
 * Perform Google Search via Serper.dev
 * Requires SERPER_API_KEY in .env
 */
export async function googleCustomSearch(query: string, numResults: number = 10): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn("Serper API Key not configured. Set SERPER_API_KEY in .env");
    return [];
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        num: Math.min(numResults, 100) // Serper allows up to 100
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Serper API error: ${response.status} - ${error}`);
      return [];
    }

    const data = await response.json();

    if (!data.organic || data.organic.length === 0) {
      return [];
    }

    const results: SearchResult[] = data.organic.map((item: any) => ({
      title: item.title || "",
      link: item.link || "",
      snippet: item.snippet || "",
      domain: extractDomain(item.link)
    }));

    return results.filter(r => r.domain !== null);
  } catch (error) {
    console.error(`Serper Search error for "${query}":`, error);
    return [];
  }
}

/**
 * Extract and normalize domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    let hostname = u.hostname.replace(/^www\./i, "");

    // Filter out non-company domains
    const excludePatterns = [
      'wikipedia.org', 'youtube.com', 'facebook.com',
      'twitter.com', 'linkedin.com', 'instagram.com',
      'reddit.com', 'medium.com', 'github.com',
      'pinterest.com', 'tiktok.com', 'snapchat.com'
    ];

    if (excludePatterns.some(p => hostname.includes(p))) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * Run Google Search for lead generation job
 * More reliable than DuckDuckGo scraping
 */
export async function runGoogleSearchForJob(
  jobId: string,
  queries: string[],
  maxCompanies: number = 100
): Promise<{
  foundDomains: string[];
  sourceEvents: number;
}> {
  const db: any = prismadbCrm;

  const job = await db.crm_Lead_Gen_Jobs.findUnique({
    where: { id: jobId },
    select: { logs: true }
  });

  const allDomains: string[] = [];
  let sourceEvents = 0;

  const perQueryDelayMs = Number(process.env.SCRAPER_QUERY_DELAY_MS || 1500);

  for (const query of queries) {
    try {
      const results = await googleCustomSearch(query, 10);
      const domains = results.map(r => r.domain).filter((d): d is string => d !== null);

      allDomains.push(...domains);

      // Log source event
      try {
        await db.crm_Lead_Source_Events.create({
          data: {
            job: jobId,
            type: "serper_search",
            query,
            url: results[0]?.link || null,
            fetchedAt: new Date(),
            metadata: {
              note: "Serper Search results",
              domains: domains.slice(0, 20),
              totalResults: results.length,
              snippets: results.slice(0, 3).map(r => r.snippet)
            },
          },
        });
        sourceEvents++;
      } catch {
        // ignore event logging errors
      }

      await new Promise(resolve => setTimeout(resolve, perQueryDelayMs));

      // Break if we have enough
      if (allDomains.length >= maxCompanies) {
        break;
      }
    } catch (error) {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job?.logs || []),
            {
              ts: new Date().toISOString(),
              level: "WARN",
              msg: `Serper Search error for "${query}": ${(error as Error).message}`
            },
          ],
        },
      });
    }
  }

  // Deduplicate
  const uniqueDomains = Array.from(new Set(allDomains)).slice(0, maxCompanies);

  return {
    foundDomains: uniqueDomains,
    sourceEvents
  };
}
