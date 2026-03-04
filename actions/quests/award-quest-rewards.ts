"use server";

import { dbAdapter } from "@/lib/database/db-adapter";

/**
 * Awards Quest Points (QP) and University XP when a quest is completed.
 * Calculates bonus multipliers: Early Bird, Overachiever, Streak.
 */
export async function awardQuestRewards(params: {
    questId: string;
    userId: string;
}): Promise<{
    baseQP: number;
    bonuses: Record<string, number>;
    totalQP: number;
    xpAwarded: number;
} | null> {
    try {
        const { ObjectId } = require("mongodb");
        const questCollection = await dbAdapter.getNativeCollection("Quest");
        const progressCollection = await dbAdapter.getNativeCollection("QuestProgress");
        const usersCollection = await dbAdapter.getNativeCollection("Users");

        const quest = await questCollection.findOne({ _id: new ObjectId(params.questId) });
        if (!quest) return null;

        const progress = await progressCollection.findOne({
            quest_id: new ObjectId(params.questId),
            user_id: new ObjectId(params.userId),
        });
        if (!progress || progress.qp_awarded > 0) return null; // Already awarded

        const baseQP = quest.qp_reward || 100;
        const bonuses: Record<string, number> = {};

        // Early Bird: completed in first 25% of duration
        if (quest.starts_at && quest.ends_at && progress.completed_at) {
            const totalDuration = new Date(quest.ends_at).getTime() - new Date(quest.starts_at).getTime();
            const completedIn = new Date(progress.completed_at).getTime() - new Date(quest.starts_at).getTime();
            const ratio = completedIn / totalDuration;
            if (ratio <= 0.25) {
                bonuses.earlyBird = 0.5; // +50%
            } else if (ratio <= 0.5) {
                bonuses.speedDemon = 0.25; // +25%
            }
        }

        // Overachiever: exceeded target by 50%+
        if (progress.current_count >= quest.target_count * 1.5) {
            bonuses.overachiever = 0.3; // +30%
        }

        // Streak: check consecutive quests completed
        const user = await usersCollection.findOne({ _id: new ObjectId(params.userId) });
        const currentStreak = (user?.quest_streak || 0) + 1;
        if (currentStreak >= 3) {
            bonuses.streak = 0.2; // +20%
        }

        // Calculate total
        const bonusMultiplier = Object.values(bonuses).reduce((sum, b) => sum + b, 0);
        const totalQP = Math.round(baseQP * (1 + bonusMultiplier));
        const xpAwarded = Math.floor(totalQP / 10) + (quest.difficulty === "LEGENDARY" ? 50 : 0);

        // Update progress with rewards
        await progressCollection.updateOne(
            { _id: progress._id },
            {
                $set: {
                    qp_awarded: totalQP,
                    xp_awarded: true,
                    bonuses_applied: bonuses,
                    updated_at: new Date(),
                },
            }
        );

        // Update user aggregate fields
        await usersCollection.updateOne(
            { _id: new ObjectId(params.userId) },
            {
                $inc: {
                    quest_points_total: totalQP,
                    quest_points_season: totalQP,
                    quest_streak: 1,
                    university_level: xpAwarded,
                },
            }
        );

        // Check for badge unlocks
        const badgesToAward: string[] = [];
        const totalPoints = (user?.quest_points_total || 0) + totalQP;
        const totalCompleted = currentStreak; // Simplified

        if (totalCompleted >= 5 && !(user?.quest_badges || []).includes("sharpshooter")) {
            badgesToAward.push("sharpshooter");
        }
        if (totalPoints >= 1000 && !(user?.quest_badges || []).includes("quest_champion")) {
            badgesToAward.push("quest_champion");
        }
        if (currentStreak >= 5 && !(user?.quest_badges || []).includes("streak_master")) {
            badgesToAward.push("streak_master");
        }
        if (quest.difficulty === "LEGENDARY" && !(user?.quest_badges || []).includes("legendary_hunter")) {
            badgesToAward.push("legendary_hunter");
        }

        if (badgesToAward.length > 0) {
            await usersCollection.updateOne(
                { _id: new ObjectId(params.userId) },
                { $addToSet: { quest_badges: { $each: badgesToAward } } }
            );
        }

        return { baseQP, bonuses, totalQP, xpAwarded };
    } catch (error) {
        console.error("[AWARD_QUEST_REWARDS]", error);
        return null;
    }
}
