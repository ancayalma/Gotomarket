"use client";

import React from "react";
import DashboardCard from "../DashboardCard";
import {
    BarChart3,
    TrendingUp,
    Activity,
    Gauge as GaugeIcon,
    Users,
    DollarSign,
    Target,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomMetricWidgetProps {
    data: {
        name: string;
        icon: string;
        color: string;
        chartType: string;
        targetValue?: number;
        value: number;
        trend?: number;
    };
}

const ICON_MAP: Record<string, any> = {
    BarChart3,
    TrendingUp,
    Activity,
    Gauge: GaugeIcon,
    Users,
    DollarSign,
    Target
};

export const CustomMetricWidget = ({ data }: CustomMetricWidgetProps) => {
    const Icon = ICON_MAP[data.icon] || BarChart3;
    const isOverTarget = data.targetValue ? data.value >= data.targetValue : false;

    // Formatting the value
    const formattedValue = typeof data.value === 'number'
        ? data.value > 1000
            ? `$${(data.value / 1000).toFixed(1)}k`
            : data.value.toString()
        : data.value;

    if (data.chartType === "GAUGE") {
        const percentage = data.targetValue ? Math.min((data.value / data.targetValue) * 100, 100) : 0;
        return (
            <div className="p-6 rounded-[32px] border border-white/10 bg-[#0a0a0a] relative group overflow-hidden h-full shadow-xl">
                <div className="flex flex-col h-full bg-gradient-to-br from-white/[0.03] to-transparent p-1 rounded-[24px]">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">{data.name}</span>
                        <div className={cn("p-2 rounded-xl", `bg-${data.color}-500/20 text-${data.color}-400`)}>
                            <Icon size={16} />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-black text-white">{formattedValue}</span>
                            {data.targetValue && (
                                <span className="text-[10px] font-bold text-white/20">/ goal {data.targetValue}</span>
                            )}
                        </div>

                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-colors duration-1000", `bg-${data.color}-500`)}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (data.chartType === "SPARKLINE") {
        return (
            <div className="p-6 rounded-[32px] border border-white/10 bg-[#0a0a0a] relative group overflow-hidden h-full shadow-xl">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">{data.name}</span>
                        <Icon size={14} className="text-white/20" />
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl font-black text-white">{formattedValue}</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <ArrowUp size={10} /> 12%
                        </div>
                    </div>

                    <div className="mt-auto h-12 w-full flex items-end gap-1">
                        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1, 0.7, 0.9, 0.8].map((h, i) => (
                            <div
                                key={i}
                                className={cn("flex-1 rounded-t-sm transition-colors duration-500", `bg-${data.color}-500/40`)}
                                style={{ height: `${h * 100}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DashboardCard
            icon={Icon}
            label={data.name}
            count={formattedValue}
            description={data.targetValue ? `Target: ${data.targetValue}` : "Real-time metric"}
            variant={data.color as any}
        />
    );
};
