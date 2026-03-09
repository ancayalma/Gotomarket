/**
 * Agentic AI Lead Scraper - The World's Most Powerful
 * Uses GPT-5/GPT-4 with function calling to autonomously:
 * - Search for companies (Bing API)
 * - Visit and analyze websites
 * - Extract contacts intelligently
 * - Refine search strategy based on results
 */

import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { z } from "zod";
import { generateObject, generateText, tool, type ModelMessage } from "ai";

import { prismadbCrm } from "@/lib/prisma-crm";
// import { launchBrowser, newPageWithDefaults, closeBrowser } from "@/lib/browser";
import {
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  normalizeName,
  safeContactDisplayName,
  generateCompanyDedupeKey,
  generatePersonDedupeKey,
  calculateCompanyConfidence
} from "./normalize";
import { fixConcatenatedWords as fixConcat } from "./quality/text-concatenation";
import { shouldIgnoreEmail } from "./quality/email-filters";
import { normalizePhone as normalizePhoneDigits } from "./quality/phone-normalizer";
import { normalizeTechStack as canonTech } from "./quality/tech-normalizer";
import { detectTechFromSnapshot } from "./tech/detector";
import { sanitizeContact } from "./quality/contact-sanitizer";
import { decodeEmailCandidates } from "./quality/email-deobfuscate";
import { verifyEmail } from "./verify/email-verify";
import { buildResendAdapters } from "./verify/adapters/resend-adapters";
import { rankLinks } from "./ai/link-ranker";
import ScraperConfig from "./config";
import { learnDomainPatterns, guessEmailForName } from "./ml/pattern-model";
import { normalizeTitleAndPersona } from "./quality/title-normalizer";

type ICPConfig = {
  industries?: string[];
  companySizes?: string[];
  geos?: string[];
  techStack?: string[];
  titles?: string[];
  excludeDomains?: string[];
  notes?: string;
  limits?: {
    maxCompanies?: number;
    maxContactsPerCompany?: number;
  };
};

/**
 * Search companies using DuckDuckGo HTML — zero dependencies, no API key
 * Uses the HTML-only endpoint which returns server-rendered results parseable with regex
 */

async function ddgWebSearch(query: string, count: number = 20): Promise<Array<{
  name: string;
  url: string;
  snippet: string;
  domain: string;
}>> {
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(ddgUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`DuckDuckGo HTTP error: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Parse result links from DDG HTML
    // DDG HTML results have: <a rel="nofollow" class="result__a" href="...">Title</a>
    // and snippets in: <a class="result__snippet" ...>Snippet text</a>
    const results: Array<{ name: string; url: string; snippet: string; domain: string }> = [];

    // Extract result blocks — each result has a link and snippet
    // DDG wraps external URLs in redirect: //duckduckgo.com/l/?uddg=ENCODED_URL&...
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: Array<{ href: string; title: string }> = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({ href: match[1], title: stripHtml(match[2]).trim() });
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(stripHtml(match[1]).trim());
    }

    for (let i = 0; i < links.length && results.length < count; i++) {
      let href = links[i].href;

      // Decode DDG redirect URLs: //duckduckgo.com/l/?uddg=ENCODED_URL&...
      if (href.includes("duckduckgo.com/l/")) {
        const uddgMatch = href.match(/[?&]uddg=([^&]+)/);
        if (uddgMatch) {
          href = decodeURIComponent(uddgMatch[1]);
        }
      }

      // Skip non-http links
      if (!href.startsWith("http://") && !href.startsWith("https://")) continue;

      // Extract domain
      try {
        const u = new URL(href);
        let hostname = u.hostname.replace(/^www\./i, "");

        // Filter out non-company domains
        const excludePatterns = [
          'wikipedia.org', 'youtube.com', 'facebook.com',
          'twitter.com', 'instagram.com', 'duckduckgo.com',
          'reddit.com', 'medium.com', 'github.com',
          'pinterest.com', 'tiktok.com', 'snapchat.com',
          'google.com', 'bing.com', 'yahoo.com',
        ];
        if (excludePatterns.some(p => hostname.includes(p))) continue;

        results.push({
          name: links[i].title,
          url: href,
          snippet: snippets[i] || "",
          domain: hostname,
        });
      } catch {
        continue;
      }
    }

    console.log(`[DDG Search] "${query}" -> ${results.length} results`);
    return results;
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return [];
  }
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

// Heuristic fixer to insert spaces in concatenated words like "Contactme" -> "Contact me"
function fixConcatenatedWords(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).trim();
  // Insert space between lower->Upper boundaries (camel-case like)
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Insert space before some common lowercase suffixes stuck to the previous token
  const suffixes = ['me', 'us', 'now', 'team', 'about', 'info', 'support', 'contact'];
  for (const suf of suffixes) {
    const re = new RegExp(`(^|[^A-Za-z])([A-Za-z]{3,})${suf}$`, 'i');
    s = s.replace(re, (_m, p1, p2) => `${p1}${p2} ${suf}`);
  }
  // Collapse extra whitespace
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

// Tool parameter schemas defined with Zod for cross-provider compatibility
const searchCompaniesSchema = z.object({
  query: z.string().describe("The search query to find companies (e.g., 'SaaS companies in San Francisco')"),
  count: z.number().optional().describe("Number of results to return (1-50), defaults to 20"),
});

const visitWebsiteSchema = z.object({
  url: z.string().describe("The URL to visit"),
});

const analyzeCompanyFitSchema = z.object({
  domain: z.string().describe("Company domain"),
  companyData: z.any().optional().describe("Company information extracted from website"),
});

const saveCompanySchema = z.object({
  domain: z.string().describe("Company domain"),
  companyName: z.string().describe("Company name"),
  description: z.string().describe("Company description"),
  industry: z.string().describe("Primary industry"),
  techStack: z.array(z.string()).optional().describe("Detected technologies"),
  contacts: z.array(z.object({
    name: z.string().describe("REAL person name (FirstName LastName). NEVER use company name. Empty string if unknown."),
    title: z.string().describe("REAL job title (e.g. 'CEO', 'VP Sales', 'Founder'). NEVER 'Contact' or 'General Contact'. Empty string if unknown."),
    email: z.string().describe("Email address"),
    phone: z.string().describe("Phone number (can be empty string if unknown)"),
    linkedin: z.string().optional().describe("LinkedIn profile URL"),
  })).describe("Contacts found. Each MUST have a real email. Name should be a real person's name, not the company name."),
});

const refineSearchStrategySchema = z.object({
  currentResults: z.number().describe("Number of qualified companies found so far"),
  targetResults: z.number().describe("Target number of companies"),
  reasoning: z.string().describe("Why the strategy should or shouldn't change"),
});

/**
 * Build tools definition for AI SDK
 * Using tool() helper with Zod schemas for cross-provider compatibility
 * Per AI SDK v5 docs: use `inputSchema` property with Zod schemas
 * Tool execution happens in executeToolCall() - not inline
 */
function buildToolsDefinition(context: { jobId: string; poolId: string; icp: ICPConfig; userId: string; logs: any[] }) {
  return {
    search_companies: tool({
      description: "Search for companies using DuckDuckGo Search. Returns company websites matching the query.",
      inputSchema: searchCompaniesSchema,
      async execute(input) {
        return await executeToolCall("search_companies", input, context);
      },
    }),
    visit_website: tool({
      description: "Visit a company website and extract all available information including company details and contact information.",
      inputSchema: visitWebsiteSchema,
      async execute(input) {
        return await executeToolCall("visit_website", input, context);
      },
    }),
    analyze_company_fit: tool({
      description: "Analyze if a company matches the ICP criteria and should be added to the pool.",
      inputSchema: analyzeCompanyFitSchema,
      async execute(input) {
        return await executeToolCall("analyze_company_fit", input, context);
      },
    }),
    save_company: tool({
      description: "Save a qualified company to the lead pool with extracted data.",
      inputSchema: saveCompanySchema,
      async execute(input) {
        return await executeToolCall("save_company", input, context);
      },
    }),
    refine_search_strategy: tool({
      description: "Based on results so far, decide if search strategy should be adjusted.",
      inputSchema: refineSearchStrategySchema,
      async execute(input) {
        return await executeToolCall("refine_search_strategy", input, context);
      },
    }),
  };
}

/**
 * Discover sitemap URLs from a domain
 */
async function discoverSitemap(domain: string, page: any): Promise<string[]> {
  const sitemapUrls: string[] = [];
  const baseUrl = `https://${domain}`;

  try {
    // Try common sitemap locations
    const sitemapLocations = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap/sitemap.xml`,
    ];

    // First check robots.txt for sitemap references
    try {
      await page.goto(`${baseUrl}/robots.txt`, { waitUntil: "domcontentloaded", timeout: 10000 });
      const robotsContent = await page.content();
      const sitemapMatches = robotsContent.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
      if (sitemapMatches) {
        sitemapMatches.forEach((match: string) => {
          const url = match.replace(/Sitemap:\s*/i, '').trim();
          if (!sitemapLocations.includes(url)) {
            sitemapLocations.unshift(url); // Add to front as priority
          }
        });
      }
    } catch (e) {
      // robots.txt not found, continue
    }

    // Try to fetch sitemap
    for (const sitemapUrl of sitemapLocations) {
      try {
        await page.goto(sitemapUrl, { waitUntil: "domcontentloaded", timeout: 10000 });
        const content = await page.content();

        // Parse XML sitemap
        const locMatches = content.match(/<loc>([^<]+)<\/loc>/gi);
        if (locMatches && locMatches.length > 0) {
          locMatches.forEach((match: string) => {
            const url = match.replace(/<\/?loc>/gi, '').trim();
            if (url.startsWith('http') && !url.endsWith('.xml')) {
              sitemapUrls.push(url);
            }
          });
          break; // Found valid sitemap
        }
      } catch (e) {
        // Sitemap not found at this location
      }
    }
  } catch (e) {
    console.log(`Sitemap discovery failed for ${domain}:`, e);
  }

  return sitemapUrls.slice(0, 100); // Limit to 100 URLs
}

/**
 * Get high-value internal page URLs using heuristics
 */
function getHighValuePageUrls(domain: string, sitemapUrls: string[]): string[] {
  const baseUrl = `https://${domain}`;
  const highValuePaths = [
    '/about', '/about-us', '/aboutus', '/about/',
    '/team', '/our-team', '/leadership', '/people', '/staff',
    '/contact', '/contact-us', '/contactus', '/contact/',
    '/careers', '/jobs', '/join-us', '/work-with-us',
    '/company', '/company/about', '/company/team',
  ];

  const urls: string[] = [];

  // Add high-value paths from heuristics
  for (const path of highValuePaths) {
    urls.push(`${baseUrl}${path}`);
  }

  // Add relevant URLs from sitemap
  if (sitemapUrls.length > 0) {
    const relevantSitemapUrls = sitemapUrls.filter(url => {
      const lowerUrl = url.toLowerCase();
      return (
        lowerUrl.includes('/about') ||
        lowerUrl.includes('/team') ||
        lowerUrl.includes('/contact') ||
        lowerUrl.includes('/careers') ||
        lowerUrl.includes('/leadership') ||
        lowerUrl.includes('/people') ||
        lowerUrl.includes('/staff') ||
        lowerUrl.includes('/company')
      );
    });
    urls.push(...relevantSitemapUrls);
  }

  // Deduplicate
  return Array.from(new Set(urls));
}

/**
 * Dismiss common overlays, cookie banners, and popups
 */
async function dismissOverlays(page: any): Promise<void> {
  try {
    await page.evaluate(() => {
      // Common cookie/consent selectors
      const dismissSelectors = [
        '[class*="cookie"] button',
        '[class*="consent"] button',
        '[class*="popup"] button[class*="close"]',
        '[class*="modal"] button[class*="close"]',
        '[class*="overlay"] button[class*="close"]',
        '[aria-label*="close"]',
        '[aria-label*="dismiss"]',
        '[aria-label*="accept"]',
        'button[class*="accept"]',
        'button[class*="agree"]',
        '#onetrust-accept-btn-handler',
        '.cc-btn.cc-dismiss',
        '.gdpr-accept',
        '.cookie-accept',
      ];

      for (const selector of dismissSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el: any) => {
            if (el && typeof el.click === 'function') {
              el.click();
            }
          });
        } catch (e) {
          // Ignore errors
        }
      }

      // Remove overlay elements that might block content
      const overlaySelectors = [
        '[class*="cookie-banner"]',
        '[class*="cookie-notice"]',
        '[class*="gdpr"]',
        '[id*="cookie"]',
        '[class*="overlay"][style*="fixed"]',
      ];

      for (const selector of overlaySelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el: any) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          // Ignore errors
        }
      }
    });
  } catch (e) {
    // Overlay dismissal failed, continue anyway
  }
}

/**
 * Extract page data (emails, phones, social links, tech stack)
 */
async function extractPageData(page: any): Promise<{
  title: string;
  description: string;
  emails: string[];
  phones: string[];
  socialLinks: { [key: string]: string };
  techStack: string[];
  internalLinks: string[];
  hrefList: string[];
  rawTextExcerpt: string;
  _techSnapshot?: { html?: string; scripts?: string[]; links?: string[] };
}> {
  return page.evaluate(() => {
    const result: any = {
      title: document.title,
      description: "",
      emails: [],
      phones: [],
      socialLinks: {},
      techStack: [],
      internalLinks: [],
      hrefList: [],
      rawTextExcerpt: ""
    };

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) result.description = metaDesc.getAttribute('content') || "";

    // Extract all emails - check both text and mailto links
    const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    const bodyText = document.body.textContent || '';
    const emailMatches: string[] = [];
    const bodyEmailMatches = bodyText.match(emailPattern);
    if (bodyEmailMatches) {
      for (const e of bodyEmailMatches) {
        emailMatches.push(e);
      }
    }

    // Also get emails from mailto links
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const email = href.replace('mailto:', '').split('?')[0];
      if (email && email.includes('@')) {
        emailMatches.push(email);
      }
    });

    // Filter out common non-person emails
    const filteredEmails = Array.from(new Set(emailMatches)).filter(email => {
      const lower = email.toLowerCase();
      // Keep info@, contact@, sales@ etc but filter obvious junk
      return !lower.includes('example.com') &&
        !lower.includes('domain.com') &&
        !lower.includes('email.com') &&
        !lower.includes('@sentry') &&
        !lower.includes('@wix') &&
        !lower.includes('@squarespace') &&
        !lower.endsWith('.png') &&
        !lower.endsWith('.jpg');
    });
    result.emails = filteredEmails.slice(0, 20);

    // Extract phones - more comprehensive patterns
    const phonePatterns = [
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ];
    const allPhones: string[] = [];
    for (const pattern of phonePatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        for (const m of matches) {
          allPhones.push(m);
        }
      }
    }
    result.phones = Array.from(new Set(allPhones)).slice(0, 10);

    // Scripts and link hrefs for detector
    const scripts = Array.from(document.querySelectorAll('script[src]')).map((s) => (s as HTMLScriptElement).src || '');
    const links = Array.from(document.querySelectorAll('link[href]')).map((l) => (l as HTMLLinkElement).href || '');
    // Basic inline tech hints for fallback
    const html = document.documentElement.outerHTML.toLowerCase();

    // Detector will run outside the browser context for flexibility


    // Social links - expanded
    const socialPatterns = [
      { name: 'linkedin', pattern: /linkedin\.com/i },
      { name: 'twitter', pattern: /twitter\.com|x\.com/i },
      { name: 'facebook', pattern: /facebook\.com/i },
      { name: 'instagram', pattern: /instagram\.com/i },
      { name: 'youtube', pattern: /youtube\.com/i },
      { name: 'github', pattern: /github\.com/i },
    ];

    document.querySelectorAll('a[href]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      for (const social of socialPatterns) {
        if (social.pattern.test(href) && !result.socialLinks[social.name]) {
          result.socialLinks[social.name] = href;
        }
      }
    });

    // Internal links for potential deep crawling
    const currentHost = window.location.hostname;
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === currentHost &&
          !href.includes('#') &&
          !href.match(/\.(pdf|jpg|png|gif|css|js)$/i)) {
          result.internalLinks.push(href);
        }
      } catch (e) {
        // Invalid URL
      }
    });
    result.internalLinks = Array.from(new Set(result.internalLinks)).slice(0, 50);
    // Capture href list and a large text excerpt for deobfuscation outside the browser
    result.hrefList = Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href);
    result.rawTextExcerpt = (document.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50000);

    return {
      ...result,
      // Pass raw HTML for detector outside, plus scripts/links
      _techSnapshot: {
        html: document.documentElement.outerHTML,
        scripts,
        links,
      }
    };
  });
}

/**
 * Visit website using Puppeteer (real browser) to extract company data
 * Visits homepage + high-value subpages (/about, /contact, /team)
 */
import { launchBrowser, newPageWithDefaults, closeBrowser } from "@/lib/browser";

async function visitWebsiteForAgent(url: string, userId?: string, icp?: ICPConfig): Promise<any> {
  const db: any = prismadbCrm;
  const domain = normalizeDomain(url);
  const cacheThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days

  // 1. Try Cache First
  if (domain) {
    try {
      const cached = await db.crm_Global_Companies.findUnique({
        where: { domain },
        select: {
          companyName: true,
          description: true,
          industry: true,
          techStack: true,
          emails: true,
          phones: true,
          socialLinks: true,
          enrichmentData: true,
          lastSeen: true
        }
      });

      if (cached && cached.lastSeen && cached.lastSeen > cacheThreshold) {
        console.log(`[CACHE_HIT] Using cached data for domain: ${domain}`);
        return {
          title: cached.companyName || "",
          description: cached.description || "",
          emails: cached.emails || [],
          phones: cached.phones || [],
          socialLinks: cached.socialLinks || {},
          techStack: cached.techStack || [],
          pagesVisited: [url],
          errors: [],
          fromCache: true
        };
      }
    } catch (cacheErr) {
      console.error("[CACHE_ERROR] Failed to read from global cache:", cacheErr);
    }
  }

  // 2. Visit with Puppeteer (real browser)
  let browser;
  try {
    browser = await launchBrowser();
    const page = await newPageWithDefaults(browser);

    const targetUrl = url.startsWith("http") ? url : `https://${url}`;
    const allEmails = new Set<string>();
    const allPhones = new Set<string>();
    const socialLinks: Record<string, string> = {};
    const pagesVisited: string[] = [];
    const allContacts: Array<{ name: string; title: string; email: string; phone: string; linkedin: string }> = [];
    const allLinkedinProfiles: string[] = [];
    let title = "";
    let description = "";
    const errors: string[] = [];

    /**
     * Extract structured data from the current page's rendered DOM
     * Enhanced: extracts structured contacts, LinkedIn profiles, and team members
     */
    const extractPageData = async () => {
      return await page.evaluate(() => {
        const text = document.body?.innerText || "";

        // Title
        const pageTitle = document.title || "";

        // Meta description
        const metaDesc = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || "";

        // ─── Structured Contact Extraction ───
        const contacts: Array<{ name: string; title: string; email: string; phone: string; linkedin: string }> = [];
        const seenEmails = new Set<string>();

        // 1. Mailto links with context: find email + nearby name/title
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          const email = (a as HTMLAnchorElement).href.replace("mailto:", "").split("?")[0].toLowerCase();
          if (!email || seenEmails.has(email)) return;
          if (email.endsWith(".png") || email.endsWith(".jpg") || email.includes("example.com")) return;
          seenEmails.add(email);

          // Look for context around the mailto link
          let name = "";
          let title = "";
          const parent = a.closest("li, div, p, td, article, section, figure, .team-member, [class*='card'], [class*='person'], [class*='member']");
          if (parent) {
            // Look for name in headings or strong/bold near the email
            const heading = parent.querySelector("h1, h2, h3, h4, h5, strong, b, [class*='name']");
            if (heading) {
              const candidateName = (heading as HTMLElement).innerText?.trim();
              if (candidateName && candidateName.length > 2 && candidateName.length < 60 && candidateName.split(" ").length >= 2) {
                name = candidateName;
              }
            }
            // Look for title in smaller text elements
            const titleEl = parent.querySelector("[class*='title'], [class*='role'], [class*='position'], small, .subtitle, em");
            if (titleEl) {
              const candidateTitle = (titleEl as HTMLElement).innerText?.trim();
              if (candidateTitle && candidateTitle.length > 2 && candidateTitle.length < 80) {
                title = candidateTitle;
              }
            }
          }

          contacts.push({ name, title, email, phone: "", linkedin: "" });
        });

        // 2. Text emails (not already found via mailto)
        const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
        const textEmails = text.match(emailRegex) || [];
        for (const email of textEmails) {
          const lower = email.toLowerCase();
          if (seenEmails.has(lower)) continue;
          if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".gif") ||
            lower.includes("example.com") || lower.includes("sentry") || lower.includes("webpack")) continue;
          seenEmails.add(lower);
          contacts.push({ name: "", title: "", email: lower, phone: "", linkedin: "" });
        }

        // 3. Team member cards / people sections
        const teamSelectors = [
          '.team-member', '.staff-member', '[class*="team"] [class*="card"]',
          '[class*="person"]', '[class*="member"]', '[class*="leadership"]',
          '[class*="staff"]', '.bio', '[class*="executive"]',
          'figure', '[class*="card"]',
        ];
        for (const sel of teamSelectors) {
          try {
            document.querySelectorAll(sel).forEach(card => {
              const cardText = (card as HTMLElement).innerText || "";
              const heading = card.querySelector("h2, h3, h4, h5, strong, b, [class*='name']");
              const candidateName = heading ? (heading as HTMLElement).innerText?.trim() : "";
              const titleEl = card.querySelector("[class*='title'], [class*='role'], [class*='position'], small, em, p");
              const candidateTitle = titleEl ? (titleEl as HTMLElement).innerText?.trim() : "";

              // Must look like a real person name (2+ words, reasonable length)
              if (!candidateName || candidateName.length < 4 || candidateName.length > 60 || candidateName.split(" ").length < 2) return;

              // Check if this card has an email
              const mailtoLink = card.querySelector('a[href^="mailto:"]');
              const email = mailtoLink ? (mailtoLink as HTMLAnchorElement).href.replace("mailto:", "").split("?")[0].toLowerCase() : "";

              // Check for LinkedIn link
              const linkedinLink = card.querySelector('a[href*="linkedin.com/in/"]');
              const linkedin = linkedinLink ? (linkedinLink as HTMLAnchorElement).href : "";

              // If we already have this email in contacts, update the name/title
              if (email && seenEmails.has(email)) {
                const existing = contacts.find(c => c.email === email);
                if (existing && !existing.name && candidateName) {
                  existing.name = candidateName;
                  if (candidateTitle && candidateTitle.length < 80) existing.title = candidateTitle;
                  if (linkedin) existing.linkedin = linkedin;
                }
                return;
              }

              // Add as new contact if it has email or LinkedIn
              if (email || linkedin) {
                if (email) seenEmails.add(email);
                contacts.push({
                  name: candidateName,
                  title: (candidateTitle && candidateTitle.length < 80) ? candidateTitle : "",
                  email: email || "",
                  phone: "",
                  linkedin: linkedin || "",
                });
              }
            });
          } catch { /* selector may not exist */ }
        }

        // 4. Phone numbers
        const phoneRegex = /(?:\+?1[\s.-]?)?\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}/g;
        const phones = Array.from(new Set(text.match(phoneRegex) || []));

        // Attach first phone to contacts without one
        if (phones.length > 0) {
          for (const contact of contacts) {
            if (!contact.phone) {
              contact.phone = phones[0];
              break;
            }
          }
        }

        // 5. Social links (company-level)
        const socials: Record<string, string> = {};
        const linkedinProfiles: string[] = [];
        document.querySelectorAll("a[href]").forEach(a => {
          const href = (a as HTMLAnchorElement).href;
          if (href.includes("linkedin.com/company")) socials.linkedin = href;
          if (href.includes("linkedin.com/in/")) linkedinProfiles.push(href);
          if (href.includes("twitter.com/") || href.includes("x.com/")) socials.twitter = href;
          if (href.includes("facebook.com/")) socials.facebook = href;
          if (href.includes("instagram.com/")) socials.instagram = href;
          if (href.includes("github.com/")) socials.github = href;
        });

        return { pageTitle, metaDesc, contacts, phones, socials, linkedinProfiles };
      });
    };

    // Visit homepage
    try {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000)); // Let JS render

      // Dismiss cookie banners / overlays
      try {
        const dismissSelectors = [
          'button[id*="accept"]', 'button[id*="cookie"]', 'button[class*="accept"]',
          'button[class*="cookie"]', 'a[id*="accept"]', '[aria-label*="accept"]',
          '[aria-label*="close"]', 'button[class*="close"]', '.cookie-banner button',
          '#cookie-consent button', '.gdpr button',
        ];
        for (const sel of dismissSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn) { await btn.click(); break; }
          } catch { /* ignore */ }
        }
      } catch { /* ignore overlay dismiss errors */ }

      const homeData = await extractPageData();
      title = homeData.pageTitle;
      description = homeData.metaDesc;
      homeData.contacts.forEach(c => { if (c.email) allEmails.add(c.email); });
      homeData.phones.forEach(p => allPhones.add(p));
      Object.assign(socialLinks, homeData.socials);
      allContacts.push(...homeData.contacts);
      allLinkedinProfiles.push(...(homeData.linkedinProfiles || []));
      pagesVisited.push(targetUrl);
      console.log(`[PUPPETEER] Homepage: ${homeData.contacts.length} contacts, ${homeData.phones.length} phones`);
    } catch (navErr) {
      errors.push(`Homepage navigation failed: ${(navErr as Error).message}`);
    }

    // Visit high-value subpages (expanded list, limit 5)
    const subpages = ["/about", "/contact", "/team", "/about-us", "/contact-us", "/our-team", "/leadership", "/people", "/staff", "/careers"];
    const baseDomain = targetUrl.replace(/\/+$/, "");
    let subpagesVisited = 0;

    for (const path of subpages) {
      if (subpagesVisited >= 5) break;
      try {
        const subUrl = `${baseDomain}${path}`;
        const response = await page.goto(subUrl, { waitUntil: "domcontentloaded", timeout: 12000 });

        // Skip 404s and redirects back to homepage
        if (response && response.status() >= 400) continue;
        const finalUrl = page.url();
        if (pagesVisited.includes(finalUrl)) continue;

        await new Promise(r => setTimeout(r, 1500));

        const subData = await extractPageData();
        // Merge contacts, deduplicating by email
        for (const c of subData.contacts) {
          if (c.email && allEmails.has(c.email)) {
            // Update existing contact with better data
            const existing = allContacts.find(ec => ec.email === c.email);
            if (existing) {
              if (!existing.name && c.name) existing.name = c.name;
              if (!existing.title && c.title) existing.title = c.title;
              if (!existing.linkedin && c.linkedin) existing.linkedin = c.linkedin;
            }
          } else {
            if (c.email) allEmails.add(c.email);
            allContacts.push(c);
          }
        }
        subData.phones.forEach(p => allPhones.add(p));
        Object.assign(socialLinks, subData.socials);
        allLinkedinProfiles.push(...(subData.linkedinProfiles || []));
        pagesVisited.push(subUrl);
        subpagesVisited++;

        if (!description && subData.metaDesc) description = subData.metaDesc;
        console.log(`[PUPPETEER] ${path}: +${subData.contacts.length} contacts, +${subData.phones.length} phones`);
      } catch {
        // Subpage not found or timed out, continue
      }
    }

    const finalResult = {
      title,
      description,
      contacts: allContacts.slice(0, 20),
      emails: Array.from(allEmails).slice(0, 15),
      phones: Array.from(allPhones).slice(0, 10),
      socialLinks,
      linkedinProfiles: Array.from(new Set(allLinkedinProfiles)).slice(0, 10),
      techStack: [] as string[],
      pagesVisited: pagesVisited.filter(Boolean),
      errors,
    };

    // 3. Cache result globally
    if (domain) {
      try {
        const dedupeKey = `company:${domain}`;
        const existing = await db.crm_Global_Companies.findFirst({
          where: { OR: [{ domain }, { dedupeKey }] },
          select: { id: true },
        });

        const cacheData = {
          companyName: title,
          description,
          techStack: finalResult.techStack,
          emails: finalResult.emails,
          phones: finalResult.phones,
          socialLinks: finalResult.socialLinks,
          lastSeen: new Date(),
        };

        if (existing) {
          await db.crm_Global_Companies.update({
            where: { id: existing.id },
            data: cacheData,
          });
        } else {
          await db.crm_Global_Companies.create({
            data: { ...cacheData, domain, dedupeKey, firstSeen: new Date(), status: "ACTIVE" },
          });
        }
      } catch (cacheErr) {
        // Silently ignore — cache is best-effort
      }
    }

    return finalResult;
  } catch (error) {
    console.error("[VISIT_WEBSITE] Puppeteer error:", error);
    return { error: (error as Error).message };
  } finally {
    if (browser) await closeBrowser(browser);
  }
}

/**
 * Use AI to enrich missing company fields
 */
// Imports moved to top

/**
 * Use AI to enrich missing company fields
 */
async function enrichCompanyDataWithAI(
  domain: string,
  extractedData: any,
  userId: string,
  icp: ICPConfig
): Promise<{
  companyName: string;
  description: string;
  industry: string;
}> {
  try {
    const { model } = await getAiSdkModel(userId);
    if (!model) {
      return {
        companyName: domain,
        description: `Business website: ${domain}`,
        industry: icp.industries?.[0] || "General Business"
      };
    }

    const prompt = `You are analyzing a company website to extract structured business information.

DOMAIN: ${domain}
WEBSITE TITLE: ${extractedData.title || 'N/A'}
META DESCRIPTION: ${extractedData.description || 'N/A'}
FOUND EMAILS: ${extractedData.emails?.join(', ') || 'N/A'}
FOUND PHONES: ${extractedData.phones?.join(', ') || 'N/A'}
DETECTED TECH: ${extractedData.techStack?.join(', ') || 'N/A'}

TARGET ICP:
- Industries: ${icp.industries?.join(", ") || "Any"}
- Geographies: ${icp.geos?.join(", ") || "Any"}

Based on this information, provide:
1. companyName: The business name
2. description: A clear 1-2 sentence description
3. industry: The primary industry`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        companyName: z.string(),
        description: z.string(),
        industry: z.string(),
      }),
      messages: [
        { role: "system", content: "You are an expert at analyzing company websites." },
        { role: "user", content: prompt },
      ],
    });

    return object;
  } catch (error) {
    console.error("AI enrichment failed:", error);
  }

  // Fallback
  return {
    companyName: domain,
    description: `Business website: ${domain}`,
    industry: icp.industries?.[0] || "General Business"
  };
}

/**
 * Execute agent tool call
 */
async function executeToolCall(toolName: string, args: any, context: any): Promise<any> {
  switch (toolName) {
    case "search_companies":
      const searchResults = await ddgWebSearch(args.query, args.count || 20);
      // Log the search outcome to the job for traceability
      try {
        const top = searchResults.slice(0, 5).map(r => r.domain || (r.url ? extractDomain(r.url) : '')).filter(Boolean).join(', ');

        // Fetch current job to get existing queryTemplates and logs
        const job = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findUnique({
          where: { id: context.jobId },
          select: { queryTemplates: true, logs: true }
        });

        const existingTemplates = Array.isArray(job?.queryTemplates) ? job.queryTemplates : [];
        const newTemplates = Array.from(new Set([...existingTemplates, args.query]));

        await (prismadbCrm as any).crm_Lead_Gen_Jobs.update({
          where: { id: context.jobId },
          data: {
            queryTemplates: newTemplates,
            logs: [
              ...(job?.logs || []),
              { ts: new Date().toISOString(), msg: `🔍 search_companies("${args.query}") -> ${searchResults.length} results. Top: ${top || 'none'}` }
            ]
          }
        });
      } catch (dbErr) {
        console.error("Failed to update job for search query", dbErr);
      }
      return {
        success: true,
        results: searchResults,
        count: searchResults.length
      };

    case "visit_website":
      const siteData = await visitWebsiteForAgent(args.url, context.userId, context.icp);
      return {
        success: !siteData.error,
        data: siteData,
        url: args.url
      };

    case "analyze_company_fit":
      // AI will analyze this in its next turn
      return {
        success: true,
        domain: args.domain,
        ready_for_analysis: true
      };

    case "save_company":
      const db: any = prismadbCrm;
      const domain = normalizeDomain(args.domain);

      // Blacklist Check: Ensure we don't save already existing customers
      try {
        const { prismadb: mainDb } = await import("@/lib/prisma");
        const existingAccount = await (mainDb as any).crm_Accounts.findFirst({
          where: {
            OR: [
              { website: { contains: domain } },
              { website: { endsWith: domain } }
            ]
          }
        });
        if (existingAccount) {
          console.log(`[SAVE_COMPANY] Blacklisted: ${domain} is already a customer in crm_Accounts.`);
          return { success: false, error: "Company is already an existing customer (Blacklisted)." };
        }
      } catch (e) {
        console.warn("[SAVE_COMPANY] Blacklist check error:", e);
      }

      console.log("[SAVE_COMPANY] Validating company:", {
        domain,
        companyName: args.companyName,
        hasDescription: !!args.description,
        hasIndustry: !!args.industry,
        contactCount: args.contacts?.length || 0
      });

      if (!domain) {
        console.log("[SAVE_COMPANY] Validation failed: Invalid domain");
        return { success: false, error: "Invalid domain" };
      }

      // Directory / aggregator domain blocklist — these are never real leads
      const DIRECTORY_DOMAINS = new Set([
        'crunchbase.com', 'linkedin.com', 'f6s.com', 'tracxn.com', 'growthlist.co',
        'pitchbook.com', 'owler.com', 'zoominfo.com', 'apollo.io', 'clearbit.com',
        'builtwith.com', 'stackshare.io', 'g2.com', 'capterra.com', 'clutch.co',
        'glassdoor.com', 'indeed.com', 'yelp.com', 'bbb.org', 'trustpilot.com',
        'producthunt.com', 'angel.co', 'wellfound.com', 'techcrunch.com',
        'bloomberg.com', 'reuters.com', 'forbes.com', 'inc.com', 'entrepreneur.com',
        'wikipedia.org', 'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
        'instagram.com', 'youtube.com', 'tiktok.com', 'github.com',
        'ycombinator.com', 'similarweb.com', 'alexa.com', 'semrush.com',
        'manta.com', 'dnb.com', 'hoovers.com', 'yellowpages.com',
        'mapquest.com', 'google.com', 'bing.com', 'yahoo.com',
      ]);
      if (DIRECTORY_DOMAINS.has(domain)) {
        console.log(`[SAVE_COMPANY] Validation failed: "${domain}" is a directory/aggregator, not a real lead`);
        return { success: false, error: `"${domain}" is a directory/aggregator website, not a prospectable company` };
      }

      // Validate: Must have at least one contact with email or phone
      if (!args.contacts || !Array.isArray(args.contacts) || args.contacts.length === 0) {
        console.log("[SAVE_COMPANY] Validation failed: No contacts");
        return { success: false, error: "Cannot save company without contacts" };
      }
      // ── Contact Name Quality Validation ──
      // Reject names that are company names, department labels, or generic placeholders
      const companyNameLower = (args.companyName || "").toLowerCase().trim();
      const domainBase = domain.split(".")[0]?.toLowerCase() || "";
      const BOGUS_NAME_PATTERNS = [
        /^(general\s+)?contact$/i, /^customer\s*service$/i, /^sales$/i,
        /^support$/i, /^info$/i, /^admin$/i, /^billing$/i, /^hr$/i,
        /^marketing$/i, /^office$/i, /^reception$/i, /^help\s*desk$/i,
        /^accounts?$/i, /^enquir(y|ies)$/i, /^team$/i, /^staff$/i,
        /^management$/i, /^operations$/i, /^service$/i, /^direct$/i,
        /^unknown$/i, /^n\/?a$/i, /^none$/i, /^-$/,
      ];
      const BOGUS_TITLE_PATTERNS = [
        /^contact$/i, /^general\s+contact$/i, /^n\/?a$/i, /^unknown$/i,
        /^-$/i, /^none$/i, /^employee$/i, /^staff$/i, /^company$/i,
      ];

      for (const contact of (args.contacts || [])) {
        const nameLower = (contact.name || "").toLowerCase().trim();

        // Clear name if it matches/contains the company name (or vice versa)
        if (nameLower && companyNameLower) {
          const nameNorm = nameLower.replace(/[^a-z0-9\s]/g, "");
          const compNorm = companyNameLower.replace(/[^a-z0-9\s]/g, "");
          if (nameNorm === compNorm || compNorm.includes(nameNorm) || nameNorm.includes(compNorm) || nameNorm.includes(domainBase)) {
            console.log(`[SAVE_COMPANY] Clearing bogus name "${contact.name}" (matches company name)`);
            contact.name = "";
          }
        }

        // Clear names that are department labels or generic placeholders
        if (contact.name && BOGUS_NAME_PATTERNS.some(p => p.test(contact.name.trim()))) {
          console.log(`[SAVE_COMPANY] Clearing bogus name "${contact.name}" (generic label)`);
          contact.name = "";
        }

        // Clear bogus titles
        if (contact.title && BOGUS_TITLE_PATTERNS.some(p => p.test(contact.title.trim()))) {
          contact.title = "";
        }

        // If email local part looks like a name (firstname.lastname), derive the name
        if (!contact.name && contact.email) {
          const local = contact.email.split("@")[0] || "";
          // Check if local part has name-like pattern: first.last, first_last, firstlast
          const nameParts = local.split(/[._\-]/);
          if (nameParts.length >= 2 && nameParts.every((p: string) => p.length >= 2 && /^[a-zA-Z]+$/.test(p))) {
            contact.name = nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
          }
        }
      }

      // Augment contacts with pattern-based guesses behind feature flag
      const augmentedContacts: any[] = Array.isArray(args.contacts) ? [...args.contacts] : [];
      if (ScraperConfig.patternGuess.enabled && domain) {
        try {
          const observedPairs = augmentedContacts
            .filter((c) => c?.name && c?.email)
            .map((c) => ({ name: String(c.name), email: String(c.email).toLowerCase() }));
          if (observedPairs.length > 0) {
            const ttlMs = ScraperConfig.patternGuess.ttlDays * 24 * 60 * 60 * 1000;
            learnDomainPatterns(domain, observedPairs, ttlMs);
          }
          for (const c of augmentedContacts) {
            if (!c.email && c.name) {
              const guesses = guessEmailForName(domain, c.name, 1);
              const top = guesses[0];
              if (top && top.confidence >= ScraperConfig.patternGuess.minConfidenceToAssign) {
                c.email = top.email;
                (c as any).__patternGuess = top; // temp: attach for provenance
              }
            }
          }
        } catch (e) {
          console.warn("[SAVE_COMPANY] Pattern model error:", (e as Error).message);
        }
      }

      // Enforce email requirement: must have at least one email (phones alone are not sufficient)
      const contactsWithEmails = augmentedContacts.filter((c: any) => c.email && c.email.trim().length > 0);
      console.log("[SAVE_COMPANY] Contacts with emails:", contactsWithEmails.length);

      if (contactsWithEmails.length === 0) {
        console.log("[SAVE_COMPANY] Validation failed: No emails found");
        return { success: false, error: "Cannot save company without at least one email address" };
      }

      // Use AI to enrich missing fields if not provided
      let companyName = args.companyName;
      let description = args.description;
      let industry = args.industry;

      // If any field is missing, use AI to enrich
      if (!companyName || !description || !industry) {
        console.log("[SAVE_COMPANY] Enriching missing fields with AI...");
        const enriched = await enrichCompanyDataWithAI(
          domain,
          {
            title: args.companyName,
            description: args.description,
            emails: args.contacts?.map((c: any) => c.email).filter(Boolean),
            phones: args.contacts?.map((c: any) => c.phone).filter(Boolean),
            techStack: args.techStack
          },
          context.userId,
          context.icp
        );

        companyName = companyName || enriched.companyName;
        description = description || enriched.description;
        industry = industry || enriched.industry;

        console.log("[SAVE_COMPANY] AI enrichment complete:", {
          companyName,
          industry,
          descLength: description.length
        });
      }

      console.log("[SAVE_COMPANY] Saving with complete data:", {
        companyName,
        hasDescription: !!description,
        industry,
        contactCount: contactsWithEmails.length
      });

      try {
        // Save to global index (findFirst + update/create to avoid dedupeKey constraint)
        const dedupeKey = generateCompanyDedupeKey(domain);
        const existingGlobal = await db.crm_Global_Companies.findFirst({
          where: { OR: [{ domain }, { dedupeKey }] },
          select: { id: true },
        });
        const globalCacheData = {
          companyName,
          description,
          industry,
          techStack: args.techStack || [],
          lastSeen: new Date(),
        };
        if (existingGlobal) {
          await db.crm_Global_Companies.update({
            where: { id: existingGlobal.id },
            data: globalCacheData,
          });
        } else {
          await db.crm_Global_Companies.create({
            data: { ...globalCacheData, domain, dedupeKey, firstSeen: new Date(), status: "ACTIVE", provenance: { source: "agentic_ai", jobId: context.jobId } },
          });
        }

        // Calculate quality score based on data completeness
        // Base score starts at 50, add points for quality signals
        let qualityScore = 50;

        // +10 points for each contact found (up to +30)
        qualityScore += Math.min(contactsWithEmails.length * 10, 30);

        // +10 points if we have multiple emails
        const emailCount = augmentedContacts.filter((c: any) => c.email).length;
        if (emailCount >= 2) qualityScore += 10;

        // +5 points for tech stack
        if (args.techStack && args.techStack.length > 0) qualityScore += 5;

        // +5 points for complete company info
        if (description && description.length > 50) qualityScore += 5;

        // Cap at 95 (ICP scoring will adjust from there)
        qualityScore = Math.min(qualityScore, 95);

        // Save to user pool (de-duplicate within pool by dedupeKey)
        const existingCandidate = await db.crm_Lead_Candidates.findFirst({
          where: { pool: context.poolId, dedupeKey }
        });

        // Prepare merged tech stack
        const incomingTech: string[] = Array.isArray(args.techStack) ? args.techStack : [];
        const mergeTech = (a?: any, b?: any) => Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));

        let candidate: any;
        if (existingCandidate) {
          const mergedTech = mergeTech(existingCandidate.techStack, incomingTech);
          const mergedScore = Math.max(existingCandidate.score || 0, qualityScore);
          const betterDescription = (existingCandidate.description?.length || 0) >= (description?.length || 0)
            ? existingCandidate.description
            : description;
          const finalCompanyName = existingCandidate.companyName || companyName;
          const finalIndustry = existingCandidate.industry || industry;

          candidate = await db.crm_Lead_Candidates.update({
            where: { id: existingCandidate.id },
            data: {
              companyName: finalCompanyName,
              description: betterDescription,
              industry: finalIndustry,
              techStack: mergedTech,
              homepageUrl: existingCandidate.homepageUrl || `https://${domain}`,
              score: mergedScore,
              // keep earliest status or set to NEW if missing
              status: existingCandidate.status || "NEW",
              provenance: { source: "agentic_ai", jobId: context.jobId, merged: true }
            }
          });
        } else {
          candidate = await db.crm_Lead_Candidates.create({
            data: {
              pool: context.poolId,
              domain,
              dedupeKey,
              companyName,
              description,
              industry,
              techStack: incomingTech,
              homepageUrl: `https://${domain}`,
              score: qualityScore,
              status: "NEW",
              provenance: { source: "agentic_ai", jobId: context.jobId }
            }
          });
        }

        // Save ALL contacts with emails or phones
        let contactsSavedCount = 0;
        let validEmailCount = 0;
        let personaDecisionMakerFound = false;
        if (augmentedContacts && Array.isArray(augmentedContacts)) {
          for (const contact of augmentedContacts) {
            const cleaned = sanitizeContact({
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              title: contact.title,
              linkedin: contact.linkedin,
            }, { deprioritizeRoleEmails: true });

            if (cleaned) {
              let email = cleaned.email || null;
              const phone = cleaned.phone || null;

              // Strict guard: require email per-contact (drop phone-only entries)
              if (!email) {
                continue;
              }

              // Optional email verification (syntax-only by default; adapters can extend MX/SMTP)
              let emailStatus: any = "UNKNOWN";
              let verificationResult: any = null;
              let confScore = 70;
              try {
                if (ScraperConfig.verify.enabled && email) {
                  const verification = await verifyEmail(email, {
                    stages: ScraperConfig.verify.stages,
                    cacheTtlMs: ScraperConfig.verify.domainTtlDays * 24 * 60 * 60 * 1000,
                    domainTtlMs: ScraperConfig.verify.domainTtlDays * 24 * 60 * 60 * 1000,
                    smtpTtlMs: ScraperConfig.verify.smtpTtlDays * 24 * 60 * 60 * 1000,
                    adapters: ScraperConfig.verify.useAdapters ? buildResendAdapters() : undefined,
                  });
                  verificationResult = verification;
                  if (verification.steps.catchAll?.value === "yes") {
                    emailStatus = "CATCH_ALL";
                    confScore = Math.max(confScore, 65);
                  } else if (verification.status === "valid") {
                    emailStatus = "VALID";
                    confScore = Math.max(confScore, 85);
                    validEmailCount++;
                  } else if (verification.status === "risky") {
                    emailStatus = "RISKY";
                    confScore = Math.max(confScore, 70);
                  } else if (verification.status === "invalid") {
                    emailStatus = "INVALID";
                    email = null; // drop invalid
                    confScore = Math.max(confScore, 50);
                  }
                }
              } catch (e) {
                // Non-fatal: keep email if present
              }

              // Build a safe display name using email/company/domain fallbacks (avoid "Direct Direct")
              let safeName = cleaned.name || safeContactDisplayName(
                contact.name,
                cleaned.email,
                companyName,
                domain
              );
              // Ensure concatenations are fixed
              safeName = fixConcat(safeName) || safeName;

              const personDedupeKey = generatePersonDedupeKey(
                email || phone || "",
                safeName,
                domain,
                cleaned.title
              );

              // Title normalization & persona tagging
              const titleInfo = normalizeTitleAndPersona(cleaned.title);
              if (titleInfo) {
                const isDecisionMaker =
                  titleInfo.persona === "TECH_DECISION_MAKER" ||
                  (titleInfo.ladder === "C-SUITE" || titleInfo.ladder === "VP" || titleInfo.ladder === "DIRECTOR");
                if (isDecisionMaker) personaDecisionMakerFound = true;
              }

              const existingContact = await db.crm_Contact_Candidates.findFirst({
                where: { leadCandidate: candidate.id, dedupeKey: personDedupeKey }
              });

              if (existingContact) {
                // Merge missing fields; keep existing confidence if higher
                await db.crm_Contact_Candidates.update({
                  where: { id: existingContact.id },
                  data: {
                    fullName: normalizeName(safeName) || existingContact.fullName,
                    title: existingContact.title || (titleInfo?.normalizedTitle ?? cleaned.title) || null,
                    email: existingContact.email || email || null,
                    phone: existingContact.phone || phone || null,
                    linkedinUrl: existingContact.linkedinUrl || cleaned.linkedin || null,
                    emailStatus: (existingContact as any).emailStatus || emailStatus,
                    confidence: Math.max(existingContact.confidence || 0, confScore),
                    provenance: {
                      ...(existingContact.provenance || {}),
                      merged: true,
                      jobId: context.jobId,
                      normalizedTitle: titleInfo || undefined,
                      patternGuess: (contact as any).__patternGuess || undefined,
                      emailVerification: verificationResult || undefined,
                    }
                  }
                });
              } else {
                await db.crm_Contact_Candidates.create({
                  data: {
                    leadCandidate: candidate.id,
                    fullName: normalizeName(safeName) || safeName,
                    title: (titleInfo?.normalizedTitle ?? cleaned.title) || null,
                    email: email || null,
                    phone: phone || null,
                    linkedinUrl: cleaned.linkedin || null,
                    dedupeKey: personDedupeKey,
                    emailStatus: emailStatus,
                    confidence: confScore,
                    status: "NEW",
                    provenance: {
                      source: "agentic_ai",
                      jobId: context.jobId,
                      normalizedTitle: titleInfo || undefined,
                      patternGuess: (contact as any).__patternGuess || undefined,
                      emailVerification: verificationResult || undefined,
                    }
                  }
                });
                contactsSavedCount++;
              }
            }
          }
        }

        try {
          let adjustedScore = qualityScore;
          if (personaDecisionMakerFound) adjustedScore = Math.min(adjustedScore + 10, 95);
          if (validEmailCount >= 2) adjustedScore = Math.min(adjustedScore + 5, 95);
          await db.crm_Lead_Candidates.update({
            where: { id: candidate.id },
            data: { score: Math.max(candidate.score || 0, adjustedScore) }
          });
        } catch { }
        return {
          success: true,
          candidateId: candidate.id,
          contactsCreated: contactsSavedCount
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }

    case "refine_search_strategy":
      // Log the agent's reasoning
      const db2: any = prismadbCrm;
      await db2.crm_Lead_Gen_Jobs.update({
        where: { id: context.jobId },
        data: {
          logs: [
            ...(context.logs || []),
            {
              ts: new Date().toISOString(),
              msg: `Agent reasoning: ${args.reasoning}`
            }
          ]
        }
      });
      return {
        success: true,
        shouldContinue: args.currentResults < args.targetResults
      };

    default:
      return { success: false, error: "Unknown tool" };
  }
}

/**
 * Run agentic AI lead generation
 * The AI autonomously searches, analyzes, and saves leads
 */
export async function runAgenticLeadGeneration(
  jobId: string,
  userId: string,
  icp: ICPConfig,
  poolId: string,
  maxCompanies: number = 100,
  initialState?: {
    companiesSaved?: number;
    contactsSaved?: number;
    queryTemplates?: string[];
  }
): Promise<{
  companiesSaved: number;
  contactsSaved: number;
  iterations: number;
}> {
  const { model } = await getAiSdkModel(userId);
  if (!model) {
    throw new Error("AI model not configured");
  }

  const db: any = prismadbCrm;
  const isResume = !!initialState && (initialState.companiesSaved || 0) > 0;

  // Initial prompt for the agent
  let systemPrompt = `You are an ELITE B2B lead generation agent with world-class expertise in search, web scraping, and contact discovery. Your mission: autonomously find and qualify ${maxCompanies} PERFECT-FIT companies with ACTUAL decision-maker contact information.

ICP CRITERIA (Ideal Customer Profile):
- Industries: ${icp.industries?.join(", ") || "Any"}
- Geographies: ${icp.geos?.join(", ") || "Any"}
- Tech Stack: ${icp.techStack?.join(", ") || "Any"}
- Target Titles: ${icp.titles?.join(", ") || "Any"}
${icp.notes ? `- Additional Notes: ${icp.notes}` : ""}

TARGET: ${maxCompanies} companies with HIGH-QUALITY contact information
`;

  if (isResume) {
    systemPrompt += `
═══════════════════════════════════════════════════════
🔄 RESUMPTION CONTEXT
═══════════════════════════════════════════════════════
- **Previous Progress**: You already saved ${initialState?.companiesSaved || 0} companies and ${initialState?.contactsSaved || 0} contacts.
- **Goal Remaining**: Find ${maxCompanies - (initialState?.companiesSaved || 0)} more companies.
- **Avoid Duplication**: You have already explored these search queries: ${initialState?.queryTemplates?.join(", ") || "None"}.
- **Action**: Start by exploring NEW search queries or deeper research on existing results.
`;
  }

  systemPrompt += `
═══════════════════════════════════════════════════════
🎯 CRITICAL SUCCESS CRITERIA (READ CAREFULLY)
═══════════════════════════════════════════════════════

1. ⚠️ **EMAIL REQUIREMENT**: NEVER save a company without AT LEAST ONE email address
2. **MULTIPLE CONTACTS**: Extract ALL contacts from EVERY qualified company (aim for 3-5+ per company)
3. **AUTONOMOUS DEEP RESEARCH**: The visit_website tool automatically crawls up to 5 subpages (/about, /team, /contact, /leadership, /careers, /people) for you! It returns STRUCTURED CONTACTS with names, titles, emails, and LinkedIn URLs already extracted.
4. **PARALLEL EXECUTION**: Visit 5-10 different company websites simultaneously for speed.
5. **QUALITY > SPEED**: Better to save 20 perfect companies with contacts than 100 with missing data.

═══════════════════════════════════════════════════════
🚨 CONTACT NAME RULES (MANDATORY - VIOLATIONS REJECTED)
═══════════════════════════════════════════════════════

**The contact name field is for REAL HUMAN NAMES only.**

✅ GOOD contact examples:
- { name: "John Smith", title: "CEO", email: "john@company.com" }
- { name: "Maria Garcia", title: "VP Sales", email: "maria.garcia@company.com" }
- { name: "", title: "", email: "info@company.com" }  ← no name known, leave empty

❌ BAD contact examples (system will REJECT these):
- { name: "Acme Corp", title: "Contact", email: "info@acme.com" }  ← company name as person name!
- { name: "Customer Service", title: "General Contact", email: "support@acme.com" }  ← department as name!
- { name: "Sales", title: "Sales Contact", email: "sales@acme.com" }  ← department label!

**RULES:**
- Contact name MUST be a real person's first and last name (e.g., "Jane Doe")
- If you do NOT know the person's real name, set name to EMPTY STRING ""
- NEVER use the company name, domain name, or department name as a contact name
- For title: use real job titles ("CEO", "VP Sales", "Marketing Director"), NOT "Contact" or "General Contact"
- If you don't know the title, set title to EMPTY STRING ""
- The system will automatically label unnamed contacts as "General Contact" or "Sales Contact" based on email type

**NEVER SAVE THESE AS COMPANIES (they are directories/aggregators, NOT real leads):**
Crunchbase, LinkedIn, F6S, Tracxn, GrowthList, PitchBook, ZoomInfo, Apollo, G2, Capterra,
Clutch, Glassdoor, Indeed, Yelp, ProductHunt, Wikipedia, Reddit, Twitter/X, Facebook, GitHub,
YouTube, TikTok, Instagram, Bloomberg, Forbes, TechCrunch, Entrepreneur, Inc, YCombinator.
Only save ACTUAL COMPANY WEBSITES with real business operations.`;

  systemPrompt += `
═══════════════════════════════════════════════════════
🔍 MASTER CONTACT EXTRACTION STRATEGIES
═══════════════════════════════════════════════════════

** WHERE TO FIND EMAILS(Priority Order):**

    1. ** Contact Pages ** (domain.com / contact, /contact-us)
      - General inquiry emails(info@, contact@, hello@)
        - Department emails(sales@, support@, careers@)
          - Individual contact forms with emails

2. ** Team / About Pages ** (domain.com / team, /about, /about - us, /leadership)
    - Founder / CEO emails
      - Leadership team contacts
        - Employee bios with email addresses

  3. ** Footer & Header **
    - Company - wide contact emails
      - Support / sales emails
        - Press / media contact emails

  4. ** Careers Pages ** (domain.com / careers, /jobs)
    - Recruiting emails
      - HR contact information
        - "Questions? Contact recruiter@..."

  5. ** Press / Media Pages ** (domain.com / press, /media, /newsroom)
    - PR contact emails
      - Media inquiry addresses

  6. ** Blog / Articles ** (domain.com / blog)
    - Author emails
      - Contact the editor emails

        ** ADVANCED TACTICS:**

- ** Visit 3 - 5 pages per company minimum **: Homepage + Contact + Team + About + Careers
    - ** Look in page source **: Sometimes emails are in mailto: links or meta tags
      - ** Check subdomains **: blog.company.com, careers.company.com might have different contacts
        - ** Extract from text patterns **: Look for email patterns like firstname @domain.com
- ** LinkedIn URLs **: Extract any LinkedIn profile URLs(useful even without email)
    - ** Phone numbers **: Extract all phone numbers as backup contact methods

═══════════════════════════════════════════════════════
🔎 DUCKDUCKGO SEARCH MASTERY
═══════════════════════════════════════════════════════

** EFFECTIVE QUERY PATTERNS:**

✓ Industry + Location:
  "${icp.industries?.[0] || 'SaaS'} companies in ${icp.geos?.[0] || 'San Francisco'}"
  
✓ Industry + Company Stage:
  "top ${icp.industries?.[0] || 'fintech'} startups ${icp.geos?.[0] || 'New York'}"
  "Series A ${icp.industries?.[0] || 'AI'} companies"
  
✓ Industry + Hiring(great for finding active companies):
    "${icp.industries?.[0] || 'tech'} companies hiring ${icp.titles?.[0] || 'engineers'}"
  "${icp.industries?.[0] || 'SaaS'} careers page"
  
✓ Technology - specific:
  "companies using ${icp.techStack?.[0] || 'React'}"
  "built with ${icp.techStack?.[0] || 'Node.js'}"

✓ Company directories(very effective):
  "site:crunchbase.com ${icp.industries?.[0] || 'SaaS'} ${icp.geos?.[0] || ''}"
  "site:linkedin.com/company ${icp.industries?.[0] || 'AI'}"
  "site:producthunt.com ${icp.industries?.[0] || 'productivity'}"

    ** SEARCH STRATEGY:**
      - Start with 3 - 5 diverse queries in your first search batch
        - If results are poor quality, try different keywords
          - Prioritize actual company websites over directories
            - Mix broad and specific queries for coverage

═══════════════════════════════════════════════════════
🎬 OPTIMAL WORKFLOW(FOLLOW THIS PATTERN)
═══════════════════════════════════════════════════════

** ITERATION 1 - 3: Cast Wide Net **
    1. Execute 3 - 5 searches with diverse queries
  2. Visit top 10 - 15 company websites IN PARALLEL
  3. Use visit_website on the company domain(it will automatically Deep Crawl for you)
    4. Save companies that have emails(aim for 5 - 10 companies per iteration)

** ITERATION 4 - 10: Deep Qualification **
    1. If you have < 50 % of target, do more searches
2. Extract ALL possible contacts from the visit_website results
  3. Save only ICP - aligned companies with decision - maker emails

    ** ITERATION 10 +: Quality Refinement **
      1. Review what's working - which search queries yielded best results?
        ** EXCELLENT PERFORMANCE:**
          - 80 % + of companies have 3 + contacts
            - 90 % + of contacts have emails
              - 100 % ICP alignment
                - Average 5 + contacts per company

                  ** GOOD PERFORMANCE:**
                    - 60 % + of companies have 2 + contacts
                      - 80 % + of contacts have emails
                        - 90 % ICP alignment
                          - Average 3 + contacts per company

                            ** NEEDS IMPROVEMENT:**
                              - <50% of companies have 2 + contacts
                                - <70% of contacts have emails
                                  - <80% ICP alignment

YOUR TOOLS(use in parallel whenever possible):
  1. search_companies - DuckDuckGo search
  2. visit_website - Extract data from any URL
  3. save_company - Save qualified companies with contacts
4. refine_search_strategy - Evaluate and adjust

  Remember: QUALITY > QUANTITY.Better to save 50 perfect companies with 250 contacts than 100 companies with 100 contacts.

Be strategic, thorough, and relentless in finding contact information.Good luck! 🚀`;

  // Start with a User message; pass systemPrompt via the 'system' option in generateText
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Begin lead generation. Find ${maxCompanies} companies matching the ICP.

WORKFLOW TO FOLLOW:
  1. First, use search_companies to find relevant companies
  2. Then, use visit_website IN PARALLEL on multiple promising URLs from the search results
  3. The visit_website tool returns STRUCTURED CONTACTS (with name, title, email, linkedin). Use these directly!
  4. After extracting data, IMMEDIATELY use save_company if you found AT LEAST ONE email
  5. For each email found, create a contact object. Set name to EMPTY STRING "" if you don't know the real person name.
  6. NEVER use the company name as a contact name. The system handles unnamed contacts automatically.
  7. Continue this cycle (search -> visit -> save) until you reach ${maxCompanies} saved companies

CONTACT RULES (CRITICAL):
  - name MUST be a real person's FirstName LastName, or empty string ""
  - NEVER set name to the company name, department name, or generic labels
  - title MUST be a real job title (CEO, VP Sales, etc), or empty string ""
  - The system will auto-label unnamed contacts as "General Contact" or "Sales Contact" based on email

Start now by searching for companies.`
    }
  ];

  let companiesSaved = initialState?.companiesSaved || 0;
  let contactsSaved = initialState?.contactsSaved || 0;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops
  const context = { jobId, poolId, logs: [], icp, userId };
  let noProgressStreak = 0;
  let prevCompaniesSaved = 0;
  let prevContactsSaved = 0;
  const STALL_THRESHOLD = 5;

  // Buffer logs locally to reduce DB write conflicts
  let logBuffer: Array<{ ts: string; msg: string; level?: string }> = [];
  let lastDbUpdate = Date.now();
  const DB_UPDATE_INTERVAL = 3000; // Only update DB every 3 seconds

  // Helper to add log to buffer
  const addLog = (logMsg: string, level?: string) => {
    logBuffer.push({ ts: new Date().toISOString(), msg: logMsg, level });
    console.log(logMsg); // Always log to console
  };

  // Helper to flush logs to database with retry logic
  const flushLogsToDb = async (force: boolean = false, retries: number = 5) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastDbUpdate;

    // Only update if forced OR enough time has passed OR buffer is large
    if (!force && timeSinceLastUpdate < DB_UPDATE_INTERVAL && logBuffer.length < 10) {
      return;
    }

    if (logBuffer.length === 0 && !force) {
      return;
    }

    const logsToWrite = [...logBuffer];
    const updateData: any = {
      logs: logsToWrite,
      counters: {
        companiesFound: companiesSaved,
        contactsSaved,
        iterations,
        progress: Math.min(100, Math.round((companiesSaved / maxCompanies) * 100))
      }
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await db.crm_Lead_Gen_Jobs.update({
          where: { id: jobId },
          data: updateData
        });

        // Success - clear the buffer and update timestamp
        logBuffer = [];
        lastDbUpdate = now;
        return;
      } catch (error: any) {
        if (error.code === 'P2034' && attempt < retries - 1) {
          // Write conflict - wait with exponential backoff (longer delays)
          const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt === retries - 1) {
          // Last attempt failed, log but don't crash
          console.error("Failed to flush logs after retries:", error);
          // Don't clear buffer in case we can retry later
        } else {
          throw error; // Different error, re-throw
        }
      }
    }
  };

  // Log agent start
  addLog("🤖 Agentic AI scraper starting...");
  await flushLogsToDb(true); // Force initial update

  while (iterations < maxIterations && companiesSaved < maxCompanies) {
    iterations++;

    // Check if job has been paused or stopped
    try {
      const currentJob = await db.crm_Lead_Gen_Jobs.findUnique({
        where: { id: jobId },
        select: { status: true }
      });

      if (currentJob?.status === "PAUSED") {
        addLog("⏸️ Job paused - waiting for resume...");
        await flushLogsToDb(true);

        // Wait and check again
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds

          const checkJob = await db.crm_Lead_Gen_Jobs.findUnique({
            where: { id: jobId },
            select: { status: true }
          });

          if (checkJob?.status === "RUNNING") {
            addLog("▶️ Job resumed - continuing...");
            await flushLogsToDb(true);
            break;
          } else if (checkJob?.status === "STOPPED") {
            addLog("⏹️ Job stopped by user - exiting");
            await flushLogsToDb(true);
            return {
              companiesSaved,
              contactsSaved,
              iterations
            };
          }
        }
      } else if (currentJob?.status === "STOPPED") {
        addLog("⏹️ Job stopped by user - exiting");
        await flushLogsToDb(true);
        return {
          companiesSaved,
          contactsSaved,
          iterations
        };
      }
    } catch (statusCheckError) {
      console.error("Failed to check job status:", statusCheckError);
      // Continue anyway - don't crash on status check
    }

    try {
      // Use generateText from AI SDK
      // We pass the full history (messages) so it knows what happened
      // We also pass the tools definition
      // maxSteps is handled by maxIterations (default 50) in the while loop above
      const tools = buildToolsDefinition(context);
      const genOpts: any = {
        model,
        system: systemPrompt,
        messages,
        tools,
      };
      // Only set temperature for non-reasoning models; omit entirely otherwise
      if (!isReasoningModel(model.modelId)) {
        genOpts.temperature = 1;
      }
      const { text, toolCalls, response, toolResults } = await generateText(genOpts);

      // Check if agent wants to use tools
      if (toolCalls && toolCalls.length > 0) {
        const toolCount = toolCalls.length;

        // Append assistant message with tool-call parts (explicit ModelMessage shape)
        // Use SDK-generated assistant/tool messages to ensure exact v5 shapes
        if (response?.messages && Array.isArray(response.messages)) {
          messages.push(...(response.messages as unknown as ModelMessage[]));
        }

        // Logging for visibility
        toolCalls.forEach((tc: any, index: number) => {
          const toolName = tc.toolName;
          const toolArgs = tc.input ?? {};
          let logMsg = "";
          switch (toolName) {
            case "search_companies":
              logMsg = `🔍[${index + 1}/${toolCount}]Searching: "${(toolArgs as any).query}"`;
              break;
            case "visit_website":
              const urlDomain = extractDomain((toolArgs as any).url);
              logMsg = `🌐[${index + 1}/${toolCount}] Visiting: ${urlDomain || (toolArgs as any).url} `;
              break;
            case "analyze_company_fit":
              logMsg = `🔬[${index + 1}/${toolCount}] Analyzing: ${(toolArgs as any).domain} `;
              break;
            case "save_company":
              logMsg = `💾[${index + 1}/${toolCount}] Saving: ${(toolArgs as any).companyName || (toolArgs as any).domain} `;
              break;
            case "refine_search_strategy":
              logMsg = `🎯[${index + 1}/${toolCount}] Strategy: ${(toolArgs as any).reasoning?.substring(0, 100) ?? ''}...`;
              break;
            default:
              logMsg = `🤖[${index + 1}/${toolCount}] ${toolName} `;
          }
          addLog(logMsg);
        });

        // Track saves and summarize using toolResults
        const savedResults = (toolResults ?? []).filter((tr: any) => {
          if (tr.toolName !== "save_company") return false;
          const out = tr.output;
          if (!out) return false;
          if (typeof out === 'object' && 'type' in out) {
            if (out.type === 'json' && out.value && typeof out.value === 'object') {
              return !!out.value.success;
            }
            if (out.type === 'text') {
              try { const obj = JSON.parse(out.value); return !!obj.success; } catch { return false; }
            }
            return false;
          }
          // Fallback if provider returned plain object
          return !!(out as any).success;
        });
        for (const tr of savedResults) {
          const out = tr.output;
          if (typeof out === 'object' && 'type' in out) {
            if (out.type === 'json' && out.value) {
              companiesSaved++;
              contactsSaved += out.value.contactsCreated || 0;
            }
          } else {
            companiesSaved++;
            contactsSaved += (out as any)?.contactsCreated || 0;
          }
        }

        let summary = `✅ Batch complete: ${toolCount} tool call${toolCount > 1 ? 's' : ''} `;
        if (savedResults.length > 0) summary += ` | ${savedResults.length} saved`;
        summary += ` | Total: ${companiesSaved}/${maxCompanies} companies (${contactsSaved} contacts)`;
        addLog(summary);

        // Detect SERP skip/no results towards stall completion
        let __serpZero = false;
        try {
          for (const tr of (toolResults ?? [])) {
            if (tr.toolName !== 'search_companies') continue;
            let payload: any = tr.output;
            if (payload && typeof payload === 'object' && 'type' in payload) {
              if (payload.type === 'json') payload = payload.value;
              else if (payload.type === 'text') {
                try { payload = JSON.parse(payload.value); } catch { /* ignore */ }
              }
            }
            const cnt = typeof payload?.count === 'number' ? payload.count : (Array.isArray(payload?.results) ? payload.results.length : 0);
            if (cnt === 0) { __serpZero = true; break; }
          }
        } catch { }
        if (__serpZero && savedResults.length === 0) {
          addLog('SERP returned 0 results and no companies were saved in this batch. Refining strategy and continuing.');
          messages.push({
            role: 'user',
            content: 'SERP returned zero results. Refine and continue: diversify queries (synonyms, broader/narrower), broaden geos, include directories (LinkedIn, Crunchbase, ProductHunt), and prioritize /about, /team, /contact pages.'
          });
          noProgressStreak = 0;
        }

        // Explicitly echo search_companies results back into the conversation for the model
        try {
          const callMap = new Map((toolCalls ?? []).map((tc: any) => [tc.toolCallId, tc.input ?? {}]));
          const searchSummaries: string[] = [];
          for (const tr of (toolResults ?? [])) {
            if (tr.toolName !== 'search_companies') continue;
            const input = callMap.get(tr.toolCallId) || {};
            const query = (input as any).query || '(unknown query)';
            let payload: any = tr.output;
            if (payload && typeof payload === 'object' && 'type' in payload) {
              if (payload.type === 'json') payload = payload.value;
              else if (payload.type === 'text') { try { payload = JSON.parse(payload.value); } catch { /* ignore */ } }
            }
            const results = Array.isArray(payload?.results) ? payload.results : [];
            const count = typeof payload?.count === 'number' ? payload.count : results.length;
            const topDomains = results.slice(0, 5).map((r: any) => r.domain || (r.url ? extractDomain(r.url) : '')).filter(Boolean);
            searchSummaries.push(`- Query: "${query}" -> ${count} result(s). Top domains: ${topDomains.join(', ') || 'none'}`);
            addLog(`🔎 Search summary: "${query}" -> ${count} result(s)`);
          }
          if (searchSummaries.length > 0) {
            messages.push({
              role: 'user',
              content: `Search results received and summarized for the agent:\n${searchSummaries.join('\n')}`
            });
          }
        } catch (e) {
          addLog(`⚠️ Failed to echo search results to conversation: ${(e as Error).message}`);
        }

        await flushLogsToDb(false);
        // Progress stall detection
        if (companiesSaved === prevCompaniesSaved && contactsSaved === prevContactsSaved) {
          noProgressStreak++;
        } else {
          noProgressStreak = 0;
          prevCompaniesSaved = companiesSaved;
          prevContactsSaved = contactsSaved;
        }
        if (noProgressStreak >= STALL_THRESHOLD) {
          addLog(`No progress for ${STALL_THRESHOLD} consecutive iterations. Refining search strategy and continuing.`);
          messages.push({
            role: 'user',
            content: 'No progress detected. Refine search now: diversify queries (synonyms, broader/narrower), broaden geos, include directories (LinkedIn, Crunchbase, ProductHunt), and prioritize /about, /team, /contact pages before continuing.'
          });
          noProgressStreak = 0;
        }
      } else if (text) {
        // Agent is thinking/reasoning (text response without tools)
        // Add assistant message to history
        messages.push({
          role: "assistant",
          content: text,
        });

        console.log("Agent reasoning:", text);
        addLog(`💭 Agent thinking: ${text}`);

        // Check if agent thinks it's complete
        if (text.toLowerCase().includes("complete") ||
          text.toLowerCase().includes("finished") ||
          companiesSaved >= maxCompanies) {
          addLog("✅ Agent believes task is complete");
          await flushLogsToDb(true); // Force flush
          break;
        }

        // Add a user message to keep it going with more direct instructions
        if (companiesSaved < maxCompanies) {
          const feedbackMsg = `Progress: ${companiesSaved}/${maxCompanies} companies saved (${contactsSaved} contacts).

${companiesSaved === 0 ? '⚠️ You haven\'t saved ANY companies yet!\n\n' : ''}IMMEDIATE NEXT STEP:
1. Look at the website data you've extracted
2. For EACH website with emails, call save_company RIGHT NOW
3. Format: { domain, companyName, description, industry, techStack: [], contacts: [{name: "", title: "Contact", email: "...", phone: "..."}] }

Don't keep searching - SAVE the companies you've already found!`;

          messages.push({
            role: "user",
            content: feedbackMsg
          });
          addLog(`📍 Checkpoint: ${companiesSaved}/${maxCompanies} companies | Directing agent to save...`);
          await flushLogsToDb(false); // Opportunistic flush
          // Progress stall detection
          if (companiesSaved === prevCompaniesSaved && contactsSaved === prevContactsSaved) {
            noProgressStreak++;
          } else {
            noProgressStreak = 0;
            prevCompaniesSaved = companiesSaved;
            prevContactsSaved = contactsSaved;
          }
          if (noProgressStreak >= STALL_THRESHOLD) {
            addLog(`No progress for ${STALL_THRESHOLD} consecutive iterations. Refining search strategy and continuing.`);
            messages.push({
              role: 'user',
              content: 'No progress detected. Refine search now: diversify queries (synonyms, broader/narrower), broaden geos, include directories (LinkedIn, Crunchbase, ProductHunt), and prioritize /about, /team, /contact pages before continuing.'
            });
            noProgressStreak = 0;
          }
        }
      }

      // Safety: Add delay between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error("Agent iteration error:", error);
      addLog(`Agent error: ${(error as Error).message}`, "ERROR");
      await flushLogsToDb(true); // Force flush errors
      break;
    }
  }

  // Log completion
  addLog(`🤖 Agent complete: ${companiesSaved} companies, ${contactsSaved} contacts in ${iterations} iterations`);
  await flushLogsToDb(true); // Force final flush
  // Mark job as completed in DB
  try {
    await db.crm_Lead_Gen_Jobs.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        counters: {
          companiesSaved,
          contactsSaved,
          iterations,
          progress: 100
        }
      }
    });
  } catch { }

  return {
    companiesSaved,
    contactsSaved,
    iterations
  };
}
