import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { logActivityInternal } from "@/actions/audit";

/**
 * SOC2 & NIST Compliance: Centralized API Authorization
 */

export async function getSessionAndTeam() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { error: new NextResponse("Unauthenticated", { status: 401 }), session: null, teamInfo: null };
    }

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isPlatformAdmin) {
        return { error: new NextResponse("Forbidden: No team assigned", { status: 403 }), session, teamInfo: null };
    }

    return { error: null, session, teamInfo };
}

/**
 * Validates if the current user/team owns the specific resource.
 * Essential for preventing IDOR (Insecure Direct Object Reference) vulnerabilities.
 */
export function validateResourceOwnership(teamId: string | null, resourceTeamId: string | null, isGlobalAdmin: boolean = false) {
    if (isGlobalAdmin) return true;
    if (!teamId || !resourceTeamId) return false;
    return teamId === resourceTeamId;
}

export async function unauthorizedResponse(action: string, resource: string, details?: any) {
    // Optional: Log unauthorized attempt for audit purposes
    console.warn(`[UNAUTHORIZED_ACCESS_ATTEMPT] Action: ${action}, Resource: ${resource}`);
    return new NextResponse("Unauthorized", { status: 403 });
}
