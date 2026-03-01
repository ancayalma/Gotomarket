
"use client";

import React, { useState, useEffect } from "react";
import { getSalesAnalytics } from "@/actions/analytics/get-sales-stats";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    PieChart,
    Pie
} from "recharts";
import {
    TrendingUp,
    DollarSign,
    Zap,
    Target,
    Timer,
    ArrowUpRight,
    Percent,
    ChevronRight,
    Milestone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SuspenseLoading from "@/components/loadings/suspense";

export default function SalesInsights() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const res = await getSalesAnalytics();
            setData(res);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <SuspenseLoading />;
    if (!data) return <div className="p-10 text-center">No sales data available. Begin by adding opportunities.</div>;

    const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

    return (
        <div className="space-y-8 p-1 animate-in fade-in duration-500">
            {/* Top Grid: Value Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-indigo-500/10 via-background to-background">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <DollarSign className="w-24 h-24 text-indigo-500" />
                    </div>
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-indigo-500">Total Pipeline</CardDescription>
                        <CardTitle className="text-3xl font-black italic tracking-tighter">
                            ${data.totalPipelineValue.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span>Weighted: ${Math.round(data.weightedPipelineValue).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-500/10 via-background to-background">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-emerald-500">Win Rate</CardDescription>
                        <CardTitle className="text-3xl font-black italic tracking-tighter">
                            {Math.round(data.winRate)}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            <span>Total Won: ${data.totalWonValue.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-orange-500/10 via-background to-background">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-orange-500">Sales Velocity</CardDescription>
                        <CardTitle className="text-3xl font-black italic tracking-tighter">
                            {data.avgCyclesDays || 0}d
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <Timer className="w-3 h-3 text-orange-500" />
                            <span>Avg. Days to Close</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-purple-500/10 via-background to-background">
                    <CardHeader className="py-4">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-purple-500">Active Deals</CardDescription>
                        <CardTitle className="text-3xl font-black italic tracking-tighter">
                            {data.counts.active}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                            <Target className="w-3 h-3 text-purple-500" />
                            <span>Won: {data.counts.won} | Lost: {data.counts.lost}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline Funnel */}
                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Pipeline Funnel</CardTitle>
                                <CardDescription>Deal distribution across sales stages</CardDescription>
                            </div>
                            <Milestone className="w-5 h-5 text-indigo-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.stageBreakdown} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="stage"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    style={{ fontSize: "10px", fontWeight: "bold" }}
                                />
                                <Tooltip
                                    cursor={{ fill: "#6366f110" }}
                                    contentStyle={{ borderRadius: "12px", border: "1px solid #88888830" }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {data.stageBreakdown.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Deal Health Pie */}
                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Deal Health</CardTitle>
                                <CardDescription>Comparison of Won vs. Lost outcomes</CardDescription>
                            </div>
                            <Percent className="w-5 h-5 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Won', value: data.counts.won },
                                        { name: 'Lost', value: data.counts.lost },
                                        { name: 'Active', value: data.counts.active },
                                    ]}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f43f5e" />
                                    <Cell fill="#6366f1" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black">{Math.round(data.winRate)}%</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Win Rate</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Detailed Stage Table */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Stage Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {data.stageBreakdown.map((stage: any, i: number) => (
                            <div key={stage.stage} className="p-4 rounded-xl border border-border/50 bg-muted/20">
                                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stage.stage}</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-xl font-black">${stage.value.toLocaleString()}</span>
                                    <span className="text-xs text-muted-foreground font-bold">({stage.count})</span>
                                </div>
                                <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500"
                                        style={{ width: `${(stage.value * 100) / data.totalPipelineValue}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
