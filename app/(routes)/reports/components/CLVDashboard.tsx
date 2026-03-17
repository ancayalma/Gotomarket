"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    TrendingUp, Heart, DollarSign, Users, BarChart3, ArrowUpRight,
    ArrowDownRight, Loader2, Medal, Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AccountCLV {
    id: string;
    name: string;
    type: string | null;
    totalRevenue: number;
    dealCount: number;
    avgDealSize: number;
    tenureMonths: number;
    monthlyRate: number;
    annualValue: number;
    winRate: number;
    daysSinceLastDeal: number | null;
    healthScore: number;
    totalOpportunities: number;
}

interface Aggregate {
    totalCustomers: number;
    totalLifetimeValue: number;
    avgCLV: number;
    medianCLV: number;
    avgHealthScore: number;
    distribution: { q1: number; median: number; q3: number };
    paretoInsight: string;
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const healthColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 40) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
};

export default function CLVDashboard() {
    const [accounts, setAccounts] = useState<AccountCLV[]>([]);
    const [aggregate, setAggregate] = useState<Aggregate | null>(null);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("clv");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/reports/analytics/clv?limit=50&sort=${sort}`);
                setAccounts(data.accounts);
                setAggregate(data.aggregate);
            } catch { /* skip */ }
            setLoading(false);
        })();
    }, [sort]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">Customer Lifetime Value</h2>
                </div>
                <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="clv">Sort by CLV</SelectItem>
                        <SelectItem value="deals">Sort by Deals</SelectItem>
                        <SelectItem value="avg_deal">Sort by Avg Deal</SelectItem>
                        <SelectItem value="health">Sort by Health</SelectItem>
                        <SelectItem value="tenure">Sort by Tenure</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Aggregate Stats */}
            {aggregate && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={Users} label="Customers" value={String(aggregate.totalCustomers)} color="text-blue-400" />
                    <StatCard icon={DollarSign} label="Total LTV" value={formatCurrency(aggregate.totalLifetimeValue)} color="text-emerald-400" />
                    <StatCard icon={BarChart3} label="Avg CLV" value={formatCurrency(aggregate.avgCLV)} color="text-purple-400" />
                    <StatCard icon={Heart} label="Avg Health" value={`${aggregate.avgHealthScore}/100`} color="text-rose-400" />
                </div>
            )}

            {/* Pareto Insight */}
            {aggregate?.paretoInsight && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300 flex items-center gap-2">
                    <Medal className="w-4 h-4 shrink-0" />
                    {aggregate.paretoInsight}
                </div>
            )}

            {/* Accounts Table */}
            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="text-left p-3 text-muted-foreground">Account</th>
                            <th className="text-right p-3 text-muted-foreground">Lifetime Value</th>
                            <th className="text-center p-3 text-muted-foreground">Deals</th>
                            <th className="text-right p-3 text-muted-foreground">Avg Deal</th>
                            <th className="text-right p-3 text-muted-foreground hidden md:table-cell">Annual Rate</th>
                            <th className="text-center p-3 text-muted-foreground hidden lg:table-cell">Win Rate</th>
                            <th className="text-center p-3 text-muted-foreground">Health</th>
                            <th className="text-center p-3 text-muted-foreground hidden md:table-cell">Tenure</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((a, idx) => (
                            <tr key={a.id} className="border-t border-white/5 hover:bg-white/5 transition">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground font-mono w-5 text-right">{idx + 1}.</span>
                                        <div>
                                            <div className="font-medium text-white">{a.name}</div>
                                            {a.type && <div className="text-[10px] text-muted-foreground">{a.type}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-white">{formatCurrency(a.totalRevenue)}</td>
                                <td className="p-3 text-center">
                                    <Badge variant="outline" className="text-[10px]">{a.dealCount}/{a.totalOpportunities}</Badge>
                                </td>
                                <td className="p-3 text-right font-mono text-muted-foreground">{formatCurrency(a.avgDealSize)}</td>
                                <td className="p-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                                    <div className="flex items-center justify-end gap-1">
                                        {a.annualValue > a.avgDealSize
                                            ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                            : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                                        {formatCurrency(a.annualValue)}
                                    </div>
                                </td>
                                <td className="p-3 text-center hidden lg:table-cell">
                                    <span className={a.winRate >= 50 ? "text-emerald-400" : "text-amber-400"}>{a.winRate}%</span>
                                </td>
                                <td className="p-3 text-center">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${healthColor(a.healthScore)}`}>
                                        <Activity className="w-3 h-3" />
                                        {a.healthScore}
                                    </div>
                                </td>
                                <td className="p-3 text-center text-muted-foreground hidden md:table-cell">
                                    {a.tenureMonths}mo
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    );
}
