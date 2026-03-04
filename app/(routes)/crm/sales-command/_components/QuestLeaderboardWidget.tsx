"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Medal, Target, TrendingUp, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestLeaderEntry {
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    questPoints: number;
    questStreak: number;
    questsCompleted: number;
    badges: string[];
    rank: number;
}

const BADGE_ICONS: Record<string, { icon: any; color: string }> = {
    sharpshooter: { icon: Target, color: "text-amber-400" },
    quest_champion: { icon: Trophy, color: "text-violet-400" },
    streak_master: { icon: Flame, color: "text-amber-400" },
    legendary_hunter: { icon: Medal, color: "text-violet-300" },
    sprint_king: { icon: Crown, color: "text-emerald-400" },
    first_blood: { icon: Zap, color: "text-cyan-400" },
};

const RANK_STYLES: Record<number, string> = {
    1: "ring-1 ring-amber-400/50 bg-gradient-to-br from-amber-500/10 to-yellow-500/5",
    2: "ring-1 ring-zinc-300/30 bg-gradient-to-br from-zinc-500/10 to-zinc-400/5",
    3: "ring-1 ring-amber-700/30 bg-gradient-to-br from-amber-800/10 to-amber-700/5",
};

export default function QuestLeaderboardWidget() {
    const [data, setData] = useState<{ leaderboard: QuestLeaderEntry[]; totalActiveQuests: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { getGlobalQuestBoard } = await import("@/actions/quests/get-global-quest-board");
                const result = await getGlobalQuestBoard();
                setData(result);
            } catch (e) {
                console.error("Failed to load quest leaderboard:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">Quest Leaderboard</h2>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.leaderboard.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">Quest Leaderboard</h2>
                </div>
                <div className="text-sm text-muted-foreground text-center py-8">
                    No quest activity yet. Complete quests to appear on the leaderboard.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">Quest Leaderboard</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                    {data.totalActiveQuests} active quest{data.totalActiveQuests !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {data.leaderboard.map((entry, idx) => (
                    <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                            "p-3 rounded-lg border bg-background transition-colors",
                            RANK_STYLES[entry.rank] || ""
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Rank */}
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                    entry.rank === 1 && "bg-amber-500/20 text-amber-400",
                                    entry.rank === 2 && "bg-zinc-400/20 text-zinc-300",
                                    entry.rank === 3 && "bg-amber-700/20 text-amber-600",
                                    entry.rank > 3 && "bg-muted/50 text-muted-foreground"
                                )}>
                                    {entry.rank}
                                </div>

                                {/* Avatar */}
                                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                        src={entry.avatar || "/images/nouser.png"}
                                        alt={entry.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="text-sm font-medium">{entry.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span className="flex items-center gap-0.5">
                                            <Trophy className="w-3 h-3 text-emerald-400" />
                                            {entry.questsCompleted} done
                                        </span>
                                        {entry.questStreak > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                {entry.questStreak} streak
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* QP */}
                            <div className="text-right">
                                <div className="text-xl font-bold tabular-nums flex items-center gap-1">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    {entry.questPoints.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-muted-foreground">QP</div>
                            </div>
                        </div>

                        {/* Badges */}
                        {entry.badges.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {entry.badges.map((badgeId) => {
                                    const badge = BADGE_ICONS[badgeId];
                                    if (!badge) return null;
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <span
                                            key={badgeId}
                                            className={cn(
                                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium border bg-muted/40",
                                                badge.color
                                            )}
                                        >
                                            <BadgeIcon className="w-2.5 h-2.5" />
                                            {badgeId.replace(/_/g, " ")}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
