"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export const deleteTeam = async (teamId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        // Global admins (platform super admins) can delete any team
        // Team owners can delete their own team
        const isGlobalAdmin = currentUser.isGlobalAdmin;
        const isTeamOwner = currentUser.teamId === teamId && currentUser.teamRole === "OWNER";
        if (!isGlobalAdmin && !isTeamOwner) {
            return { error: "Unauthorized: You do not have permission to delete this company." };
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
        revalidatePath("/platform");

        return { success: true };
    } catch (error) {
        systemLogger.error("[DELETE_TEAM]", error);
        return { error: "Failed to delete team" };
    }
};
