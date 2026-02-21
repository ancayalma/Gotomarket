"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users2, Activity } from "lucide-react";
import DashboardCard from "../DashboardCard";
import { useRouter } from "next/navigation";
import { getRevenueSparkline } from "@/actions/dashboard/get-revenue-sparkline";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

// --- REVENUE WIDGET ---
import { MetricDeepDiveWidget } from "./MetricDeepDiveWidget";

export const RevenueWidget = ({ revenue, teamData }: { revenue: number, teamData?: any }) => {
    const router = useRouter();
    const [sparklineData, setSparklineData] = useState<any[]>([]);

    useEffect(() => {
        const fetchSparkline = async () => {
            const data = await getRevenueSparkline();
            setSparklineData(data.map((v, i) => ({ value: v, id: i })));
        };
        fetchSparkline();
    }, []);

    const leaderboard = teamData?.leaderboard || [];

    return (
        <MetricDeepDiveWidget
            title="Projected Revenue"
            value={revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            description="Total value of all active deals"
            icon={DollarSign}
            iconColor="text-emerald-400"
            variant="success"
            centered={true}
            deepDiveTitle="Revenue Leaderboard"
            deepDiveData={leaderboard}
            deepDiveColumns={[
                { header: "User", key: "name" },
                { header: "Points", key: "points" },
                {
                    header: "Closed Deals",
                    key: "closedCount",
                    render: (val) => <span className="text-emerald-400 font-bold">{val}</span>
                },
                {
                    header: "Progress",
                    key: "points",
                    render: (val) => (
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (val / 1000) * 100)}%` }} />
                        </div>
                    )
                }
            ]}
        />
    );
};

// --- ACTIVE PIPELINE WIDGET ---
export const ActivePipelineWidget = ({ count, description, teamData }: { count: number; description: string, teamData?: any }) => {
    const stageData = teamData?.team?.stageCounts ? Object.entries(teamData.team.stageCounts).map(([stage, count]) => ({
        stage: stage.replace("_", " "),
        count: count
    })) : [];

    return (
        <MetricDeepDiveWidget
            title="Active Pipeline"
            value={count}
            description={description}
            icon={TrendingUp}
            iconColor="text-cyan-400"
            variant="info"
            centered={true}
            deepDiveTitle="Pipeline Distribution"
            deepDiveData={stageData}
            deepDiveColumns={[
                { header: "Sales Stage", key: "stage" },
                {
                    header: "Lead Count",
                    key: "count",
                    render: (val) => <span className="text-cyan-400 font-bold">{val}</span>
                },
                {
                    header: "Velocity",
                    key: "count",
                    render: (val: any) => (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TrendingUp size={12} className="text-emerald-400" />
                            Good
                        </div>
                    )
                }
            ]}
        />
    );
};

// --- ACTIVE USERS WIDGET ---
export const ActiveUsersWidget = ({ count, teamData }: { count: number, teamData?: any }) => {
    const users = teamData?.leaderboard || [];

    return (
        <MetricDeepDiveWidget
            title="Active Users"
            value={count}
            description="Team members active"
            icon={Users2}
            iconColor="text-violet-400"
            variant="violet"
            centered={true}
            deepDiveTitle="Team Performance"
            deepDiveData={users}
            deepDiveColumns={[
                { header: "Member", key: "name" },
                { header: "Email", key: "email" },
                {
                    header: "Activity Score",
                    key: "points",
                    render: (val) => <span className="text-violet-400 font-bold">{val} pts</span>
                }
            ]}
        />
    );
};

// --- SYSTEM HEALTH WIDGET ---
export const SystemHealthWidget = () => {
    return (
        <MetricDeepDiveWidget
            title="System Health"
            value="100%"
            description="All Systems Operational"
            icon={Activity}
            iconColor="text-emerald-400"
            variant="success"
            centered={true}
            deepDiveTitle="System Diagnostics"
            deepDiveData={[
                { service: "API Engine", status: "Operational", latency: "24ms" },
                { service: "Database Cluster", status: "Operational", latency: "8ms" },
                { service: "AI Neural Engine", status: "Operational", latency: "142ms" },
                { service: "Mail Node", status: "Operational", latency: "94ms" },
            ]}
            deepDiveColumns={[
                { header: "Service Component", key: "service" },
                {
                    header: "Status",
                    key: "status",
                    render: (val) => (
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            val === "Operational" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                            {val}
                        </span>
                    )
                },
                { header: "Latency", key: "latency" }
            ]}
        />
    );
};
