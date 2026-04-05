/**
 * Badge Engine — SERVER ONLY
 * 
 * Contains database operations for awarding and checking badges.
 * Types and constants are imported from badge-dna.ts (client-safe).
 */

import { dbAdapter } from "@/lib/database/db-adapter";
import {
    ACHIEVEMENT_CATALOG,
    getAchievementById,
    type AchievementCheckStats,
    type BadgeDNA,
} from "./badge-dna";

// Re-export types for server consumers
export type { BadgeDNA, AchievementCheckStats, AchievementDef } from "./badge-dna";
export { ACHIEVEMENT_CATALOG, getAchievementById, PALETTES, RARITIES, RARITY_COLORS } from "./badge-dna";

// ── Award Badge to User ──

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
        const achievement = getAchievementById(badgeId);
        if (!achievement) return false;

        const { ObjectId } = require("mongodb");
        const badgeCollection = await dbAdapter.getNativeCollection("UserBadge");

        // Upsert — don't award twice
        await badgeCollection.updateOne(
            { user_id: new ObjectId(userId), badge_id: badgeId },
            {
                $setOnInsert: {
                    user_id: new ObjectId(userId),
                    badge_id: badgeId,
                    badge_dna: achievement.dna,
                    badge_name: achievement.name,
                    category: achievement.category,
                    rarity: achievement.rarity,
                    awarded_at: new Date(),
                },
            },
            { upsert: true }
        );

        return true;
    } catch (error) {
        console.error("[AWARD_BADGE_ERROR]", error);
        return false;
    }
}

// ── Check & Award All Eligible Badges for a User ──

export async function checkAndAwardBadges(userId: string, stats: AchievementCheckStats): Promise<string[]> {
    const { ObjectId } = require("mongodb");
    const badgeCollection = await dbAdapter.getNativeCollection("UserBadge");

    // Get already earned badges
    const existing = await badgeCollection
        .find({ user_id: new ObjectId(userId) })
        .project({ badge_id: 1 })
        .toArray();
    const earnedSet = new Set(existing.map((b: any) => b.badge_id));

    const newlyAwarded: string[] = [];

    for (const achievement of ACHIEVEMENT_CATALOG) {
        if (earnedSet.has(achievement.id)) continue;
        if (!achievement.check) continue; // Prestige badges are awarded externally
        if (achievement.check(stats)) {
            const awarded = await awardBadge(userId, achievement.id);
            if (awarded) newlyAwarded.push(achievement.id);
        }
    }

    return newlyAwarded;
}
