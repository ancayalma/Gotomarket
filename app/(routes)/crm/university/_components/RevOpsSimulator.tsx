"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Card,
    Title,
    AreaChart,
    Metric,
    Text,
    Flex,
    Divider,
    CategoryBar,
} from "@tremor/react";
import {
    TrendingUp,
    Users,
    Clock,
    Zap,
    ArrowRight,
    DollarSign,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevOpsSimulator() {
    // Current Baseline
    const [arr, setArr] = useState(500000);
    const [teamSize, setTeamSize] = useState(5);
    const [leadsPerMonth, setLeadsPerMonth] = useState(200);
    const [closeRate, setCloseRate] = useState(15); // Percentage
    const [dataHealth, setDataHealth] = useState(60); // 0-100%

    // "What-if" improvements (multipliers/percentages)
    const [aiEfficiency, setAiEfficiency] = useState(20); // 0-100% boost in efficiency
    const [speedToLeadBoost, setSpeedToLeadBoost] = useState(15); // 0-50% improvement in close rate due to speed

    const results = useMemo(() => {
        // Data health impacts how many leads are actually 'pursuable'
        const effectiveLeads = leadsPerMonth * (0.5 + (dataHealth / 200));

        const baselineCloseRate = closeRate / 100;
        const improvedCloseRate = baselineCloseRate * (1 + (speedToLeadBoost / 100));

        const baselineDeals = effectiveLeads * baselineCloseRate;
        const improvedDeals = effectiveLeads * improvedCloseRate;

        const avgDealValue = arr / (baselineDeals * 12 || 1);

        const baselineAnnRevenue = baselineDeals * avgDealValue * 12;
        const improvedAnnRevenue = improvedDeals * avgDealValue * 12;

        const revenueLift = improvedAnnRevenue - baselineAnnRevenue;
        const timeSavedHours = teamSize * 40 * 0.1 * (aiEfficiency / 10);

        return {
            baselineAnnRevenue,
            improvedAnnRevenue,
            revenueLift,
            revenueLiftPct: ((improvedAnnRevenue / baselineAnnRevenue) - 1) * 100,
            timeSavedHours: Math.round(timeSavedHours),
            roiMultiplier: (revenueLift / 5000).toFixed(1)
        };
    }, [arr, leadsPerMonth, closeRate, dataHealth, aiEfficiency, speedToLeadBoost, teamSize]);

    const chartData = useMemo(() => {
        return [
            { month: "Current", Revenue: results.baselineAnnRevenue },
            { month: "Month 3", Revenue: results.baselineAnnRevenue + (results.revenueLift * 0.3) },
            { month: "Month 6", Revenue: results.baselineAnnRevenue + (results.revenueLift * 0.6) },
            { month: "Month 9", Revenue: results.baselineAnnRevenue + (results.revenueLift * 0.8) },
            { month: "Optimized", Revenue: results.improvedAnnRevenue },
        ];
    }, [results]);

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inputs */}
                <Card className="bg-card border-border ring-0 shadow-sm space-y-6">
                    <div>
                        <Title className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Baseline Metrics</Title>
                        <div className="space-y-4">
                            <InputRange
                                label="Annual Revenue"
                                value={arr}
                                min={100000}
                                max={5000000}
                                step={50000}
                                formatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                onChange={(val) => setArr(val)}
                            />
                            <InputRange
                                label="Lead Volume / Mo"
                                value={leadsPerMonth}
                                min={10}
                                max={1000}
                                step={10}
                                onChange={(val) => setLeadsPerMonth(val)}
                            />
                            <InputRange
                                label="Team Size"
                                value={teamSize}
                                min={1}
                                max={50}
                                step={1}
                                onChange={(val) => setTeamSize(val)}
                            />
                        </div>
                    </div>

                    <Divider />

                    <div>
                        <Title className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">Optimization Levers</Title>
                        <div className="space-y-4">
                            <InputRange
                                label="Data Health & Enrichment"
                                value={dataHealth}
                                min={0}
                                max={100}
                                step={5}
                                formatter={(val) => `${val}% Accuracy`}
                                color="emerald"
                                onChange={(val) => setDataHealth(val)}
                            />
                            <InputRange
                                label="AI Efficiency Gains"
                                value={aiEfficiency}
                                min={0}
                                max={100}
                                step={5}
                                formatter={(val) => `+${val}% Output`}
                                color="blue"
                                onChange={(val) => setAiEfficiency(val)}
                            />
                            <InputRange
                                label="Speed-to-Lead Impact"
                                value={speedToLeadBoost}
                                min={0}
                                max={50}
                                step={1}
                                formatter={(val) => `+${val}% Close Rate`}
                                color="violet"
                                onChange={(val) => setSpeedToLeadBoost(val)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Results & Projections */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResultCard
                            title="Annual Revenue Lift"
                            metric={`+$${(results.revenueLift / 1000).toFixed(1)}k`}
                            icon={DollarSign}
                            color="text-emerald-400"
                        />
                        <ResultCard
                            title="Monthly Hours Saved"
                            metric={`${results.timeSavedHours}h`}
                            icon={Clock}
                            color="text-blue-400"
                        />
                        <ResultCard
                            title="Close Rate Improvement"
                            metric={`${results.revenueLiftPct.toFixed(1)}%`}
                            icon={Target}
                            color="text-violet-400"
                        />
                        <ResultCard
                            title="Est. ROI Multiplier"
                            metric={`${results.roiMultiplier}x`}
                            icon={Zap}
                            color="text-amber-400"
                        />
                    </div>

                    <Card className="bg-card border-border ring-0 shadow-sm">
                        <Title className="text-foreground">Projected Growth Path</Title>
                        <AreaChart
                            className="h-72 mt-4"
                            data={chartData}
                            index="month"
                            categories={["Revenue"]}
                            colors={["emerald"]}
                            valueFormatter={(number: number) => `$${(number / 1000).toFixed(0)}k`}
                            showAnimation={true}
                            showYAxis={false}
                            showXAxis={true}
                            showGridLines={false}
                            startEndOnly={true}
                        />
                    </Card>

                    {/* New Integrated Performance Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-card border-border ring-0 shadow-sm">
                            <Title className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">System Performance Baseline</Title>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Flex>
                                        <Text className="text-xs">Data Cleanliness</Text>
                                        <Text className="text-xs font-bold text-emerald-400">{dataHealth}%</Text>
                                    </Flex>
                                    <CategoryBar
                                        values={[40, 30, 30]}
                                        colors={["rose", "amber", "emerald"]}
                                        markerValue={dataHealth}
                                        showLabels={false}
                                        className="h-2.5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Flex>
                                        <Text className="text-xs">Enrichment Match Rate</Text>
                                        <Text className="text-xs font-bold text-blue-400">82%</Text>
                                    </Flex>
                                    <CategoryBar
                                        values={[30, 40, 30]}
                                        colors={["rose", "amber", "emerald"]}
                                        markerValue={82}
                                        showLabels={false}
                                        className="h-2.5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Flex>
                                        <Text className="text-xs">Lead Velocity Score</Text>
                                        <Text className="text-xs font-bold text-violet-400">High</Text>
                                    </Flex>
                                    <CategoryBar
                                        values={[20, 30, 50]}
                                        colors={["rose", "amber", "emerald"]}
                                        markerValue={85}
                                        showLabels={false}
                                        className="h-2.5"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-card border-border ring-0 shadow-sm">
                            <Title className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Strategic Action Items</Title>
                            <div className="space-y-3">
                                {[
                                    { text: "Improve phone number coverage by 15%", color: "text-blue-400" },
                                    { text: "Automate LinkedIn persona matching", color: "text-emerald-400" },
                                    { text: "Reduce first-response time to < 2min", color: "text-violet-400" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                                        <div className={cn("w-1 h-1 rounded-full bg-current", item.color)} />
                                        <Text className="text-xs text-gray-300">{item.text}</Text>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <Text className="text-sm text-gray-300">Scaling these efficiencies across your entire CRM can yield up to <span className="text-blue-400 font-bold">2.5x</span> better data utilization.</Text>
                        </div>
                        <button className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-400 transition-colors">Apply Strategy</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputRange({ label, value, min, max, step, formatter, color = "slate", onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    formatter?: (val: number) => string;
    color?: string;
    onChange: (val: number) => void;
}) {
    return (
        <div className="space-y-2">
            <Flex>
                <Text className="text-xs font-medium text-gray-400">{label}</Text>
                <Text className={cn("text-xs font-bold", `text-${color}-400`)}>{formatter ? formatter(value) : value}</Text>
            </Flex>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
}

function ResultCard({ title, metric, icon: Icon, color }: { title: string; metric: string; icon: any; color: string }) {
    return (
        <Card className="bg-card border-border ring-0 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className={cn("w-12 h-12", color)} />
            </div>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</Text>
            <Metric className={cn("text-2xl font-black mt-1", color)}>{metric}</Metric>
        </Card>
    );
}
