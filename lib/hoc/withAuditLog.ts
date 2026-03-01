import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { logActivityInternal } from "@/actions/audit";

export const METHOD_ACTION_MAP: Record<string, string> = {
    GET: "READ",
    POST: "CREATE",
    PUT: "UPDATE",
    PATCH: "UPDATE",
    DELETE: "DELETE",
};

/**
 * HOF: Wraps an API route handler to automatically log mutations.
 * Zero-boilerplate audit logging for any POST/PUT/PATCH/DELETE handler.
 */
export function withAuditLog(
    resource: string,
    handler: (req: Request, ...args: any[]) => Promise<Response>
) {
    return async (req: Request, ...args: any[]): Promise<Response> => {
        const method = req.method;
        const action = METHOD_ACTION_MAP[method] || method;

        // Run the actual handler
        const response = await handler(req, ...args);

        // Only log successful mutations (2xx responses)
        if (response.status >= 200 && response.status < 300) {
            try {
                const session = await getServerSession(authOptions);
                const userId = (session?.user as any)?.id;
                if (userId) {
                    const teamInfo = await getCurrentUserTeamId();
                    await logActivityInternal(
                        userId,
                        action,
                        resource,
                        `${action} via ${method} ${new URL(req.url).pathname}`,
                        teamInfo?.teamId || undefined
                    );
                }
            } catch {
                // Never let audit logging crash the response
            }
        }

        return response;
    };
}
