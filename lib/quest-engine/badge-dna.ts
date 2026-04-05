/**
 * Badge DNA Types & Constants (CLIENT-SAFE)
 * 
 * This file contains ONLY types, constants, and the achievement catalog.
 * NO database imports — safe for use in client components.
 */

// ─── BadgeDNA Types ─────────────────────────────────────────────────────────────

export interface BadgeDNA {
    shape: number;    // 0-7
    icon: number;     // 0-23
    palette: number;  // 0-11
    pattern: number;  // 0-5
    frame: number;    // 0-6
    rarity: number;   // 0-4
}

export const SHAPES = [
    "circle", "hexagon", "shield", "star", "diamond", "pentagon", "octagon", "gear"
] as const;

export const ICONS = [
    "sword", "flame", "crown", "target", "bolt", "trophy", "skull", "eye",
    "compass", "anchor", "rocket", "atom", "heart", "mountain", "wave", "feather",
    "gem", "key", "star", "moon", "sun", "lightning", "leaf", "dragon"
] as const;

export const PALETTES = [
    ["#F59E0B", "#D97706", "#FCD34D"],   // 0: Gold
    ["#8B5CF6", "#7C3AED", "#C4B5FD"],   // 1: Violet
    ["#10B981", "#059669", "#6EE7B7"],   // 2: Emerald
    ["#EF4444", "#DC2626", "#FCA5A5"],   // 3: Rose
    ["#3B82F6", "#2563EB", "#93C5FD"],   // 4: Blue
    ["#EC4899", "#DB2777", "#F9A8D4"],   // 5: Pink
    ["#06B6D4", "#0891B2", "#67E8F9"],   // 6: Cyan
    ["#F97316", "#EA580C", "#FDBA74"],   // 7: Orange
    ["#A855F7", "#9333EA", "#D8B4FE"],   // 8: Purple
    ["#14B8A6", "#0D9488", "#5EEAD4"],   // 9: Teal
    ["#64748B", "#475569", "#CBD5E1"],   // 10: Slate
    ["#FBBF24", "#F59E0B", "#FEF3C7"],  // 11: Amber
] as const;

export const PATTERNS = [
    "none", "stripes", "dots", "crosshatch", "radial", "circuit"
] as const;

export const RARITIES = [
    "COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"
] as const;

export const RARITY_COLORS: Record<string, string> = {
    COMMON: "#9CA3AF",
    UNCOMMON: "#34D399",
    RARE: "#60A5FA",
    EPIC: "#A78BFA",
    LEGENDARY: "#FBBF24",
};

// ─── Achievement Catalog ────────────────────────────────────────────────────────

export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    category: "quest" | "streak" | "level" | "prestige" | "social" | "meta";
    rarity: typeof RARITIES[number];
    dna: BadgeDNA;
    check?: (stats: AchievementCheckStats) => boolean;
}

export interface AchievementCheckStats {
    questsCompleted: number;
    questStreak: number;
    xpTotal: number;
    level: number;
    prestige: number;
    questsCreated: number;
    badgeCount: number;
    legendaryCompleted: number;
    earlyBirdCount: number;
    overachieverCount: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
    // ── Quest Completion ──
    { id: "first_blood", name: "First Blood", description: "Complete your first quest", category: "quest", rarity: "COMMON",
      dna: { shape: 0, icon: 4, palette: 6, pattern: 0, frame: 0, rarity: 0 },
      check: (s) => s.questsCompleted >= 1 },
    { id: "sharpshooter", name: "Sharpshooter", description: "Complete 5 quests", category: "quest", rarity: "COMMON",
      dna: { shape: 2, icon: 3, palette: 0, pattern: 0, frame: 0, rarity: 0 },
      check: (s) => s.questsCompleted >= 5 },
    { id: "veteran", name: "Veteran", description: "Complete 25 quests", category: "quest", rarity: "UNCOMMON",
      dna: { shape: 1, icon: 0, palette: 10, pattern: 1, frame: 1, rarity: 1 },
      check: (s) => s.questsCompleted >= 25 },
    { id: "centurion", name: "Centurion", description: "Complete 100 quests", category: "quest", rarity: "RARE",
      dna: { shape: 5, icon: 2, palette: 0, pattern: 4, frame: 2, rarity: 2 },
      check: (s) => s.questsCompleted >= 100 },
    { id: "quest_legend", name: "Quest Legend", description: "Complete 500 quests", category: "quest", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 5, palette: 0, pattern: 5, frame: 5, rarity: 4 },
      check: (s) => s.questsCompleted >= 500 },
    { id: "legendary_hunter", name: "Legendary Hunter", description: "Complete a Legendary difficulty quest", category: "quest", rarity: "EPIC",
      dna: { shape: 7, icon: 23, palette: 1, pattern: 5, frame: 4, rarity: 3 },
      check: (s) => s.legendaryCompleted >= 1 },
    { id: "legendary_slayer", name: "Legendary Slayer", description: "Complete 10 Legendary quests", category: "quest", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 6, palette: 3, pattern: 5, frame: 6, rarity: 4 },
      check: (s) => s.legendaryCompleted >= 10 },
    { id: "speed_demon", name: "Speed Demon", description: "Earn Early Bird bonus on 3 quests", category: "quest", rarity: "UNCOMMON",
      dna: { shape: 4, icon: 11, palette: 7, pattern: 0, frame: 1, rarity: 1 },
      check: (s) => s.earlyBirdCount >= 3 },
    { id: "overachiever", name: "Overachiever", description: "Exceed target by 150% on 3 quests", category: "quest", rarity: "RARE",
      dna: { shape: 1, icon: 13, palette: 2, pattern: 3, frame: 2, rarity: 2 },
      check: (s) => s.overachieverCount >= 3 },

    // ── Streak ──
    { id: "hot_streak", name: "Hot Streak", description: "3-quest completion streak", category: "streak", rarity: "COMMON",
      dna: { shape: 0, icon: 1, palette: 7, pattern: 0, frame: 0, rarity: 0 },
      check: (s) => s.questStreak >= 3 },
    { id: "blaze_trail", name: "Blaze Trail", description: "7-quest streak", category: "streak", rarity: "UNCOMMON",
      dna: { shape: 1, icon: 1, palette: 3, pattern: 1, frame: 1, rarity: 1 },
      check: (s) => s.questStreak >= 7 },
    { id: "inferno", name: "Inferno", description: "14-quest streak", category: "streak", rarity: "RARE",
      dna: { shape: 7, icon: 1, palette: 3, pattern: 4, frame: 3, rarity: 2 },
      check: (s) => s.questStreak >= 14 },
    { id: "eternal_flame", name: "Eternal Flame", description: "30-quest streak", category: "streak", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 1, palette: 0, pattern: 5, frame: 6, rarity: 4 },
      check: (s) => s.questStreak >= 30 },

    // ── XP/Level Milestones ──
    { id: "level_10", name: "Apprentice", description: "Reach Level 10", category: "level", rarity: "COMMON",
      dna: { shape: 0, icon: 18, palette: 4, pattern: 0, frame: 0, rarity: 0 },
      check: (s) => s.level >= 10 },
    { id: "level_25", name: "Journeyman", description: "Reach Level 25", category: "level", rarity: "UNCOMMON",
      dna: { shape: 2, icon: 18, palette: 2, pattern: 1, frame: 1, rarity: 1 },
      check: (s) => s.level >= 25 },
    { id: "level_50", name: "Expert", description: "Reach Level 50", category: "level", rarity: "RARE",
      dna: { shape: 1, icon: 18, palette: 1, pattern: 3, frame: 2, rarity: 2 },
      check: (s) => s.level >= 50 },
    { id: "level_75", name: "Master", description: "Reach Level 75", category: "level", rarity: "EPIC",
      dna: { shape: 5, icon: 18, palette: 5, pattern: 4, frame: 4, rarity: 3 },
      check: (s) => s.level >= 75 },
    { id: "level_100", name: "Grandmaster", description: "Reach Level 100", category: "level", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 2, palette: 0, pattern: 5, frame: 5, rarity: 4 },
      check: (s) => s.level >= 100 },

    { id: "xp_1k", name: "Initiate", description: "Earn 1,000 lifetime XP", category: "level", rarity: "COMMON",
      dna: { shape: 0, icon: 4, palette: 9, pattern: 0, frame: 0, rarity: 0 },
      check: (s) => s.xpTotal >= 1000 },
    { id: "xp_10k", name: "Adept", description: "Earn 10,000 lifetime XP", category: "level", rarity: "UNCOMMON",
      dna: { shape: 4, icon: 4, palette: 4, pattern: 1, frame: 1, rarity: 1 },
      check: (s) => s.xpTotal >= 10000 },
    { id: "xp_50k", name: "Savant", description: "Earn 50,000 lifetime XP", category: "level", rarity: "RARE",
      dna: { shape: 6, icon: 11, palette: 8, pattern: 3, frame: 2, rarity: 2 },
      check: (s) => s.xpTotal >= 50000 },
    { id: "xp_100k", name: "Sage", description: "Earn 100,000 lifetime XP", category: "level", rarity: "EPIC",
      dna: { shape: 1, icon: 19, palette: 1, pattern: 4, frame: 4, rarity: 3 },
      check: (s) => s.xpTotal >= 100000 },
    { id: "xp_500k", name: "Ascendant", description: "Earn 500,000 lifetime XP", category: "level", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 20, palette: 0, pattern: 5, frame: 5, rarity: 4 },
      check: (s) => s.xpTotal >= 500000 },
    { id: "xp_1m", name: "Transcendent", description: "Earn 1,000,000 lifetime XP", category: "level", rarity: "LEGENDARY",
      dna: { shape: 7, icon: 9, palette: 11, pattern: 5, frame: 6, rarity: 4 },
      check: (s) => s.xpTotal >= 1000000 },

    // ── Prestige ──
    { id: "prestige_bronze", name: "Bronze Prestige", description: "Reach Prestige 1", category: "prestige", rarity: "RARE",
      dna: { shape: 2, icon: 16, palette: 7, pattern: 4, frame: 1, rarity: 2 } },
    { id: "prestige_silver", name: "Silver Prestige", description: "Reach Prestige 2", category: "prestige", rarity: "RARE",
      dna: { shape: 2, icon: 16, palette: 10, pattern: 4, frame: 2, rarity: 2 } },
    { id: "prestige_gold", name: "Gold Prestige", description: "Reach Prestige 3", category: "prestige", rarity: "EPIC",
      dna: { shape: 2, icon: 16, palette: 0, pattern: 4, frame: 3, rarity: 3 } },
    { id: "prestige_platinum", name: "Platinum Prestige", description: "Reach Prestige 4", category: "prestige", rarity: "EPIC",
      dna: { shape: 2, icon: 16, palette: 4, pattern: 5, frame: 4, rarity: 3 } },
    { id: "prestige_diamond", name: "Diamond Prestige", description: "Reach Prestige 5", category: "prestige", rarity: "LEGENDARY",
      dna: { shape: 4, icon: 16, palette: 6, pattern: 5, frame: 5, rarity: 4 } },
    { id: "prestige_obsidian", name: "Obsidian Prestige", description: "Reach Prestige 6+", category: "prestige", rarity: "LEGENDARY",
      dna: { shape: 7, icon: 16, palette: 10, pattern: 5, frame: 6, rarity: 4 } },

    // ── Social ──
    { id: "team_captain", name: "Team Captain", description: "Create 10 quests", category: "social", rarity: "UNCOMMON",
      dna: { shape: 2, icon: 7, palette: 4, pattern: 1, frame: 1, rarity: 1 },
      check: (s) => s.questsCreated >= 10 },
    { id: "war_chief", name: "War Chief", description: "Create 50 quests", category: "social", rarity: "RARE",
      dna: { shape: 1, icon: 2, palette: 3, pattern: 3, frame: 3, rarity: 2 },
      check: (s) => s.questsCreated >= 50 },

    // ── Meta ──
    { id: "collector", name: "Collector", description: "Earn 10 unique badges", category: "meta", rarity: "UNCOMMON",
      dna: { shape: 6, icon: 17, palette: 8, pattern: 2, frame: 1, rarity: 1 },
      check: (s) => s.badgeCount >= 10 },
    { id: "completionist", name: "Completionist", description: "Earn 25 unique badges", category: "meta", rarity: "RARE",
      dna: { shape: 1, icon: 17, palette: 1, pattern: 4, frame: 3, rarity: 2 },
      check: (s) => s.badgeCount >= 25 },
    { id: "legendary_collector", name: "Legendary Collector", description: "Earn 50 unique badges", category: "meta", rarity: "LEGENDARY",
      dna: { shape: 3, icon: 17, palette: 0, pattern: 5, frame: 6, rarity: 4 },
      check: (s) => s.badgeCount >= 50 },
];

// ── Helper: Get Achievement by ID ──

export function getAchievementById(id: string): AchievementDef | undefined {
    return ACHIEVEMENT_CATALOG.find(a => a.id === id);
}

// ── Dynamic HUD Level Badge Generation ──

export function getLevelBadgeDNA(level: number, prestige: number): BadgeDNA {
    const tier = Math.floor(Math.max(1, level) / 20); // 0-5
    const shapes = [0, 2, 1, 5, 3, 7]; // circle, shield, hexagon, pentagon, star, gear
    const frames = [0, 1, 2, 3, 4, 5]; 
    const patterns = [0, 1, 2, 3, 4, 5];
    const palettes = [10, 7, 2, 4, 8, 0]; // Slate, Orange, Emerald, Blue, Purple, Gold
    
    const pLevel = Math.min(Math.max(0, prestige), 5);
    const safeTier = Math.min(tier, 5);
    
    return {
        shape: shapes[safeTier],
        icon: 18, // The Star icon
        palette: palettes[pLevel],
        pattern: patterns[safeTier],
        frame: frames[safeTier],
        rarity: Math.min(pLevel + Math.floor((level % 100) / 33), 4), // Rarity scales up naturally as you level towards next prestige
    };
}
