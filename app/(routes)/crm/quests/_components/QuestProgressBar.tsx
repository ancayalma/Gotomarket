"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuestProgressBarProps {
    current: number;
    target: number;
    difficulty: string;
    isCompleted: boolean;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; fill: string; glow: string }> = {
    EASY: { bg: "bg-emerald-500/10", fill: "bg-emerald-500", glow: "shadow-emerald-500/30" },
    MEDIUM: { bg: "bg-amber-500/10", fill: "bg-amber-500", glow: "shadow-amber-500/30" },
    HARD: { bg: "bg-rose-500/10", fill: "bg-rose-500", glow: "shadow-rose-500/30" },
    LEGENDARY: { bg: "bg-violet-500/10", fill: "bg-gradient-to-r from-violet-500 to-purple-500", glow: "shadow-violet-500/30" },
};

export default function QuestProgressBar({ current, target, difficulty, isCompleted }: QuestProgressBarProps) {
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    const colors = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.MEDIUM;

    return (
        <div className={cn("w-full h-2 rounded-full overflow-hidden", colors.bg)}>
            <motion.div
                className={cn(
                    "h-full rounded-full",
                    colors.fill,
                    isCompleted && "shadow-lg",
                    isCompleted && colors.glow
                )}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2,
                }}
            />
        </div>
    );
}
