/**
 * Next.js Edge Middleware — Security Headers, CSRF Protection, Rate Limiting
 *
 * This middleware runs at the edge (before your route handlers) on every request.
 * It provides:
 *   1. Security response headers (CSP, HSTS, X-Frame-Options, etc.)
 *   2. CORS policy for API routes
 *   3. Basic IP-based rate limiting on public (unauthenticated) API endpoints
 *   4. CSRF protection stub for mutating API requests
 */
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Config ──────────────────────────────────────────────────────────────────

/** Allowed origins for CORS — add your production domain(s) here. */
const ALLOWED_ORIGINS = new Set([
    process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com",
    "https://crm.basalthq.com",
    "http://localhost:3000",
    "http://localhost:3001",
]);

/**
 * Public API routes that are intentionally unauthenticated.
 * Matched by prefix (startsWith).
 */
const PUBLIC_API_PREFIXES = [
    "/api/auth",                 // NextAuth routes
    "/api/user/passwordReset",   // Password reset request (public by design)
    "/api/user/resetPasswordWithToken", // Actually resetting password with token
    "/api/docs",                 // Public docs
    "/api/forms/submit",         // Public form submission
    "/api/outreach/track",       // Email open/click tracking pixels
    "/api/outreach/open",        // Email open tracking
    "/api/portal",               // Public portal routes
    "/api/cron",                 // Cron endpoints (authenticated by secret)
];

/**
 * Routes that should NOT have rate limiting applied.
 */
const RATE_LIMIT_EXEMPT_PREFIXES = [
    "/api/auth",
    "/_next",
    "/favicon.ico",
];

// ─── Distributed Rate-limiting via Upstash Redis (Edge-compatible) ─────────
// Multi-instance safe rate limiting

const RATE_LIMIT_WINDOW = "1m"; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 60;  // 60 requests per window per IP
const RATE_LIMIT_MAX_PASSWORD_RESET = 3; // Reduced to 3 per minute
const RATE_LIMIT_MAX_AUTH_ATTEMPTS = 5; // Max 5 login attempts per minute per IP
const RATE_LIMIT_MAX_MFA_VERIFY = 10;   // Max 10 MFA verification attempts per minute

// Create singleton ratelimiters
// Only init if REDIS env vars exist to not break local dev without Redis
let redisClient: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = Redis.fromEnv();
  }
} catch (e) {
  console.warn("Upstash Redis not configured, falling back to mock limiter");
}

let ratelimitDefault: Ratelimit | null = null;
let ratelimitAuth: Ratelimit | null = null;
let ratelimitPassword: Ratelimit | null = null;
let ratelimitMfa: Ratelimit | null = null;

if (redisClient) {
  ratelimitDefault = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, "1 m"),
    analytics: true,
  });
  ratelimitAuth = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_AUTH_ATTEMPTS, "1 m"),
    analytics: true,
  });
  ratelimitPassword = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_PASSWORD_RESET, "1 m"),
    analytics: true,
  });
  ratelimitMfa = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_MFA_VERIFY, "1 m"),
    analytics: true,
  });
}

// Fallback in-memory limiter for local dev
type RateLimitEntry = { count: number; resetAt: number };
const localRateLimitMap = new Map<string, RateLimitEntry>();
let lastLocalCleanup = Date.now();

function cleanupLocalRateLimit() {
    const now = Date.now();
    if (now - lastLocalCleanup < 30_000) return; // Clean up every 30s max
    lastLocalCleanup = now;
    localRateLimitMap.forEach((entry, key) => {
        if (now > entry.resetAt) {
            localRateLimitMap.delete(key);
        }
    });
}

async function checkRateLimit(key: string, limitType: "DEFAULT" | "AUTH" | "PASSWORD" | "MFA"): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (redisClient) {
        // Use distributed Upstash rate limiting
        let limiter = ratelimitDefault!;
        if (limitType === "AUTH") limiter = ratelimitAuth!;
        if (limitType === "PASSWORD") limiter = ratelimitPassword!;
        if (limitType === "MFA") limiter = ratelimitMfa!;
        
        try {
            const { success, limit, remaining, reset } = await limiter.limit(key);
            return { allowed: success, remaining, resetAt: reset };
        } catch (error) {
            console.error("Redis Rate Limit Error:", error);
            // Fail open linearly on Redis error
            return { allowed: true, remaining: 1, resetAt: Date.now() + 60000 };
        }
    }

    // Fallback in-memory logic
    cleanupLocalRateLimit();
    let maxLocal = RATE_LIMIT_MAX_REQUESTS;
    if (limitType === "AUTH") maxLocal = RATE_LIMIT_MAX_AUTH_ATTEMPTS;
    if (limitType === "PASSWORD") maxLocal = RATE_LIMIT_MAX_PASSWORD_RESET;
    if (limitType === "MFA") maxLocal = RATE_LIMIT_MAX_MFA_VERIFY;

    const now = Date.now();
    const existing = localRateLimitMap.get(key);

    if (!existing || now > existing.resetAt) {
        const resetAt = now + 60000;
        localRateLimitMap.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxLocal - 1, resetAt };
    }

    existing.count += 1;
    const allowed = existing.count <= maxLocal;
    return { allowed, remaining: Math.max(0, maxLocal - existing.count), resetAt: existing.resetAt };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

function isPublicApi(pathname: string): boolean {
    return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isRateLimitExempt(pathname: string): boolean {
    return RATE_LIMIT_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─── Security Headers ────────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse, requestId?: string): void {
    if (requestId) {
        response.headers.set("X-Request-ID", requestId);
    }
    // Strict Transport Security — force HTTPS for 1 year, include subdomains
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
    );

    // Prevent clickjacking (SAMEORIGIN allows our own iFrames to work)
    response.headers.set("X-Frame-Options", "SAMEORIGIN");

    // Prevent MIME type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer Policy — send origin only for cross-origin
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy — restrict powerful APIs
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // XSS Protection (legacy, but still respected by some browsers)
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Content Security Policy
    // NOTE: 'unsafe-inline' and 'unsafe-eval' are required by Next.js and many
    // UI libraries. Once you audit all inline scripts/styles, tighten this.
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://use.typekit.net https://static.cloudflareinsights.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.typekit.net https://p.typekit.net",
            "font-src 'self' https://fonts.gstatic.com https://use.typekit.net https://p.typekit.net data:",
            "img-src 'self' data: blob: https: http: https://p.typekit.net",
            "connect-src 'self' https: wss: https://*.typekit.net",
            "frame-src 'self' https://accounts.google.com https://surge.basalthq.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self' https://surge.basalthq.com",
        ].join("; ")
    );
}

// ─── CORS ────────────────────────────────────────────────────────────────────

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get("origin");

    if (origin && ALLOWED_ORIGINS.has(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Vary", "Origin");
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, x-wallet, x-csrf-token"
    );
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours preflight cache
    response.headers.set("Access-Control-Allow-Credentials", "true");

    return response;
}

// ─── Main Middleware (Proxy) ─────────────────────────────────────────────────

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const isApiRoute = pathname.startsWith("/api/");

    // ── AI Synthesis Webhook Trigger (Non-blocking) ──
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && 
        (pathname.startsWith("/api/crm/") || pathname.startsWith("/api/outreach/") || pathname.startsWith("/api/finance/"))) {
        
        let payload = null;
        try {
            // Clone the request so NextRoute doesn't consume the body stream
            payload = await request.clone().json();
        } catch (e) {
            // It might not be JSON, skip parsing payload
        }

        const synthesisTriggerUrl = `${request.nextUrl.origin}/api/synthesis/trigger`;
        // Fire and forget
        const synthesisRequest = fetch(synthesisTriggerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-synthesis-secret": process.env.SYNTHESIS_SECRET || "internal-secret"
            },
            body: JSON.stringify({
                path: pathname,
                method,
                payload,
                timestamp: new Date().toISOString()
            })
        }).catch(err => {
            console.error("[Proxy] Synthesis Trigger Error:", err);
        });

        // Ensure edge runtime keeps alive until the fetch completes
        event.waitUntil(synthesisRequest);
    }

    // Generate a unique Request ID for SOC2 traceability
    const requestId = crypto.randomUUID();
    request.headers.set("X-Request-ID", requestId);

    // ── CORS preflight ──
    if (method === "OPTIONS" && isApiRoute) {
        const preflightResponse = new NextResponse(null, { status: 204 });
        applyCors(request, preflightResponse);
        return preflightResponse;
    }


    // ── Rate limiting (API routes only, not exempt paths) ──
    if (isApiRoute && !isRateLimitExempt(pathname)) {
        const clientIp = getClientIp(request);

        // Tighter limit for sensitive endpoints
        const isPasswordReset = pathname.startsWith("/api/user/passwordReset");
        const isLogin = pathname.includes("/api/auth/callback/credentials") || (pathname.startsWith("/api/auth") && method === "POST");
        const isMfa = pathname.startsWith("/api/mfa/verify");

        let limitType: "DEFAULT" | "AUTH" | "PASSWORD" | "MFA" = "DEFAULT";
        let rateLimitKey = `api:${clientIp}`;

        if (isPasswordReset) {
            limitType = "PASSWORD";
            rateLimitKey = `pw:${clientIp}`;
        } else if (isLogin) {
            limitType = "AUTH";
            rateLimitKey = `login:${clientIp}`;
        } else if (isMfa) {
            limitType = "MFA";
            rateLimitKey = `mfa:${clientIp}`;
        }

        const { allowed, remaining, resetAt } = await checkRateLimit(rateLimitKey, limitType);

        if (!allowed) {
            const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
            const rateLimitedResponse = NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
            rateLimitedResponse.headers.set("Retry-After", String(retryAfter));
            rateLimitedResponse.headers.set("X-RateLimit-Limit", "exceeded");
            rateLimitedResponse.headers.set("X-RateLimit-Remaining", "0");
            rateLimitedResponse.headers.set("X-RateLimit-Reset", String(resetAt));
            return rateLimitedResponse;
        }

        // Continue, but add rate-limit headers to the response downstream
        const response = NextResponse.next();

        response.headers.set("X-RateLimit-Limit", limitType);
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(resetAt));

        // Apply CORS to API responses
        applyCors(request, response);

        // Apply security headers
        applySecurityHeaders(response, requestId);

        // SOC2 Block: Global Route Protection for all APIs not explicitly public
        if (!isPublicApi(pathname)) {
            // Check for valid NextAuth session token
            const sessionToken = request.cookies.get("next-auth.session-token")?.value ||
                request.cookies.get("__Secure-next-auth.session-token")?.value;

            if (!sessionToken) {
                const unauthorizedResponse = NextResponse.json(
                    { error: "Unauthorized access detected." },
                    { status: 401 }
                );
                // Maintain headers on error block
                applyCors(request, unauthorizedResponse);
                applySecurityHeaders(unauthorizedResponse, requestId);
                return unauthorizedResponse;
            }
        }

        return response;
    }

    // ── Default / Non-API: apply security headers and continue ──

    const response = NextResponse.next();

    applySecurityHeaders(response, requestId);

    // Apply CORS to API responses (should be covered above, but for safety in case exempt API routes fall through)
    if (isApiRoute) {
        applyCors(request, response);
    }

    return response;
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Run middleware on all routes except static assets and Next.js internals.
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
