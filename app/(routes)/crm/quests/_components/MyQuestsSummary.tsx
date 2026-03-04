"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Flame, Medal, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyQuestsSummaryProps {
    progress: {
        totalQP: number;
        seasonQP: number;
        questsCompleted: number;
        activeQuests: number;
        streak: number;
        badges: string[];
        rank: number;
    } | null;
}

const BADGE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    sharpshooter: { label: "Sharpshooter", icon: Target, color: "text-amber-400" },
    quest_champion: { label: "Quest Champion", icon: Trophy, color: "text-violet-400" },
    streak_master: { label: "Streak Master", icon: Flame, color: "text-amber-400" },
    legendary_hunter: { label: "Legendary Hunter", icon: Medal, color: "text-violet-300" },
    sprint_king: { label: "Sprint King", icon: TrendingUp, color: "text-emerald-400" },
    first_blood: { label: "First Blood", icon: Zap, color: "text-cyan-400" },
};

export default function MyQuestsSummary({ progress }: MyQuestsSummaryProps) {
    if (!progress) return null;

    const stats = [
        { label: "Total QP", value: progress.totalQP.toLocaleString(), icon: Zap, color: "text-amber-400" },
        { label: "Completed", value: progress.questsCompleted, icon: Trophy, color: "text-emerald-400" },
        { label: "Streak", value: progress.streak, icon: Flame, color: "text-orange-400" },
        { label: "Rank", value: `#${progress.rank}`, icon: TrendingUp, color: "text-cyan-400" },
        { label: "Badges", value: progress.badges.length, icon: Medal, color: "text-violet-400" },
        { label: "Season QP", value: progress.seasonQP.toLocaleString(), icon: Target, color: "text-rose-400" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border bg-card/50 p-4"
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                        Operational Intelligence // My Stats
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Real-time Sync</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                            className="relative group rounded-xl border border-white/[0.03] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.05] hover:border-white/10"
                        >
                            <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Icon className={cn("w-3 h-3", stat.color)} />
                            </div>
                            <div className="text-xl font-black tracking-tighter tabular-nums mb-0.5">{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{stat.label}</div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Earned Badges */}
            {progress.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {progress.badges.map((badgeId) => {
                        const badge = BADGE_CONFIG[badgeId];
                        if (!badge) return null;
                        const BadgeIcon = badge.icon;
                        return (
                            <span
                                key={badgeId}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border bg-muted/40",
                                    badge.color
                                )}
                            >
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                            </span>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
