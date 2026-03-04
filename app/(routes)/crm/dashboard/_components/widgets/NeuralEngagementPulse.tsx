"use client";

import React, { useMemo } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import {
    Activity,
    Flame,
    Zap,
    TrendingUp,
    Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDashboardData } from "../../_context/DashboardDataContext";

/**
 * NeuralEngagementPulse
 * A high-intensity activity heatmap powered by real system activity logs.
 * Optimized for full visibility in a col-span-2 container.
 */

export const NeuralEngagementPulse = () => {
    const { engagementPulse } = useDashboardData();

    // Stats Calculation
    const stats = useMemo(() => {
        if (!engagementPulse || engagementPulse.length === 0) return { velocity: 0, momentum: "0d", avgPulse: 0 };

        const total = engagementPulse.reduce((acc, day) => acc + day.count, 0);
        const avgPulse = Math.round(total / engagementPulse.length) || 0;

        // Find last active day
        const activeDays = [...engagementPulse].reverse();
        const lastActive = activeDays.find(d => d.count > 0);
        const momentumDays = lastActive
            ? Math.floor((new Date().getTime() - new Date(lastActive.date).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            velocity: total,
            momentum: `${momentumDays}d`,
            avgPulse: avgPulse
        };
    }, [engagementPulse]);

    const getColorClass = (count: number) => {
        if (count === 0) return "bg-muted border-border";
        if (count < 3) return "bg-emerald-950 border-emerald-900/50";
        if (count < 8) return "bg-emerald-800 border-emerald-700/50";
        if (count < 15) return "bg-emerald-500 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
        return "bg-emerald-400 border-border shadow-[0_0_20px_rgba(52,211,153,0.5)] brightness-125";
    };

    return (
        <WidgetWrapper
            title="Neural Engagement Pulse"
            icon={Activity}
            iconColor="text-emerald-400"
        // Removed custom height class to match default [400px] of other containers
        >
            <div className="pt-4 h-full flex flex-col justify-between">
                {/* Visual Stats Block - Slightly more compact */}
                <div className="flex items-center gap-8 mb-4 px-2">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1">Velocity</p>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">
                            {(stats.velocity || 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="space-y-1 border-l border-border pl-8">
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1 flex items-center gap-1.5">
                            <Flame size={9} className="text-orange-500" /> Momentum
                        </p>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">
                            {stats.momentum || "0d"}
                        </p>
                    </div>

                    <div className="space-y-1 border-l border-border pl-8">
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1 text-primary">Avg Pulse</p>
                        <p className="text-2xl font-black text-foreground tracking-tighter italic">
                            {stats.avgPulse || 0}
                        </p>
                    </div>
                </div>

                {/* The "Command Grid" - Optimized Density */}
                <div className="flex-1 bg-background/60 rounded-xl border border-border p-4 mb-3 flex items-center justify-center relative overflow-hidden">
                    {/* Neural Net Ambient Background */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />

                    <div className="relative grid grid-rows-7 grid-flow-col gap-1.5">
                        <TooltipProvider delayDuration={0}>
                            {engagementPulse?.map((day: any, idx: number) => (
                                <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.0005 }}
                                            className={cn(
                                                "w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-[2px] border transition-all duration-200 cursor-crosshair hover:scale-[1.6] hover:z-50 hover:brightness-125 hover:shadow-[0_0_15px_currentColor]",
                                                getColorClass(day.count)
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="bg-card border-emerald-500/30 text-card-foreground p-2.5 rounded-lg shadow-2xl backdrop-blur-2xl z-[100]"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 border-b border-border pb-1 mb-1">
                                                <Calendar size={10} className="text-emerald-500" />
                                                <p className="text-[9px] font-bold uppercase tracking-widest leading-none">
                                                    {day.date ? format(new Date(day.date), "EEE, MMM do") : "---"}
                                                </p>
                                            </div>
                                            <p className="text-[11px] font-black flex items-center gap-1.5">
                                                <Zap size={10} className="text-emerald-400 fill-emerald-400" />
                                                {day.count} <span className="text-foreground/40 text-[9px] uppercase tracking-tighter">Neural Signals</span>
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                    </div>
                </div>

                {/* Footer Labels - Compact */}
                <div className="flex items-center justify-between px-2 pb-1">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {[0, 2, 8, 15].map((v, i) => (
                                <div key={i} className={cn("w-2 h-2 rounded-[1px] border border-border", getColorClass(v))} />
                            ))}
                        </div>
                        <span className="text-[8px] font-black text-foreground/20 uppercase tracking-[0.2em] ml-1">Density Calibration</span>
                    </div>
                    <div className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest italic flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Neural Data Synced
                    </div>
                </div>
            </div>
        </WidgetWrapper>
    );
};

