import { systemLogger } from "@/lib/logger";

const SCRAPER_API_KEY = process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY || "";

export type SerpResult = { name: string; url: string; snippet: string; domain: string };

function extractUrlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch { return ''; }
}

const SEARCH_EXCLUDE_PATTERNS = [
  'wikipedia.org', 'youtube.com', 'facebook.com',
  'twitter.com', 'instagram.com', 'google.com',
  'reddit.com', 'medium.com', 'github.com',
  'pinterest.com', 'tiktok.com', 'snapchat.com',
  'bing.com', 'yahoo.com', 'quora.com',
  'linkedin.com', 'glassdoor.com', 'duckduckgo.com',
  'crunchbase.com', 'zoominfo.com', 'apollo.io',
  'pitchbook.com', 'yelp.com', 'bbb.org',
  'mapquest.com', 'capterra.com', 'g2.com',
  'apps.apple.com', 'play.google.com', 'substack.com',
];

function isExcludedDomain(hostname: string): boolean {
  return SEARCH_EXCLUDE_PATTERNS.some(p => hostname.includes(p));
}

/**
 * Perform a Google search via ScraperAPI structured endpoints.
 */
export async function scraperApiGoogleSearch(query: string, count: number = 20): Promise<SerpResult[]> {
  if (!SCRAPER_API_KEY) {
    systemLogger.error("[SCRAPER_API] Missing SCRAPER_API_KEY in environment variables.");
    return [];
  }

  try {
    const targetUrl = new URL('https://api.scraperapi.com/structured/google/search');
    targetUrl.searchParams.set('api_key', SCRAPER_API_KEY);
    targetUrl.searchParams.set('query', query);
    targetUrl.searchParams.set('num', count.toString());
    
    // According to ScraperAPI, tld / country code etc can be added if needed
    // e.g., targetUrl.searchParams.set('country', 'us');

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });

    if (!response.ok) {
      const txt = await response.text();
      systemLogger.error(`[SCRAPER_API] Google Search Failed - HTTP ${response.status}: ${txt}`);
      return [];
    }

    const data = await response.json();
    const results: SerpResult[] = [];
    const seen = new Set<string>();

    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const item of data.organic_results) {
        if (!item.link || seen.has(item.link)) continue;
        
        const hostname = extractUrlDomain(item.link);
        if (!hostname || isExcludedDomain(hostname)) continue;

        seen.add(item.link);
        results.push({
          name: (item.title || '').slice(0, 120),
          url: item.link,
          snippet: (item.snippet || '').slice(0, 200),
          domain: hostname,
        });

        if (results.length >= count) break;
      }
    }

    systemLogger.info(`[SCRAPER_API] "${query}" -> ${results.length} results`);
    return results;

  } catch (error) {
    systemLogger.error("[SCRAPER_API] Google Search Exception:", error);
    return [];
  }
}

/**
 * Extract HTML from a URL via ScraperAPI.
 */
export async function scraperApiExtractHtml(url: string): Promise<string> {
  if (!SCRAPER_API_KEY) {
    systemLogger.error("[SCRAPER_API] Missing SCRAPER_API_KEY in environment variables.");
    return "";
  }

  try {
    const apiEndpoint = new URL('http://api.scraperapi.com');
    apiEndpoint.searchParams.set('api_key', SCRAPER_API_KEY);
    apiEndpoint.searchParams.set('url', url);
    // Use render=true to execute JS on the page before retrieving HTML
    apiEndpoint.searchParams.set('render', 'true');
    // Using ultra_premium could help bypass extreme blocks, but let's stick to default/premium
    // apiEndpoint.searchParams.set('premium', 'true'); 

    const response = await fetch(apiEndpoint.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      const txt = await response.text();
      systemLogger.error(`[SCRAPER_API] Scrape Failed for ${url} - HTTP ${response.status}: ${txt}`);
      return "";
    }

    const html = await response.text();
    return html;
  } catch (error) {
    systemLogger.error(`[SCRAPER_API] Scrape Exception for ${url}:`, error);
    return "";
  }
}
