"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, DollarSign, TrendingUp, Users2, Zap, HardDrive, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
    DollarSign, TrendingUp, Users2, Zap, HardDrive, Target,
};

export type MetricAccent = "cyan" | "violet" | "emerald" | "amber" | "rose";

interface UnifiedMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    iconName: string;
    accentColor?: MetricAccent;
    delay?: number;
}

const accentStyles = {
    cyan: {
        gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
        border: "border-cyan-500/20 hover:border-cyan-400/40",
        glow: "shadow-cyan-500/10 hover:shadow-cyan-500/20",
        icon: "text-cyan-400",
        iconBg: "bg-cyan-500/10 ring-1 ring-cyan-500/20",
        valueTint: "text-cyan-50",
    },
    violet: {
        gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
        border: "border-violet-500/20 hover:border-violet-400/40",
        glow: "shadow-violet-500/10 hover:shadow-violet-500/20",
        icon: "text-violet-400",
        iconBg: "bg-violet-500/10 ring-1 ring-violet-500/20",
        valueTint: "text-violet-50",
    },
    emerald: {
        gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
        border: "border-emerald-500/20 hover:border-emerald-400/40",
        glow: "shadow-emerald-500/10 hover:shadow-emerald-500/20",
        icon: "text-emerald-400",
        iconBg: "bg-emerald-500/10 ring-1 ring-emerald-500/20",
        valueTint: "text-emerald-50",
    },
    amber: {
        gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
        border: "border-amber-500/20 hover:border-amber-400/40",
        glow: "shadow-amber-500/10 hover:shadow-amber-500/20",
        icon: "text-amber-400",
        iconBg: "bg-amber-500/10 ring-1 ring-amber-500/20",
        valueTint: "text-amber-50",
    },
    rose: {
        gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
        border: "border-rose-500/20 hover:border-rose-400/40",
        glow: "shadow-rose-500/10 hover:shadow-rose-500/20",
        icon: "text-rose-400",
        iconBg: "bg-rose-500/10 ring-1 ring-rose-500/20",
        valueTint: "text-rose-50",
    },
};

function useCountUp(end: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const rafRef = useRef<number>(undefined);

    useEffect(() => {
        if (end === 0) { setCount(0); return; }
        const start = 0;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + (end - start) * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [end, duration]);

    return count;
}

export function UnifiedMetricCard({
    title,
    value,
    subtitle,
    iconName,
    accentColor = "cyan",
    delay = 0,
}: UnifiedMetricCardProps) {
    const s = accentStyles[accentColor];
    const Icon = iconMap[iconName] || DollarSign;

    // Extract numeric for count-up animation
    const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    const isNumeric = !isNaN(numericValue) && typeof value === "number";
    const animatedCount = useCountUp(isNumeric ? numericValue : 0);

    // Format matching the original value display
    const displayPrefix = typeof value === "string" && value.startsWith("$") ? "$" : "";
    const displaySuffix = typeof value === "string" && value.endsWith("%") ? "%" : "";
    const displayValue = isNumeric
        ? `${displayPrefix}${animatedCount.toLocaleString()}${displaySuffix}`
        : value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-default",
                "bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl",
                "shadow-lg hover:shadow-xl hover:scale-[1.02]",
                s.border, s.glow
            )}
        >
            {/* Gradient overlay */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", s.gradient)} />

            {/* Ambient glow on hover */}
            <div className={cn(
                "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none",
                accentColor === "cyan" && "bg-cyan-500",
                accentColor === "violet" && "bg-violet-500",
                accentColor === "emerald" && "bg-emerald-500",
                accentColor === "amber" && "bg-amber-500",
                accentColor === "rose" && "bg-rose-500"
            )} />

            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">{title}</p>
                    <h3 className={cn("text-3xl font-black tracking-tight", s.valueTint)}>
                        {displayValue}
                    </h3>
                    {subtitle && (
                        <p className="text-[11px] text-white/30 font-medium">{subtitle}</p>
                    )}
                </div>
                <div className={cn("rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110", s.iconBg)}>
                    <Icon className={cn("h-5 w-5", s.icon)} />
                </div>
            </div>
        </motion.div>
    );
}
