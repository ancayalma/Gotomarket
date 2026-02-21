
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export const getCurrentUserTeamId = async () => {
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

    // "God Mode" for PLATFORM_ADMIN - NO TEAM RESTRICTIONS
    // PLATFORM_ADMIN can see and access ALL data across ALL teams
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
        teamId: effectiveTeamId,
        isGlobalAdmin: isGlobalAdmin,
        isImpersonating: isImpersonating,
        teamRole: user?.team_role,
        isAdmin: user?.is_admin || user?.team_role === "ADMIN" || user?.team_role === "OWNER" || isGlobalAdmin,
        userId: user?.id || (session.user as any).id
    };
}
