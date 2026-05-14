import puppeteerCore, { Browser, Page } from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const stealthCore = addExtra(puppeteerCore);
stealthCore.use(StealthPlugin());

/**
 * Headless Chromium launcher compatible with local dev, Linux Plesk, and serverless.
 *
 * Fallback order:
 *   1. CHROME_PATH env var (explicit override)
 *   2. Well-known Linux Chrome/Chromium paths (for Plesk / bare-metal Linux)
 *   3. Full puppeteer (bundled Chromium – local dev / CI)
 *   4. @sparticuz/chromium (AWS Lambda / serverless only – dynamic import)
 */

/* ── Well-known browser paths per platform ───────────────────────── */
const LINUX_CANDIDATES = [
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/snap/bin/chromium",
  "/usr/lib/chromium/chromium",
  "/opt/google/chrome/chrome",
];

const WIN_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function detectSystemBrowser(): string | null {
  const candidates = process.platform === "win32" ? WIN_CANDIDATES : LINUX_CANDIDATES;
  
  // Completely hidden from Turbopack AST
  let _fs: any = null;
  try {
    _fs = typeof window === "undefined" ? eval("require('fs')") : null;
  } catch {}

  for (const p of candidates) {
    try {
      if (_fs && _fs.existsSync(p)) return p;
    } catch {
      // permission denied – keep scanning
    }
  }
  return null;
}

const HEADLESS_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--single-process",
];

export async function launchBrowser(): Promise<Browser> {
  /* ── 1. Explicit env override ─────────────────────────────────── */
  let executablePath: string | null = process.env.CHROME_PATH || null;

  /* ── 2. Auto-detect system browser (Linux / Windows) ──────────── */
  if (!executablePath) {
    executablePath = detectSystemBrowser();
    if (executablePath) {
      console.log(`[browser] Auto-detected system browser: ${executablePath}`);
    }
  }

  /* ── 3. Full puppeteer (bundled Chromium – local dev) ──────────── */
  if (!executablePath) {
    try {
      // Completely hidden from Turbopack AST using Function constructor
      const puppeteerModule = await Function('return import("puppeteer")')();
      const puppeteer = puppeteerModule.default || puppeteerModule;
      
      const stealthPuppeteer = addExtra(puppeteer);
      stealthPuppeteer.use(StealthPlugin());
      console.log("[browser] Launching via bundled stealth puppeteer Chromium");
      return (await stealthPuppeteer.launch({
        headless: true,
        args: HEADLESS_ARGS,
      })) as any as Browser;
    } catch {
      // Not installed or binary missing – fall through
    }
  }

  /* ── 4. @sparticuz/chromium (serverless only) ─────────────────── */
  if (!executablePath && process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      // Completely hidden from Turbopack AST
      const sparticuzModule = await Function('return import("@sparticuz/chromium")')();
      const chromium = sparticuzModule.default || sparticuzModule;
      
      const chromiumExecPath: any = chromium.executablePath;
      if (typeof chromiumExecPath === "string") {
        executablePath = chromiumExecPath;
      } else if (typeof chromiumExecPath === "function") {
        executablePath = await chromiumExecPath();
      } else {
        executablePath = await chromiumExecPath;
      }
      if (executablePath) {
        console.log(`[browser] Using @sparticuz/chromium: ${executablePath}`);
      }
    } catch (err) {
      console.error("[browser] @sparticuz/chromium failed:", err);
    }
  }

  /* ── Bail if nothing found ────────────────────────────────────── */
  if (!executablePath) {
    const isLinux = process.platform === "linux";
    throw new Error(
      "No Chromium executable found.\n" +
        (isLinux
          ? "Install Chrome on the server:\n" +
            "  sudo apt-get install -y google-chrome-stable\n" +
            "  # or: sudo apt-get install -y chromium-browser\n"
          : "Set CHROME_PATH to your Chrome/Edge installation, e.g.:\n" +
            "  Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n" +
            "  macOS:   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome\n") +
        "Or set the CHROME_PATH environment variable."
    );
  }

  /* ── Launch puppeteer-core with discovered executable ──────────── */
  console.log(`[browser] Launching stealth puppeteer-core with: ${executablePath}`);
  const browser = await stealthCore.launch({
    headless: true,
    executablePath,
    args: HEADLESS_ARGS,
    defaultViewport: { width: 1280, height: 800 },
  });

  return browser;
}

/**
 * Opens a new page with sane defaults:
 * - Desktop user-agent (overridable via SCRAPER_USER_AGENT)
 * - Accept-Language header derived from SCRAPER_LANG or defaults to en-US
 * - Basic timeouts and navigation behaviors
 */
export async function newPageWithDefaults(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

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
  try {
    await browser.close();
  } catch {
    // noop
  }
}
