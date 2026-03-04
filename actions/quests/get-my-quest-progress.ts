"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";

/**
 * Gets the current user's quest stats summary.
 */
export async function getMyQuestProgress(): Promise<{
    totalQP: number;
    seasonQP: number;
    questsCompleted: number;
    activeQuests: number;
    streak: number;
    badges: string[];
    rank: number;
} | null> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId || !teamInfo?.userId) return null;

        const { ObjectId } = require("mongodb");
        const usersCollection = await dbAdapter.getNativeCollection("Users");
        const progressCollection = await dbAdapter.getNativeCollection("QuestProgress");
        const questCollection = await dbAdapter.getNativeCollection("Quest");

        const user = await usersCollection.findOne({
            _id: new ObjectId(teamInfo.userId),
        });
        if (!user) return null;

        // Count completed quests
        const teamQuestIds = await questCollection
            .find({ team_id: new ObjectId(teamInfo.teamId) })
            .project({ _id: 1 })
            .toArray();

        const completedCount = await progressCollection.countDocuments({
            quest_id: { $in: teamQuestIds.map((q: any) => q._id) },
            user_id: new ObjectId(teamInfo.userId),
            is_completed: true,
        });

        const activeCount = await progressCollection.countDocuments({
            quest_id: { $in: teamQuestIds.map((q: any) => q._id) },
            user_id: new ObjectId(teamInfo.userId),
            is_completed: false,
        });

        // Calculate rank
        const allMembers = await usersCollection
            .find({
                team_id: new ObjectId(teamInfo.teamId),
                userStatus: "ACTIVE",
            })
            .project({ _id: 1, quest_points_total: 1 })
            .sort({ quest_points_total: -1 })
            .toArray();

        const rank = allMembers.findIndex((m: any) => m._id.toString() === teamInfo.userId) + 1;

        return {
            totalQP: user.quest_points_total || 0,
            seasonQP: user.quest_points_season || 0,
            questsCompleted: completedCount,
            activeQuests: activeCount,
            streak: user.quest_streak || 0,
            badges: user.quest_badges || [],
            rank: rank || 1,
        };
    } catch (error) {
        console.error("[GET_MY_QUEST_PROGRESS]", error);
        return null;
    }
}
