"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";

/**
 * Returns the number of ACTIVE quests for the current user's team.
 * Used by the dashboard tile to show quest count.
 */
export async function getActiveQuestCount(): Promise<number> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return 0;

        const { ObjectId } = require("mongodb");
        const collection = await dbAdapter.getNativeCollection("Quest");
        const now = new Date();

        const count = await collection.countDocuments({
            team_id: new ObjectId(teamInfo.teamId),
            status: "ACTIVE",
            $or: [
                { starts_at: null },
                { starts_at: { $lte: now } },
            ],
        });

        return count;
    } catch (error) {
        console.error("[GET_ACTIVE_QUEST_COUNT]", error);
        return 0;
    }
}
