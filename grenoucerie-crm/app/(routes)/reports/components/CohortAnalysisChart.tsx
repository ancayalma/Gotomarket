"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Grid3X3, Loader2, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CohortData {
    key: string;
    label: string;
    accountCount: number;
    months: Record<number, { value: number; pct: number }>;
}

export default function CohortAnalysisChart() {
    const [cohorts, setCohorts] = useState<CohortData[]>([]);
    const [loading, setLoading] = useState(true);
    const [metric, setMetric] = useState("deals");
    const [months, setMonths] = useState(12);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/reports/analytics/cohort?months=${months}&metric=${metric}`);
                setCohorts(data.cohorts);
            } catch { /* skip */ }
            setLoading(false);
        })();
    }, [metric, months]);

    // Generate month headers
    const monthHeaders = Array.from({ length: months }, (_, i) => `M${i}`);

    // Color scale for the heatmap
    const getColor = (pct: number, metricType: string) => {
        if (pct === 0) return "bg-white/5";
        if (metricType === "retention") {
            if (pct >= 80) return "bg-emerald-500/40 text-emerald-200";
            if (pct >= 60) return "bg-emerald-500/30 text-emerald-300";
            if (pct >= 40) return "bg-amber-500/30 text-amber-300";
            if (pct >= 20) return "bg-orange-500/30 text-orange-300";
            return "bg-red-500/20 text-red-300";
        }
        if (pct >= 75) return "bg-blue-500/40 text-blue-200";
        if (pct >= 50) return "bg-blue-500/30 text-blue-300";
        if (pct >= 25) return "bg-blue-500/20 text-blue-300";
        return "bg-blue-500/10 text-blue-400";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">Cohort Analysis</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={metric} onValueChange={setMetric}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="deals">Deals</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="retention">Retention</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={String(months)} onValueChange={v => setMonths(parseInt(v))}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                            <SelectItem value="24">24 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : cohorts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Not enough data for cohort analysis yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="text-left p-2 text-muted-foreground font-semibold sticky left-0 bg-card z-10">Cohort</th>
                                <th className="text-center p-2 text-muted-foreground w-12">#</th>
                                {monthHeaders.map(h => (
                                    <th key={h} className="text-center p-2 text-muted-foreground w-14">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cohorts.map(cohort => (
                                <tr key={cohort.key} className="border-t border-white/5">
                                    <td className="p-2 font-medium text-white sticky left-0 bg-card z-10 whitespace-nowrap">
                                        {cohort.label}
                                    </td>
                                    <td className="p-2 text-center">
                                        <Badge variant="outline" className="text-[9px]">{cohort.accountCount}</Badge>
                                    </td>
                                    {monthHeaders.map((_, mIdx) => {
                                        const cell = cohort.months[mIdx];
                                        if (!cell) return <td key={mIdx} className="p-1" />;
                                        return (
                                            <td key={mIdx} className="p-1">
                                                <div className={`rounded px-1.5 py-1 text-center text-[10px] font-mono ${getColor(cell.pct, metric)}`}>
                                                    {metric === "revenue"
                                                        ? cell.value >= 1000 ? `$${(cell.value / 1000).toFixed(0)}k` : `$${cell.value}`
                                                        : metric === "retention" ? `${cell.pct}%` : cell.value}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
