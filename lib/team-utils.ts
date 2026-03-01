import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyImpersonatedTeamId } from "@/lib/cookie-utils";

/**
 * React.cache() ensures this only runs ONCE per server request,
 * even when called from 12+ dashboard server actions in parallel.
 * Without this, each action independently calls getServerSession + prismadb.users.findUnique,
 * resulting in ~24 redundant DB/auth calls per dashboard load.
 */
export const getCurrentUserTeamId = cache(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    const user = await (prismadb.users as any).findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            team_id: true,
            is_admin: true,
            team_role: true,
            assigned_team: {
                select: { slug: true }
            }
        }
    });

    const normalizedRole = (user?.team_role || '').trim().toUpperCase();
    const isPlatformAdminRole = normalizedRole === "PLATFORM_ADMIN" || normalizedRole === "PLATFORM ADMIN";

    // PLATFORM_ADMIN gets global access ONLY if they are impersonating a team
    // Otherwise, they should be restricted to their assigned team data (if any)
    const isGlobalAdmin = isPlatformAdminRole;

    // Check for impersonation cookie
    let effectiveTeamId = user?.team_id;
    let isImpersonating = false;

    if (isGlobalAdmin) {
        try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            if (cookieStore) {
                const impersonatedToken = cookieStore.get("impersonated_team_id")?.value;
                if (impersonatedToken) {
                    const verifiedId = await verifyImpersonatedTeamId(impersonatedToken);
                    if (verifiedId) {
                        effectiveTeamId = verifiedId;
                        isImpersonating = true;
                    } else {
                        // If signature verify fails, delete the cookie silently
                        try {
                            cookieStore.delete("impersonated_team_id");
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        } catch (e) {
            // next/headers might not be available in non-request contexts
        }
    }

    return {
        teamId: effectiveTeamId || null,
        isGlobalAdmin: isPlatformAdminRole, // Sysadm: This is now TRUE because you HAVE the role
        isPlatformAdmin: isPlatformAdminRole,
        isImpersonating: isImpersonating, // Tracks if you are actively targeting a specific team
        teamRole: user?.team_role,
        isAdmin: user?.is_admin || user?.team_role === "ADMIN" || user?.team_role === "OWNER" || isPlatformAdminRole,
        userId: user?.id || (session.user as any).id
    };
});
