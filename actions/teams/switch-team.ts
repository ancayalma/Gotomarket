"use server";

import { cookies } from "next/headers";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";

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

            cookieStore.set("impersonated_team_id", teamId, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 // 24 hours
            });

            return { success: true, message: `Switched to ${team.name}` };
        } else {
            // Clear impersonation
            cookieStore.delete("impersonated_team_id");
            return { success: true, message: "Returned to home team" };
        }
    } catch (error) {
        console.error("[SWITCH_TEAM]", error);
        return { error: "Failed to switch team" };
    }
}
