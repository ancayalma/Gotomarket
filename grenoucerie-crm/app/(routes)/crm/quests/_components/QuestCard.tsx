"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Sword, Clock, Users2, Zap, Trophy, Crown, Flame, Target,
    ChevronRight, MoreVertical, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestWithProgress } from "@/actions/quests/types";
import QuestProgressBar from "./QuestProgressBar";
import BadgeSVG from "@/components/ui/BadgeSVG";

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; gradient: string; ring: string; icon: any }> = {
    EASY: {
        label: "Easy",
        color: "text-emerald-600 dark:text-emerald-400",
        gradient: "from-emerald-500/15 to-green-500/10",
        ring: "ring-emerald-500/20",
        icon: Target,
    },
    MEDIUM: {
        label: "Medium",
        color: "text-amber-600 dark:text-amber-400",
        gradient: "from-amber-500/15 to-yellow-500/10",
        ring: "ring-amber-500/20",
        icon: Sword,
    },
    HARD: {
        label: "Hard",
        color: "text-rose-600 dark:text-rose-400",
        gradient: "from-rose-500/15 to-red-500/10",
        ring: "ring-rose-500/20",
        icon: Flame,
    },
    LEGENDARY: {
        label: "Legendary",
        color: "text-violet-600 dark:text-violet-300",
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
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleAcceptQuest = async () => {
        setIsAccepting(true);
        try {
            const { acceptQuest } = await import("@/actions/quests/accept-quest");
            await acceptQuest(quest.id);
            onStatusChange(); // trigger refresh
        } catch (e) {
            console.error("Failed to accept quest:", e);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDeleteQuest = async () => {
        if (!isAdmin || isDeleting) return;
        if (!confirm("Are you sure you want to delete this quest? All progress will be lost.")) return;
        
        setIsDeleting(true);
        try {
            const { deleteQuest } = await import("@/actions/quests/delete-quest");
            await deleteQuest(quest.id);
            onStatusChange(); // trigger refresh
        } catch (e) {
            console.error("Failed to delete quest:", e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 transition-all duration-500",
                "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:scale-[1.02] hover:bg-card hover:border-border",
                isCompleted && "opacity-60 grayscale-[0.2]",
                quest.difficulty === "LEGENDARY" && "ring-1 ring-violet-500/30"
            )}
        >
            {/* Difficulty Badge - Top Left */}
            <div className="flex items-center justify-between mb-4">
                <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border backdrop-blur-md",
                    config.color,
                    quest.difficulty === "EASY" && "border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/5",
                    quest.difficulty === "MEDIUM" && "border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5",
                    quest.difficulty === "HARD" && "border-rose-500/20 bg-rose-500/10 dark:bg-rose-500/5",
                    quest.difficulty === "LEGENDARY" && "border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/5"
                )}>
                    <DifficultyIcon className="w-3 h-3 stroke-[3px]" />
                    {config.label}
                </span>

                {/* Status & Actions for admins */}
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleStatus}
                            disabled={isToggling}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all duration-300",
                                quest.status === "ACTIVE" && "border-emerald-500/20 text-emerald-400/70 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-400",
                                quest.status === "DRAFT" && "border-border text-foreground/40 bg-muted/20 hover:bg-muted/40",
                                quest.status === "COMPLETED" && "border-blue-500/20 text-blue-400/70 bg-blue-500/5",
                                quest.status === "ARCHIVED" && "border-border text-foreground/20 bg-muted/10",
                                isToggling && "opacity-50 cursor-wait"
                            )}
                        >
                            {quest.status}
                        </button>
                        <button 
                            onClick={handleDeleteQuest}
                            disabled={isDeleting}
                            className="p-1 rounded-md text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete Quest"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Title + Description + Optional Custom Badge */}
            <div className="flex gap-4 items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-1 italic uppercase">{quest.title}</h3>
                    {quest.description && (
                        <p className="text-[11px] text-muted-foreground/60 font-medium line-clamp-2 leading-relaxed">{quest.description}</p>
                    )}
                </div>
                
                {/* Huge Badge Showcase on Card */}
                {quest.badge_dna && (
                    <div className="flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent ring-1 ring-white/10" title={quest.badge_name}>
                        <div className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <BadgeSVG dna={quest.badge_dna as any} size={48} />
                        </div>
                    </div>
                )}
            </div>

            {/* Progress or Accept Action */}
            <div className="space-y-2.5 mb-5 relative min-h-[32px]">
                {quest.progress ? (
                    <>
                        <QuestProgressBar
                            current={quest.progress.current_count}
                            target={quest.target_count}
                            difficulty={quest.difficulty}
                            isCompleted={isCompleted}
                        />
                        <div className="flex items-center justify-between mt-1 px-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 tabular-nums">
                                PROGRESS: <span className="text-foreground/70">{quest.progress.current_count}</span> / {quest.target_count}
                            </span>
                            <span className={cn("text-[10px] font-black tracking-widest tabular-nums", config.color)}>
                                {progressPct}%
                            </span>
                        </div>
                    </>
                ) : (
                    <button 
                        onClick={handleAcceptQuest}
                        disabled={isAccepting || quest.status !== "ACTIVE"}
                        className="w-full flex items-center justify-center py-2.5 rounded-xl border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/40 transition-all font-black uppercase tracking-[0.15em] text-[10px]"
                    >
                        {isAccepting ? "Accepting..." : quest.status !== "ACTIVE" ? "Not Available" : "Accept Quest"}
                    </button>
                )}
            </div>

            {/* Footer — QP + Duration + Team Progress */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Reward Pool</span>
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", config.color)}>
                        <Zap className="w-3.5 h-3.5 stroke-[2.5px]" />
                        {quest.qp_reward} QP · {quest.xp_reward} XP
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
                        PARTICIPANTS: <span className="text-muted-foreground/70">{quest.team_progress?.accepted_count || 0}/{quest.team_progress?.total_participants || 0}</span>
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
