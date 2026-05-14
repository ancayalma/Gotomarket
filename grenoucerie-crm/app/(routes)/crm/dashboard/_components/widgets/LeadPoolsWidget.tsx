"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { List, Users, Zap, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeadPoolsWidgetProps {
    pools: any[];
}

export const LeadPoolsWidget = ({ pools = [] }: LeadPoolsWidgetProps) => {
    const router = useRouter();
    if (pools.length === 0) {
        return (
            <WidgetWrapper title="Lists" icon={List} iconColor="text-violet-400">
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                    <List className="h-10 w-10 mb-2 opacity-10" />
                    <p className="text-[11px] font-medium italic">No active lists</p>
                </div>
            </WidgetWrapper>
        );
    }

    const totalAccounts = pools.reduce((acc, curr) => acc + (curr.candidateCount || 0), 0);
    const totalContacted = pools.reduce((acc, curr) => acc + (curr.contactedCount || 0), 0);
    const totalOpened = pools.reduce((acc, curr) => acc + (curr.openedCount || 0), 0);

    const openRate = totalContacted > 0 ? Math.round((totalOpened / totalContacted) * 100) : 0;

    return (
        <WidgetWrapper
            title="Lead Lists"
            icon={List}
            iconColor="text-violet-400"
            footerHref="/lists"
            footerLabel="View All lists"
        >
            <div className="space-y-4 pt-2">
                {/* Visual Distribution Summary */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 py-1 px-1 leading-normal">
                        <span>Engagement Depth</span>
                        <span className="text-violet-400">{openRate}% Open Rate</span>
                    </div>
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted/30 relative shadow-inner">
                        {/* Shimmering background for progress */}
                        <div
                            className="h-full bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-colors duration-1000 ease-out"
                            style={{ width: `${totalContacted > 0 ? (totalOpened / totalContacted) * 100 : 0}%` }}
                        />
                        {/* Contacted marker */}
                        <div
                            className="absolute inset-y-0 left-0 border-r border-white/20 bg-violet-400/20"
                            style={{ width: `${totalAccounts > 0 ? (totalContacted / totalAccounts) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {pools.map((pool) => (
                        <div
                            key={pool.id}
                            onClick={() => router.push(`/crm/accounts/lists/${pool.id}`)}
                            className="bg-muted/10 border border-border/50 rounded-xl p-3 hover:bg-muted/20 hover:border-violet-500/30 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrendingUp size={10} className="text-violet-400" />
                            </div>
                            <div className="flex items-start justify-between gap-2 overflow-hidden">
                                <p className="text-[11px] font-bold text-foreground/90 truncate group-hover:text-violet-400 transition-colors uppercase tracking-tight">
                                    {pool.name}
                                </p>
                            </div>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Targets</span>
                                    <span className="text-[11px] font-bold text-foreground">{pool.candidateCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Contacted</span>
                                    <span className="text-[11px] font-bold text-blue-400">{pool.contactedCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Opened</span>
                                    <span className="text-[11px] font-bold text-emerald-400">{pool.openedCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Automation Status */}
                <div className="group flex items-center gap-3 bg-gradient-to-r from-violet-500/10 to-transparent rounded-xl p-3 border border-violet-500/20 hover:border-violet-500/40 transition-colors cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/40 blur-md rounded-full group-hover:bg-violet-400/60 transition-colors animate-pulse" />
                        <div className="relative p-2 bg-violet-500/20 rounded-lg text-violet-400 border border-violet-500/30">
                            <Zap size={14} className="group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-violet-300 uppercase leading-normal tracking-widest py-1 px-1">FLOW STATE Tracking</p>
                        <p className="text-[11px] text-foreground/70 font-medium mt-1 truncate">
                            {totalOpened} real-time engagement signals captured
                        </p>
                    </div>
                </div>
            </div>
        </WidgetWrapper>
    );
};
