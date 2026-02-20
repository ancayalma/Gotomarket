"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { List, Users, Zap, TrendingUp } from "lucide-react";

interface LeadPoolsWidgetProps {
    pools: any[];
}

export const LeadPoolsWidget = ({ pools = [] }: LeadPoolsWidgetProps) => {
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

    const totalLeads = pools.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <WidgetWrapper
            title="Lists"
            icon={List}
            iconColor="text-violet-400"
            footerHref="/lists"
            footerLabel="View All Lists"
        >
            <div className="space-y-4 pt-2">
                {/* Visual Distribution Summary */}
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-white/5">
                    {pools.slice(0, 4).map((pool, idx) => {
                        const width = totalLeads > 0 ? (pool.total / totalLeads) * 100 : 0;
                        const colors = ["bg-violet-500", "bg-indigo-500", "bg-purple-500", "bg-fuchsia-500"];
                        return <div key={pool.id} style={{ width: `${width}%` }} className={colors[idx % colors.length]} />;
                    })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {pools.map((pool) => (
                        <div
                            key={pool.id}
                            className="bg-white/5 border border-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-start justify-between gap-2 overflow-hidden">
                                <p className="text-[11px] font-bold text-white/90 truncate group-hover:text-violet-400 transition-colors uppercase tracking-tight">
                                    {pool.name}
                                </p>
                            </div>
                            <div className="flex items-end justify-between mt-1">
                                <div className="flex items-baseline gap-1">
                                    <div className="text-lg font-bold text-white tracking-tighter">
                                        {pool.candidateCount || 0}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        Accounts
                                    </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium pb-0.5 uppercase tracking-wider">
                                    {pool.leadCount || 0} Contacts
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Automation Status */}
                <div className="flex items-center gap-2 bg-violet-500/10 rounded-lg p-2.5 border border-violet-500/20">
                    <div className="p-1.5 bg-violet-500/20 rounded-md text-violet-400">
                        <Zap size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-violet-300 uppercase leading-none">AI Lead Sync</p>
                        <p className="text-[11px] text-violet-400/80 font-medium truncate">
                            Active: {pools.reduce((acc, curr) => acc + (curr.candidateCount || 0), 0)} accounts tracked
                        </p>
                    </div>
                </div>
            </div>
        </WidgetWrapper>
    );
};
