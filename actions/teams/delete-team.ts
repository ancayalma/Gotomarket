"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export const deleteTeam = async (teamId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        // Only Global Admins or Team Owners (specifically looking at business rules) should delete
        if (!currentUser.isGlobalAdmin && (currentUser.teamId !== teamId || currentUser.teamRole !== "OWNER")) {
            return { error: "Unauthorized: You do not have permission to delete this team." };
        }

        // 1. Dissociate members first (Optional if Cascade/SetNull is handled by DB, but safe to do explicit)
        await prismadb.users.updateMany({
            where: { team_id: teamId },
            data: {
                team_id: null,
                team_role: "MEMBER"
            }
        });

        // 2. Delete the team
        await prismadb.team.delete({
            where: {
                id: teamId,
            },
        });

        // 3. Revalidate
        revalidatePath("/partners");

        return { success: true };
    } catch (error) {
        systemLogger.error("[DELETE_TEAM]", error);
        return { error: "Failed to delete team" };
    }
};
