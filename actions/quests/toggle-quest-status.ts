"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";

/**
 * Toggle quest status: DRAFT -> ACTIVE, ACTIVE -> COMPLETED, etc.
 * Admin-only action.
 */
export async function toggleQuestStatus(
    questId: string,
    newStatus: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
): Promise<{ success: boolean; error?: string }> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId || !teamInfo?.userId) {
            return { success: false, error: "NOT_AUTHENTICATED" };
        }

        const role = teamInfo.teamRole as string;
        if (!["SUPER_ADMIN", "OWNER", "ADMIN", "PLATFORM_ADMIN"].includes(role)) {
            return { success: false, error: "INSUFFICIENT_PERMISSIONS" };
        }

        const { ObjectId } = require("mongodb");
        const questCollection = await dbAdapter.getNativeCollection("Quest");

        const quest = await questCollection.findOne({
            _id: new ObjectId(questId),
            team_id: new ObjectId(teamInfo.teamId),
        });

        if (!quest) return { success: false, error: "QUEST_NOT_FOUND" };

        // Only the creator or SUPER_ADMIN can toggle
        if (quest.created_by.toString() !== teamInfo.userId && role !== "SUPER_ADMIN" && role !== "PLATFORM_ADMIN" && role !== "OWNER") {
            return { success: false, error: "INSUFFICIENT_PERMISSIONS" };
        }

        await questCollection.updateOne(
            { _id: new ObjectId(questId) },
            { $set: { status: newStatus, updated_at: new Date() } }
        );

        return { success: true };
    } catch (error) {
        console.error("[TOGGLE_QUEST_STATUS]", error);
        return { success: false, error: "INTERNAL_ERROR" };
    }
}
