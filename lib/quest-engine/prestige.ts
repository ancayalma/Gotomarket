"use server";

import { dbAdapter } from "@/lib/database/db-adapter";
import { getPrestigeTitle, computeLevelFromXP, totalXPForLevel } from "./xp-curve";

/**
 * Manual prestige action. Only available at level 100.
 * - Increments `prestige` by 1
 * - Resets `level` to 1, `xp_current` to 0
 * - `xp_total` is NEVER reset (lifetime metric)
 * - Awards the prestige-tier badge
 */
export async function performPrestige(userId: string): Promise<{
    success: boolean;
    newPrestige?: number;
    newTitle?: string;
    error?: string;
}> {
    try {
        const { ObjectId } = require("mongodb");
        const usersCollection = await dbAdapter.getNativeCollection("Users");

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) return { success: false, error: "USER_NOT_FOUND" };

        // Verify they are at level 100
        const currentState = computeLevelFromXP(user.xp_total || 0, user.prestige || 0);
        if (currentState.level < 100) {
            return { success: false, error: "MUST_BE_LEVEL_100" };
        }

        const newPrestige = (user.prestige || 0) + 1;
        const newTitle = getPrestigeTitle(newPrestige);

        // Update user — reset level/xp_current but KEEP xp_total
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    level: 1,
                    xp_current: 0,
                    prestige: newPrestige,
                    prestige_title: newTitle,
                    updated_at: new Date(),
                },
            }
        );

        // Award prestige badge
        const { awardBadge } = await import("./badge-engine");
        await awardBadge(userId, `prestige_${newTitle.toLowerCase()}`);

        return { success: true, newPrestige, newTitle };
    } catch (error) {
        console.error("[PRESTIGE_ERROR]", error);
        return { success: false, error: "INTERNAL_ERROR" };
    }
}
