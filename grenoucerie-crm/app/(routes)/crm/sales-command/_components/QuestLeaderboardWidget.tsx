"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Medal, Target, Crown } from "lucide-react";
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
    1: "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent shadow-amber-500/5",
    2: "border-zinc-400/15 bg-gradient-to-r from-zinc-400/8 via-transparent to-transparent",
    3: "border-amber-700/15 bg-gradient-to-r from-amber-700/8 via-transparent to-transparent",
};

const RANK_BADGE: Record<number, string> = {
    1: "bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-500/30",
    2: "bg-gradient-to-br from-zinc-300 to-zinc-500 text-black",
    3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100",
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
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl p-5 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-white/90">Quest Leaderboard</h2>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.leaderboard.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl p-5 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-white/90">Quest Leaderboard</h2>
                </div>
                <div className="text-sm text-white/25 text-center py-10 font-medium">
                    No quest activity yet. Complete quests to appear on the leaderboard.
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl p-5 shadow-2xl">
            {/* Accent glow */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-white/90">Quest Leaderboard</h2>
                </div>
                <span className="text-[11px] font-bold text-white/25 uppercase tracking-wider">
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
                            "p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.04]",
                            RANK_STYLES[entry.rank] || ""
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Rank badge */}
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                                    RANK_BADGE[entry.rank] || "bg-white/[0.04] text-white/30"
                                )}>
                                    {entry.rank}
                                </div>

                                {/* Avatar */}
                                <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-white/[0.06]">
                                    <img
                                        src={entry.avatar || "/images/nouser.png"}
                                        alt={entry.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div>
                                    <div className="text-sm font-bold text-white/80">{entry.name}</div>
                                    <div className="text-[11px] text-white/25 flex items-center gap-2">
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
                                <div className="text-xl font-black tabular-nums flex items-center gap-1 text-white/80">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    {entry.questPoints.toLocaleString()}
                                </div>
                                <div className="text-[9px] text-white/20 font-bold uppercase tracking-wider">QP</div>
                            </div>
                        </div>

                        {/* Badges */}
                        {entry.badges.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                                {entry.badges.map((badgeId) => {
                                    const badge = BADGE_ICONS[badgeId];
                                    if (!badge) return null;
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <span
                                            key={badgeId}
                                            className={cn(
                                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-white/[0.06] bg-white/[0.03]",
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
