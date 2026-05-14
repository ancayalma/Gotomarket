"use client";

import React from "react";
import { useSalesCommand } from "./SalesCommandProvider";
import { UnifiedMetricCard } from "./UnifiedMetricCard";
import MyCommandView from "./MyCommandView";
import TeamCommandView from "./TeamCommandView";
import { motion } from "framer-motion";
import { Radio, RefreshCw, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { EnhancedDateFilter } from "@/components/date-filter/EnhancedDateFilter";

export default function SalesCommandDashboard() {
    const { data, viewMode, setViewMode, isManager, selectedUserData, isMember, refreshData, isRefreshing } = useSalesCommand();
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    });

    const fromStr = dateRange.from?.toISOString();
    const toStr = dateRange.to?.toISOString();

    React.useEffect(() => {
        refreshData(dateRange.from, dateRange.to);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromStr, toStr, refreshData]);

    const { summary, userData } = data;

    return (
        <div className="relative min-h-screen">
            {/* Ambient background effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 space-y-6 p-6 md:p-8">

                {/* ═══ HERO HEADER ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                                <Radio className="h-6 w-6 text-primary" />
                            </div>
                            {/* Live pulse */}
                            <div className="absolute -top-0.5 -right-0.5 h-3 w-3">
                                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-40" />
                                <div className="absolute inset-0.5 bg-emerald-400 rounded-full" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                                Sales Command
                            </h1>
                            <p className="text-sm text-white/30 font-medium mt-0.5">
                                {isMember ? "Personal mission control" : "Centralized pipeline & team analytics"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <EnhancedDateFilter
                            onFilterChange={setDateRange}
                            storageKey="crm-sales-command-date-filter"
                            initialType="monthly"
                        />
                    </div>
                </motion.div>

                {/* ═══ METRICS ROW ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <UnifiedMetricCard
                        title={isMember ? "My Revenue" : "Total Revenue"}
                        value={isMember ? "$0" : summary.revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                        subtitle={isMember ? "Your closed revenue" : "From active opportunities"}
                        iconName="DollarSign"
                        accentColor="emerald"
                    />

                    <UnifiedMetricCard
                        title={isMember ? "My Active Deals" : "Active Deals"}
                        value={isMember ? userData.myPipeline.total : summary.activeDeals}
                        subtitle={isMember ? "Your pipeline volume" : "Total pipeline volume"}
                        iconName="Zap"
                        accentColor="amber"
                        delay={0.1}
                    />

                    <UnifiedMetricCard
                        title="Active Team"
                        value={summary.activeUsers}
                        subtitle="Sales representatives"
                        iconName="Users2"
                        accentColor="cyan"
                        delay={0.2}
                    />

                    <UnifiedMetricCard
                        title="Storage"
                        value={`${summary.storagePercentage.toFixed(1)}%`}
                        subtitle="Quota used"
                        iconName="HardDrive"
                        accentColor={summary.storagePercentage > 80 ? "rose" : "violet"}
                        delay={0.3}
                    />
                </div>

                {/* ═══ VIEW CONTROLLER ═══ */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between border-b border-white/5 pb-4"
                >
                    <div className="flex items-center gap-0.5 bg-white/[0.03] backdrop-blur-xl p-1 rounded-xl border border-white/[0.06]">
                        {!isMember && (
                            <button
                                onClick={() => setViewMode("team")}
                                className={cn(
                                    "relative px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300",
                                    viewMode === "team"
                                        ? "bg-white/10 text-white shadow-lg shadow-black/20 border border-white/10"
                                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                                )}
                            >
                                Team Dashboard
                            </button>
                        )}
                        <button
                            onClick={() => setViewMode("personal")}
                            className={cn(
                                "relative px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300",
                                viewMode === "personal"
                                    ? "bg-white/10 text-white shadow-lg shadow-black/20 border border-white/10"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                            )}
                        >
                            {selectedUserData && selectedUserData.meta.userName !== "Me"
                                ? `${selectedUserData.meta.userName}'s Dashboard`
                                : "My Dashboard"}
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {isRefreshing && (
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
                                <span className="text-[11px] text-white/30 font-medium">Syncing...</span>
                            </div>
                        )}
                        <span className="text-[11px] text-white/20 font-mono tabular-nums">
                            {new Date(data.meta.serverTime).toLocaleTimeString()}
                        </span>
                        {isManager && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
                                <Shield className="h-3 w-3" />
                                Admin
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* ═══ DYNAMIC VIEW ═══ */}
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="min-h-[500px]"
                >
                    {viewMode === "personal" && <MyCommandView />}
                    {viewMode === "team" && <TeamCommandView />}
                </motion.div>
            </div>
        </div>
    );
}
