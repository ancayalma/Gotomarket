/**
 * LightPanda-backed headless browser for scraping workloads.
 *
 * Drop-in replacement for `lib/browser.ts` — exports the same
 * { launchBrowser, newPageWithDefaults, closeBrowser } surface
 * but connects puppeteer-core to a LightPanda CDP server instead
 * of launching a full Chromium process.
 *
 * Kill switches:
 *   - SCRAPER_BROWSER=chromium  → falls back to Chromium (lib/browser.ts)
 *   - Windows host              → auto-falls back (LightPanda has no Win binary)
 *
 * LightPanda supports one CDP connection per process, so each
 * launchBrowser() call starts a fresh LightPanda process (~50ms cold start).
 */

import type { Browser, Page } from "puppeteer-core";

/* ── Decide engine at module load time ──────────────────────────── */
const FORCE_CHROMIUM =
  process.env.SCRAPER_BROWSER?.toLowerCase() === "chromium" ||
  process.platform === "win32";

/* ── Chromium passthrough (kill switch / Windows) ───────────────── */
if (FORCE_CHROMIUM) {
  console.log("[scraper-browser] Using Chromium fallback (SCRAPER_BROWSER or Windows)");
}

// Dynamic port allocation to avoid collisions when multiple scrapers run concurrently
let _portCounter = Number(process.env.LIGHTPANDA_PORT || 9222);
function nextPort(): number {
  return _portCounter++;
}

/* ── LightPanda lifecycle ───────────────────────────────────────── */

type LightPandaHandle = {
  browser: Browser;
  process: any; // ChildProcess from @lightpanda/browser
  port: number;
};

const activeSessions = new Map<Browser, LightPandaHandle>();

async function launchLightPanda(): Promise<Browser> {
  const { lightpanda } = await import("@lightpanda/browser");
  const puppeteer = (await import("puppeteer-core")).default;

  const port = nextPort();
  const host = "127.0.0.1";

  // Start LightPanda CDP server
  const proc = await lightpanda.serve({ host, port });
  console.log(`[scraper-browser] LightPanda started on ${host}:${port}`);

  // Brief delay for the server socket to bind
  await new Promise((r) => setTimeout(r, 200));

  // Connect puppeteer-core over CDP WebSocket
  const browser = await puppeteer.connect({
    browserWSEndpoint: `ws://${host}:${port}`,
  });

  activeSessions.set(browser, { browser, process: proc, port });
  return browser;
}

async function closeLightPanda(browser: Browser | null | undefined) {
  if (!browser) return;
  const handle = activeSessions.get(browser);
  if (handle) {
    try {
      browser.disconnect();
    } catch {
      // already disconnected
    }
    try {
      handle.process.kill();
    } catch {
      // already dead
    }
    activeSessions.delete(browser);
  } else {
    // Fallback: try normal close
    try {
      await browser.close();
    } catch {
      // noop
    }
  }
}

/* ── Exported API (mirrors lib/browser.ts exactly) ──────────────── */

export async function launchBrowser(): Promise<Browser> {
  if (FORCE_CHROMIUM) {
    const chromium = await import("@/lib/browser");
    return chromium.launchBrowser();
  }

  try {
    return await launchLightPanda();
  } catch (err) {
    // If LightPanda fails (binary missing, unsupported OS, etc.), fall back to Chromium
    console.warn("[scraper-browser] LightPanda failed, falling back to Chromium:", (err as Error).message);
    const chromium = await import("@/lib/browser");
    return chromium.launchBrowser();
  }
}

/**
 * Opens a new page with sane defaults (same as lib/browser.ts):
 * - Desktop user-agent
 * - Accept-Language header
 * - Timeouts
 */
export async function newPageWithDefaults(browser: Browser): Promise<Page> {
  // If this browser came from the Chromium fallback, delegate to the original helper
  if (FORCE_CHROMIUM || !activeSessions.has(browser)) {
    const chromium = await import("@/lib/browser");
    return chromium.newPageWithDefaults(browser);
  }

  // LightPanda path: create context + page per their docs
  let page: Page;
  try {
    const context = await browser.createBrowserContext();
    page = await context.newPage();
  } catch {
    // Some LightPanda versions may not support createBrowserContext
    page = await browser.newPage();
  }

  const userAgent = process.env.SCRAPER_USER_AGENT;
  const acceptLanguage = process.env.SCRAPER_LANG || "en-US,en;q=0.9";

  if (userAgent) {
    await page.setUserAgent(userAgent);
  }
  
  await page.setExtraHTTPHeaders({
    "Accept-Language": acceptLanguage,
    "Upgrade-Insecure-Requests": "1"
  });
  // Reasonable defaults
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(45000);

  return page;
}

/**
 * Safe browser close helper
 */
export async function closeBrowser(browser: Browser | null | undefined) {
  if (!browser) return;

  if (FORCE_CHROMIUM || !activeSessions.has(browser)) {
    const chromium = await import("@/lib/browser");
    return chromium.closeBrowser(browser);
  }

  await closeLightPanda(browser);
}
