/**
 * XP Curve Engine
 * 
 * Quadratic scaling level system with prestige support.
 * No season resets — XP is continuous and permanent.
 */

// ─── XP Thresholds ─────────────────────────────────────────────────────────────

/**
 * Returns XP required to advance FROM a given level TO the next level.
 * Uses tiered quadratic scaling for satisfying progression feel.
 */
export function xpRequiredForLevel(level: number): number {
    if (level < 1) return 100;
    if (level <= 10)  return 100 * level;      // 100-1000
    if (level <= 25)  return 150 * level;      // 1650-3750
    if (level <= 50)  return 250 * level;      // 6500-12500
    if (level <= 75)  return 400 * level;      // 20400-30000
    if (level <= 100) return 600 * level;      // 45600-60000
    return 600 * 100; // Cap at level 100 cost
}

/**
 * Returns total cumulative XP required to reach a specific level from level 1.
 */
export function totalXPForLevel(targetLevel: number): number {
    let total = 0;
    for (let i = 1; i < targetLevel; i++) {
        total += xpRequiredForLevel(i);
    }
    return total;
}

/**
 * Given a total lifetime XP, compute the effective level and leftover XP.
 * Accounts for prestige resets (prestige doesn't change the XP curve).
 */
export function computeLevelFromXP(xpTotal: number, prestige: number = 0): {
    level: number;
    xpCurrent: number;
    xpToNext: number;
    progressPct: number;
} {
    // Each prestige costs the total XP of reaching level 100
    const xpPerPrestige = totalXPForLevel(100);
    const effectiveXP = xpTotal - (prestige * xpPerPrestige);

    let remaining = Math.max(0, effectiveXP);
    let level = 1;

    while (level < 100) {
        const needed = xpRequiredForLevel(level);
        if (remaining < needed) break;
        remaining -= needed;
        level++;
    }

    const xpToNext = level >= 100 ? 0 : xpRequiredForLevel(level);
    const progressPct = xpToNext > 0 ? Math.min(100, Math.round((remaining / xpToNext) * 100)) : 100;

    return {
        level,
        xpCurrent: remaining,
        xpToNext,
        progressPct,
    };
}

// ─── XP Award Logic ─────────────────────────────────────────────────────────────

export interface LevelUpResult {
    previousLevel: number;
    newLevel: number;
    levelsGained: number;
    newXPCurrent: number;
    newXPTotal: number;
    reachedMax: boolean; // true if hit level 100
}

/**
 * Calculate new level state after awarding XP.
 * Does NOT mutate the database — callers must persist the result.
 */
export function calculateXPAward(
    currentXPTotal: number,
    xpToAward: number,
    currentPrestige: number,
): LevelUpResult {
    const before = computeLevelFromXP(currentXPTotal, currentPrestige);
    const newXPTotal = currentXPTotal + xpToAward;
    const after = computeLevelFromXP(newXPTotal, currentPrestige);

    return {
        previousLevel: before.level,
        newLevel: after.level,
        levelsGained: after.level - before.level,
        newXPCurrent: after.xpCurrent,
        newXPTotal,
        reachedMax: after.level >= 100,
    };
}

// ─── Prestige ─────────────────────────────────────────────────────────────────

export const PRESTIGE_TITLES: Record<number, string> = {
    0: "Recruit",
    1: "Bronze",
    2: "Silver",
    3: "Gold",
    4: "Platinum",
    5: "Diamond",
    6: "Obsidian",
};

export function getPrestigeTitle(prestige: number): string {
    if (prestige >= 6) return "Obsidian";
    return PRESTIGE_TITLES[prestige] || "Recruit";
}

/**
 * Returns the badge frame index (0-6) driven by prestige tier.
 * Used by the BadgeSVG renderer for the outer frame layer.
 */
export function getPrestigeFrame(prestige: number): number {
    return Math.min(prestige, 6);
}

// ─── Default XP Rewards by Difficulty ─────────────────────────────────────────

export const DEFAULT_XP_BY_DIFFICULTY: Record<string, number> = {
    EASY: 25,
    MEDIUM: 50,
    HARD: 100,
    LEGENDARY: 250,
};
