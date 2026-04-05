"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";

export async function deleteQuest(questId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId || !teamInfo?.userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Only admins or the creator should delete quests
        const role = teamInfo.teamRole as string;
        if (!["SUPER_ADMIN", "OWNER", "ADMIN", "PLATFORM_ADMIN"].includes(role)) {
            return { success: false, error: "INSUFFICIENT_PERMISSIONS" };
        }

        const { ObjectId } = require("mongodb");
        const questCollection = await dbAdapter.getNativeCollection("Quest");
        const progressCollection = await dbAdapter.getNativeCollection("QuestProgress");

        // Validate quest exists and belongs to the team
        const questResult = await questCollection.deleteOne({
            _id: new ObjectId(questId),
            team_id: new ObjectId(teamInfo.teamId),
        });

        if (questResult.deletedCount === 0) {
            return { success: false, error: "Quest not found or unauthorized." };
        }

        // Cleanup associated progress
        await progressCollection.deleteMany({
            quest_id: new ObjectId(questId),
        });

        return { success: true };
    } catch (error) {
        console.error("[DELETE_QUEST]", error);
        return { success: false, error: "Failed to delete quest." };
    }
}
