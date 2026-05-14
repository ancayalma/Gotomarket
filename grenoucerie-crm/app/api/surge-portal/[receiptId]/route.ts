import { NextRequest } from "next/server";
import axios from "axios";
import https from "https";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { systemLogger } from "@/lib/logger";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ receiptId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response("Unauthorized Access", { status: 401 });
        }

        const { receiptId } = await context.params;
        const searchParams = request.nextUrl.searchParams;

        const paths = ['/portal/', '/p/', '/pay/', '/widget/'];
        let response = null;
        let successfulPath = '';

        for (const path of paths) {
            const surgeUrl = new URL(`https://surge.basalthq.com${path}${receiptId}`);
            searchParams.forEach((value, key) => {
                surgeUrl.searchParams.append(key, value);
            });

            systemLogger.error(`[SurgeProxy] Trying path ${path}: ${surgeUrl.toString()}`);

            const agent = new https.Agent({ rejectUnauthorized: false });

            try {
                const res = await axios.get(surgeUrl.toString(), {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    },
                    httpsAgent: agent,
                    responseType: 'text',
                    timeout: 5000,
                    validateStatus: (status) => status === 200,
                });

                response = res;
                successfulPath = path;
                systemLogger.error(`[SurgeProxy] Success with path: ${path}`);
                break;
            } catch (err) {
                console.warn(`[SurgeProxy] Path ${path} failed or timed out`);
                continue;
            }
        }

        if (!response) {
            systemLogger.error(`[SurgeProxy] All paths failed for receipt ${receiptId}`);
            return new Response(`[BasaltSRM] Surge Handshake Error: All portal paths returned 404 or timed out.`, { status: 404 });
        }

        let html = response.data;

        // Inject Base Tag and helper script immediately at the start of <head>
        const injection = `
            <base href="https://surge.basalthq.com/">
            <script>
                // Intercept any relative clicks/fetches to keep them on Surge
                window.__PROXIED__ = true;
                systemLogger.error("[BasaltSRM] Payment Layer Initialized via Proxy");
            </script>
            <style>
                /* Ensure Surge content takes up full height and isn't hidden by overflow */
                html, body { height: 100% !important; background: #000 !important; color: #fff !important; }
            </style>
        `;

        if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>${injection}`);
        } else {
            html = `<head>${injection}</head>${html}`;
        }

        // CRAFTED RESPONSE: Strip all restrictive headers from Surge
        return new Response(html, {
            headers: {
                "Content-Type": "text/html",
                "X-Frame-Options": "ALLOWALL",
                "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors *; img-src * data: blob:; font-src * data:;",
                "X-Proxy-Handshake": "verified",
                "Cache-Control": "no-store, must-revalidate",
            }
        });

    } catch (error: any) {
        systemLogger.error("[SurgeProxy] Critical Failure:", error);
        return new Response(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
