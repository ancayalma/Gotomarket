"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Sword, Clock, Users2, Zap, Trophy, Crown, Flame, Target,
    ChevronRight, MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestWithProgress } from "@/actions/quests/types";
import QuestProgressBar from "./QuestProgressBar";

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; gradient: string; ring: string; icon: any }> = {
    EASY: {
        label: "Easy",
        color: "text-emerald-400",
        gradient: "from-emerald-500/15 to-green-500/10",
        ring: "ring-emerald-500/20",
        icon: Target,
    },
    MEDIUM: {
        label: "Medium",
        color: "text-amber-400",
        gradient: "from-amber-500/15 to-yellow-500/10",
        ring: "ring-amber-500/20",
        icon: Sword,
    },
    HARD: {
        label: "Hard",
        color: "text-rose-400",
        gradient: "from-rose-500/15 to-red-500/10",
        ring: "ring-rose-500/20",
        icon: Flame,
    },
    LEGENDARY: {
        label: "Legendary",
        color: "text-violet-300",
        gradient: "from-violet-500/20 to-purple-500/15",
        ring: "ring-violet-500/30",
        icon: Crown,
    },
};

const DURATION_LABELS: Record<string, string> = {
    WEEKEND_SPRINT: "Weekend Blitz",
    WEEKLY_SPRINT: "Weekly Sprint",
    BIWEEKLY: "Bi-Weekly",
    MONTHLY: "Monthly Mission",
    QUARTERLY: "Quarterly Quest",
    STRONG_START: "Strong Start",
    STRONG_FINISH: "Strong Finish",
    CUSTOM: "Custom",
    OPEN_ENDED: "No Deadline",
};

interface QuestCardProps {
    quest: QuestWithProgress;
    isAdmin: boolean;
    onStatusChange: () => void;
}

export default function QuestCard({ quest, isAdmin, onStatusChange }: QuestCardProps) {
    const [isToggling, setIsToggling] = useState(false);
    const config = DIFFICULTY_CONFIG[quest.difficulty] || DIFFICULTY_CONFIG.MEDIUM;
    const DifficultyIcon = config.icon;

    const progressPct = quest.target_count > 0
        ? Math.min(100, Math.round(((quest.progress?.current_count || 0) / quest.target_count) * 100))
        : 0;

    const isCompleted = quest.progress?.is_completed || false;

    // Time remaining
    const getTimeRemaining = () => {
        if (!quest.ends_at) return "No deadline";
        const end = new Date(quest.ends_at);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        if (diff <= 0) return "Expired";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    const handleToggleStatus = async () => {
        if (!isAdmin || isToggling) return;
        setIsToggling(true);
        try {
            const { toggleQuestStatus } = await import("@/actions/quests/toggle-quest-status");
            const newStatus = quest.status === "DRAFT" ? "ACTIVE" : quest.status === "ACTIVE" ? "COMPLETED" : "ARCHIVED";
            await toggleQuestStatus(quest.id, newStatus);
            onStatusChange();
        } catch (e) {
            console.error("Failed to toggle status:", e);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm p-5 transition-all duration-500",
                "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.02] hover:bg-white/[0.05] hover:border-white/10",
                isCompleted && "opacity-60 grayscale-[0.2]",
                quest.difficulty === "LEGENDARY" && "ring-1 ring-violet-500/30"
            )}
        >
            {/* Difficulty Badge - Top Left */}
            <div className="flex items-center justify-between mb-4">
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border backdrop-blur-md",
                    config.color,
                    quest.difficulty === "EASY" && "border-emerald-500/20 bg-emerald-500/5",
                    quest.difficulty === "MEDIUM" && "border-amber-500/20 bg-amber-500/5",
                    quest.difficulty === "HARD" && "border-rose-500/20 bg-rose-500/5",
                    quest.difficulty === "LEGENDARY" && "border-violet-500/20 bg-violet-500/5"
                )}>
                    <DifficultyIcon className="w-3 h-3 stroke-[3px]" />
                    {config.label}
                </span>

                {/* Status toggle for admins */}
                {isAdmin && (
                    <button
                        onClick={handleToggleStatus}
                        disabled={isToggling}
                        className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all duration-300",
                            quest.status === "ACTIVE" && "border-emerald-500/20 text-emerald-400/70 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-400",
                            quest.status === "DRAFT" && "border-white/10 text-white/40 bg-white/5 hover:bg-white/10",
                            quest.status === "COMPLETED" && "border-blue-500/20 text-blue-400/70 bg-blue-500/5",
                            quest.status === "ARCHIVED" && "border-white/10 text-white/20 bg-white/5",
                            isToggling && "opacity-50 cursor-wait"
                        )}
                    >
                        {quest.status}
                    </button>
                )}
            </div>

            {/* Title + Description */}
            <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-1 italic uppercase">{quest.title}</h3>
            {quest.description && (
                <p className="text-[11px] text-muted-foreground/60 font-medium line-clamp-2 mb-4 leading-relaxed">{quest.description}</p>
            )}

            {/* Progress */}
            <div className="space-y-2.5 mb-5">
                <QuestProgressBar
                    current={quest.progress?.current_count || 0}
                    target={quest.target_count}
                    difficulty={quest.difficulty}
                    isCompleted={isCompleted}
                />
                <div className="flex items-center justify-between mt-1 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
                        PROGRESS: <span className="text-foreground/70">{quest.progress?.current_count || 0}</span> / {quest.target_count}
                    </span>
                    <span className={cn("text-[10px] font-black tracking-widest tabular-nums", config.color)}>
                        {progressPct}%
                    </span>
                </div>
            </div>

            {/* Footer — QP + Duration + Team Progress */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/[0.03]">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Reward Pool</span>
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", config.color)}>
                        <Zap className="w-3.5 h-3.5 stroke-[2.5px]" />
                        {quest.qp_reward} QP
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Target Cycle</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <Clock className="w-3.5 h-3.5" />
                        {quest.duration_preset
                            ? DURATION_LABELS[quest.duration_preset] || quest.duration_preset
                            : "UNLIMITED"}
                    </div>
                </div>
            </div>

            {/* Sub-footer for Metadata */}
            <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex items-center gap-3">
                    {/* Time remaining */}
                    {quest.status === "ACTIVE" && quest.ends_at && (
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/60 leading-none">
                                {getTimeRemaining()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Team progress */}
                    <Users2 className="w-3 h-3 text-muted-foreground/30" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        PARTICIPANTS: <span className="text-muted-foreground/70">{quest.team_progress?.completed_count || 0}/{quest.team_progress?.total_participants || 0}</span>
                    </span>
                </div>
            </div>

            {/* Completed overlay */}
            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-2 right-2"
                >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <Trophy className="w-3 h-3 text-emerald-400" />
                    </div>
                </motion.div>
            )}
        </div>
    );
}
