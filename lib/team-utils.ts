
import { cache } from "react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

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
        const cookieStore = await cookies();
        const impersonatedId = cookieStore.get("impersonated_team_id")?.value;
        if (impersonatedId) {
            effectiveTeamId = impersonatedId;
            isImpersonating = true;
        }
    }

    return {
        teamId: effectiveTeamId || null,
        isGlobalAdmin: isImpersonating, // Only true if ACTIVE global mode
        isPlatformAdmin: isPlatformAdminRole,
        isImpersonating: isImpersonating,
        teamRole: user?.team_role,
        isAdmin: user?.is_admin || user?.team_role === "ADMIN" || user?.team_role === "OWNER" || isPlatformAdminRole,
        userId: user?.id || (session.user as any).id
    };
});
