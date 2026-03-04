"use server";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { dbAdapter } from "@/lib/database/db-adapter";
import type { QuestWithProgress } from "./types";

export async function getQuests(filters?: {
    status?: string;
    quest_type?: string;
}): Promise<QuestWithProgress[]> {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return [];

        const { ObjectId } = require("mongodb");
        const questCollection = await dbAdapter.getNativeCollection("Quest");
        const progressCollection = await dbAdapter.getNativeCollection("QuestProgress");

        // Build filter
        const filter: any = { team_id: new ObjectId(teamInfo.teamId) };
        if (filters?.status) {
            filter.status = filters.status;
        }
        if (filters?.quest_type) {
            filter.quest_type = filters.quest_type;
        }

        const quests = await questCollection
            .find(filter)
            .sort({ created_at: -1 })
            .toArray();

        if (quests.length === 0) return [];

        // Fetch current user's progress for all quests
        const questIds = quests.map((q: any) => q._id);
        const userProgress = await progressCollection
            .find({
                quest_id: { $in: questIds },
                user_id: new ObjectId(teamInfo.userId),
            })
            .toArray();

        const progressMap = new Map(
            userProgress.map((p: any) => [p.quest_id.toString(), p])
        );

        // Fetch team-wide progress counts
        const teamProgressAgg = await progressCollection
            .aggregate([
                { $match: { quest_id: { $in: questIds } } },
                {
                    $group: {
                        _id: "$quest_id",
                        total_participants: { $sum: 1 },
                        completed_count: {
                            $sum: { $cond: ["$is_completed", 1, 0] },
                        },
                    },
                },
            ])
            .toArray();

        const teamProgressMap = new Map(
            teamProgressAgg.map((tp: any) => [tp._id.toString(), tp])
        );

        return quests.map((q: any) => {
            const p = progressMap.get(q._id.toString());
            const tp = teamProgressMap.get(q._id.toString());
            return {
                ...q,
                id: q._id.toString(),
                _id: q._id.toString(),
                team_id: q.team_id.toString(),
                created_by: q.created_by.toString(),
                progress: p
                    ? {
                        current_count: p.current_count || 0,
                        is_completed: p.is_completed || false,
                        completed_at: p.completed_at,
                        qp_awarded: p.qp_awarded || 0,
                    }
                    : { current_count: 0, is_completed: false, qp_awarded: 0 },
                team_progress: tp
                    ? {
                        total_participants: tp.total_participants || 0,
                        completed_count: tp.completed_count || 0,
                    }
                    : { total_participants: 0, completed_count: 0 },
            };
        });
    } catch (error) {
        console.error("[GET_QUESTS]", error);
        return [];
    }
}
