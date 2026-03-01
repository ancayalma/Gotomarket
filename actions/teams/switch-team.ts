"use server";

import { cookies } from "next/headers";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";
import { signImpersonatedTeamId } from "@/lib/cookie-utils";
import { logActivityInternal } from "@/actions/audit";

export async function switchTeam(teamId: string | null) {
    try {
        const currentUser = await getCurrentUserTeamId();

        if (!currentUser?.isGlobalAdmin) {
            return { error: "Unauthorized: Only Platform Admins can switch teams." };
        }

        const cookieStore = await cookies();

        if (teamId) {
            // Verify team exists
            const team = await prismadb.team.findUnique({
                where: { id: teamId },
                select: { id: true, name: true }
            });

            if (!team) {
                return { error: "Team not found" };
            }

            // Generate cryptographically signed JWT for the impersonation cookie ID
            const signedToken = await signImpersonatedTeamId(teamId);

            cookieStore.set("impersonated_team_id", signedToken, {
                path: "/",
                httpOnly: true, // SOC2: Javascript CANNOT read this
                secure: process.env.NODE_ENV === "production", // SOC2: TLS only in prod
                sameSite: "strict", // SOC2: Strict CSRF protection for impersonation
                maxAge: 60 * 60 * 24 // 24 hours
            });
            
            // SOC2: Log this highly privileged administrative action
            if (currentUser.userId) {
                await logActivityInternal(currentUser.userId, "UPDATE", "System", `Platform Admin initiated impersonation of team ${team.name} (${teamId})`);
            }

            return { success: true, message: `Switched to ${team.name}` };
        } else {
            // Clear impersonation
            cookieStore.delete("impersonated_team_id");
            
            // SOC2: Log exit of impersonation
            if (currentUser?.userId) {
                await logActivityInternal(currentUser.userId, "UPDATE", "System", `Platform Admin exited team impersonation`);
            }

            return { success: true, message: "Returned to home team" };
        }
    } catch (error) {
        systemLogger.error("[SWITCH_TEAM]", error);
        return { error: "Failed to switch team" };
    }
}
