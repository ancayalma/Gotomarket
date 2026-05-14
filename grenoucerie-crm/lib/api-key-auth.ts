import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface ApiKeyAuth {
    tenantId: string;
    apiKeyId: string;
}

/**
 * Authenticate an incoming API request via `Authorization: Bearer sk_live_...`
 * 
 * Flow:
 * 1. Extract the bearer token from the Authorization header
 * 2. Derive the key_prefix (first 12 chars) and look up ACTIVE keys
 * 3. bcrypt.compare() the full key against each candidate's key_hash
 * 4. On match → update last_used, log to crm_ApiLogs, return { tenantId, apiKeyId }
 * 5. On failure → log the attempt, return null
 */
export async function authenticateApiKey(
    req: NextRequest | Request
): Promise<ApiKeyAuth | null> {
    const authHeader = (req.headers as any).get
        ? (req.headers as any).get("authorization")
        : (req.headers as any)["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        await logApiRequest(req, null, null, 401);
        return null;
    }

    const rawKey = authHeader.slice(7).trim(); // Remove "Bearer "

    if (!rawKey.startsWith("sk_live_")) {
        await logApiRequest(req, null, null, 401);
        return null;
    }

    const keyPrefix = rawKey.substring(0, 12); // e.g. "sk_live_abcd"

    try {
        // Find all ACTIVE keys whose prefix matches
        const candidates = await prismadb.crm_ApiKeys.findMany({
            where: {
                key_prefix: keyPrefix,
                status: "ACTIVE",
            },
            select: {
                id: true,
                tenant_id: true,
                key_hash: true,
            },
        });

        if (candidates.length === 0) {
            await logApiRequest(req, null, null, 401);
            return null;
        }

        // bcrypt compare against each candidate (usually only 1)
        for (const candidate of candidates) {
            const isValid = await bcrypt.compare(rawKey, candidate.key_hash);
            if (isValid) {
                // Update last_used timestamp (fire-and-forget)
                prismadb.crm_ApiKeys.update({
                    where: { id: candidate.id },
                    data: { last_used: new Date() },
                }).catch(() => { /* non-critical */ });

                await logApiRequest(req, candidate.tenant_id, candidate.id, 200);

                return {
                    tenantId: candidate.tenant_id,
                    apiKeyId: candidate.id,
                };
            }
        }

        // No match found
        await logApiRequest(req, null, null, 401);
        return null;
    } catch (error) {
        console.error("[API_KEY_AUTH] Error during authentication:", error);
        return null;
    }
}

/**
 * Log every API request to crm_ApiLogs for audit trail.
 */
async function logApiRequest(
    req: NextRequest | Request,
    tenantId: string | null,
    apiKeyId: string | null,
    statusCode: number
) {
    try {
        const url = new URL(req.url);
        const forwarded = (req.headers as any).get?.("x-forwarded-for");
        const userAgent = (req.headers as any).get?.("user-agent");

        await prismadb.crm_ApiLogs.create({
            data: {
                tenant_id: tenantId || "unknown",
                api_key_id: apiKeyId || undefined,
                endpoint: url.pathname,
                method: req.method || "UNKNOWN",
                status_code: statusCode,
                ip_address: forwarded || undefined,
                user_agent: userAgent || undefined,
            },
        });
    } catch (err) {
        // Non-critical — don't block the request
        console.error("[API_LOG] Failed to write audit log:", err);
    }
}

/**
 * Helper: Extract auth and return a 401 response or the auth object.
 */
export async function requireApiKey(req: NextRequest | Request) {
    const auth = await authenticateApiKey(req);
    if (!auth) {
        return {
            auth: null, error: Response.json(
                { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key. Provide a valid Bearer token in the Authorization header." } },
                { status: 401 }
            )
        };
    }
    return { auth, error: null };
}
