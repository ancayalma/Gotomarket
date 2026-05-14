"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Flame, Medal, TrendingUp, Target, Star, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import BadgeSVG from "@/components/ui/BadgeSVG";
import { type BadgeDNA, getLevelBadgeDNA } from "@/lib/quest-engine/badge-dna";
import BadgeShowcaseModal from "./BadgeShowcaseModal";

interface EarnedBadge {
    badge_id: string;
    badge_dna: BadgeDNA;
    badge_name: string;
    category: string;
    rarity: string;
    awarded_at: string;
}

interface MyQuestsSummaryProps {
    progress: {
        totalQP: number;
        seasonQP: number;
        questsCompleted: number;
        activeQuests: number;
        streak: number;
        badges: string[];
        rank: number;
        // New XP/Level fields
        xpTotal: number;
        xpCurrent: number;
        xpToNext: number;
        level: number;
        prestige: number;
        prestigeTitle: string;
        progressPct: number;
        earnedBadges: EarnedBadge[];
        showcaseBadge: EarnedBadge | null;
    } | null;
    userId: string;
}

const PRESTIGE_RING_COLORS: Record<string, string> = {
    Recruit: "#6B7280",
    Bronze: "#CD7F32",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    Platinum: "#E5E4E2",
    Diamond: "#B9F2FF",
    Obsidian: "#2D1B4E",
};

export default function MyQuestsSummary({ progress, userId }: MyQuestsSummaryProps) {
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    if (!progress) return null;

    const ringColor = PRESTIGE_RING_COLORS[progress.prestigeTitle || "Recruit"] || PRESTIGE_RING_COLORS.Recruit;
    const circumference = 2 * Math.PI * 38;
    const dashOffset = circumference - (progress.progressPct / 100) * circumference;

    const stats = [
        { label: "Total QP", value: progress.totalQP.toLocaleString(), icon: Zap, color: "text-amber-400" },
        { label: "XP Lifetime", value: progress.xpTotal.toLocaleString(), icon: Sparkles, color: "text-violet-400" },
        { label: "Completed", value: progress.questsCompleted, icon: Trophy, color: "text-emerald-400" },
        { label: "Streak", value: progress.streak, icon: Flame, color: "text-orange-400" },
        { label: "Rank", value: `#${progress.rank}`, icon: TrendingUp, color: "text-cyan-400" },
        { label: "Badges", value: progress.earnedBadges.length, icon: Medal, color: "text-violet-400" },
    ];

    const canPrestige = progress.level >= 100;

    const handlePrestige = async () => {
        if (!canPrestige) return;
        const confirmed = window.confirm(
            `Prestige to ${getNextPrestigeTitle(progress.prestige)}?\n\nThis will reset your level to 1 but you'll earn an exclusive prestige badge and frame. Your lifetime XP is preserved.`
        );
        if (!confirmed) return;

        try {
            const { performPrestige } = await import("@/lib/quest-engine/prestige");
            const result = await performPrestige(userId);
            if (result.success) {
                window.location.reload();
            }
        } catch (e) {
            console.error("Prestige failed:", e);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border bg-card/50 p-5"
            >
                <div className="flex items-center justify-between mb-5 px-1">
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

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Level Ring */}
                    <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            {/* Background ring */}
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
                                <circle cx="42" cy="42" r="38" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="4" />
                                {/* Progress ring */}
                                <circle
                                    cx="42" cy="42" r="38"
                                    fill="none"
                                    stroke={ringColor}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    className="transition-all duration-1000 ease-out"
                                />
                                {/* Prestige outer glow */}
                                {progress.prestige > 0 && (
                                    <circle
                                        cx="42" cy="42" r="40"
                                        fill="none"
                                        stroke={ringColor}
                                        strokeWidth="1"
                                        opacity="0.3"
                                    />
                                )}
                            </svg>
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black tabular-nums tracking-tighter">{progress.level}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Level</span>
                            </div>
                            {/* Prestige badge */}
                            {progress.prestige > 0 && (
                                <div
                                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-card"
                                    style={{ backgroundColor: ringColor, color: progress.prestige >= 6 ? "#fff" : "#000" }}
                                >
                                    P{progress.prestige}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                                    <BadgeSVG dna={getLevelBadgeDNA(progress.level, progress.prestige)} size={32} />
                                </div>
                                <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                    {progress.prestigeTitle || "Recruit"}
                                    {progress.prestige > 0 && <span className="block text-[9px] text-muted-foreground/40 font-black mt-0.5">Prestige {progress.prestige}</span>}
                                </div>
                            </div>
                            
                            {/* XP bar */}
                            <div className="w-48 max-w-full">
                                <div className="flex items-center justify-between text-[9px] mb-1">
                                    <span className="font-black text-muted-foreground/40 uppercase tracking-widest">XP Progress</span>
                                    <span className="tabular-nums font-bold text-muted-foreground/60">
                                        {progress.xpCurrent.toLocaleString()} / {progress.xpToNext.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.progressPct}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${ringColor}88, ${ringColor})` }}
                                    />
                                </div>
                            </div>
                            {/* Prestige button */}
                            {canPrestige && (
                                <button
                                    onClick={handlePrestige}
                                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all animate-pulse"
                                >
                                    <Star className="w-3 h-3" />
                                    Prestige Available
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2.5">
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
                </div>

                {/* Badge Showcase Row */}
                {progress.earnedBadges.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/[0.03]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                Earned Badges
                            </span>
                            <button
                                onClick={() => setShowBadgeModal(true)}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/50 hover:text-primary transition-colors"
                            >
                                View All
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {progress.earnedBadges.slice(0, 12).map((badge) => (
                                <div
                                    key={badge.badge_id}
                                    className="group/badge relative flex-shrink-0"
                                    title={`${badge.badge_name} (${badge.rarity})`}
                                >
                                    <BadgeSVG dna={badge.badge_dna} size={36} />
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/badge:block z-10">
                                        <div className="bg-card border border-border rounded-lg px-2 py-1 text-[9px] font-medium whitespace-nowrap shadow-lg">
                                            {badge.badge_name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {progress.earnedBadges.length > 12 && (
                                <button
                                    onClick={() => setShowBadgeModal(true)}
                                    className="flex-shrink-0 w-9 h-9 rounded-full border border-dashed border-muted-foreground/20 flex items-center justify-center text-[10px] font-bold text-muted-foreground/40 hover:border-primary/40 hover:text-primary/60 transition-colors"
                                >
                                    +{progress.earnedBadges.length - 12}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Badge Showcase Modal */}
            <BadgeShowcaseModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                earnedBadges={progress.earnedBadges}
                userId={userId}
            />
        </>
    );
}

function getNextPrestigeTitle(current: number): string {
    const titles: Record<number, string> = { 0: "Bronze", 1: "Silver", 2: "Gold", 3: "Platinum", 4: "Diamond", 5: "Obsidian" };
    return titles[current] || "Obsidian";
}
