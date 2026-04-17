import puppeteerCore, { Browser, Page } from "puppeteer-core";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const stealthCore = addExtra(puppeteerCore);
stealthCore.use(StealthPlugin());
import { existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

/**
 * Headless Chromium launcher compatible with local dev, Linux Plesk, and serverless.
 *
 * Fallback order:
 *   1. CHROME_PATH env var (explicit override)
 *   2. Well-known Linux Chrome/Chromium paths (for Plesk / bare-metal Linux)
 *   3. @puppeteer/browsers cache (downloaded by postinstall script)
 *   4. Full puppeteer (bundled Chromium – local dev / CI)
 *   5. @sparticuz/chromium (AWS Lambda / serverless only – dynamic import)
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
  const candidates =
    process.platform === "win32" ? WIN_CANDIDATES : LINUX_CANDIDATES;
  for (const p of candidates) {
    try {
      if (existsSync(p)) return p;
    } catch {
      // permission denied – keep scanning
    }
  }
  return null;
}

/**
 * Scan the @puppeteer/browsers cache for a downloaded Chrome executable.
 * The `npx @puppeteer/browsers install chrome@stable` postinstall script
 * downloads Chrome into a `chrome/` directory relative to the project root.
 * Structure: chrome/linux-<buildId>/chrome-linux64/chrome (Linux)
 *        or: chrome/win64-<buildId>/chrome-win64/chrome.exe (Windows)
 */
function detectCachedBrowser(): string | null {
  // Search multiple potential cache locations
  const projectRoot = resolve(__dirname, "..");
  const cacheRoots = [
    join(projectRoot, "chrome"),           // default: <project>/chrome/
    join(projectRoot, ".cache", "puppeteer"), // older puppeteer cache location
  ];

  const chromeBinaryNames =
    process.platform === "win32" ? ["chrome.exe"] : ["chrome", "chromium"];

  for (const cacheRoot of cacheRoots) {
    try {
      if (!existsSync(cacheRoot) || !statSync(cacheRoot).isDirectory()) continue;
      // Walk max 4 levels deep to find the chrome binary
      const found = findFileRecursive(cacheRoot, chromeBinaryNames, 4);
      if (found) return found;
    } catch {
      // skip
    }
  }
  return null;
}

/** Simple recursive file finder limited by depth */
function findFileRecursive(
  dir: string,
  names: string[],
  maxDepth: number
): string | null {
  if (maxDepth <= 0) return null;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile() && names.includes(entry.name)) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, names, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch {
    // skip – permission error, etc.
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

  /* ── 3. @puppeteer/browsers cache (postinstall download) ────────── */
  if (!executablePath) {
    executablePath = detectCachedBrowser();
    if (executablePath) {
      console.log(`[browser] Found cached Chrome: ${executablePath}`);
    }
  }

  /* ── 4. Full puppeteer (bundled Chromium – local dev) ──────────── */
  if (!executablePath) {
    try {
      const puppeteer = (await import("puppeteer")).default;
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

  /* ── 5. @sparticuz/chromium (serverless only) ─────────────────── */
  if (!executablePath && process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const chromium = (await import("@sparticuz/chromium")).default;
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

  const userAgent =
    process.env.SCRAPER_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
  const acceptLanguage = process.env.SCRAPER_LANG || "en-US,en;q=0.9";

  await page.setUserAgent(userAgent);
  await page.setExtraHTTPHeaders({
    "Accept-Language": acceptLanguage,
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
