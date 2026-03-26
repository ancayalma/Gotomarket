"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Phone, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageData {
    email: { used: number; limit: number };
    sms: { used: number; limit: number };
    voice: { used: number; limit: number };
    ai_tokens: { used: number; limit: number };
}

interface UsageMetersProps {
    teamId: string;
}

function MeterBar({ used, limit, label, icon: Icon, color }: {
    used: number;
    limit: number;
    label: string;
    icon: React.ElementType;
    color: string;
}) {
    const isUnlimited = limit === -1;
    const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

    const tierColor = isUnlimited
        ? "emerald"
        : pct >= 80 ? "red" : pct >= 60 ? "amber" : color;

    const barClasses: Record<string, string> = {
        indigo: "from-indigo-500 to-indigo-400",
        emerald: "from-emerald-500 to-emerald-400",
        amber: "from-amber-500 to-amber-400",
        red: "from-red-500 to-red-400",
        violet: "from-violet-500 to-violet-400",
        cyan: "from-cyan-500 to-cyan-400",
    };

    const dotClasses: Record<string, string> = {
        indigo: "bg-indigo-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        red: "bg-red-500",
        violet: "bg-violet-500",
        cyan: "bg-cyan-500",
    };

    const formatNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
        return n.toLocaleString();
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", dotClasses[tierColor] || dotClasses.indigo)} />
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-mono font-bold text-white">{formatNum(used)}</span>
                    <span className="text-xs text-zinc-500 ml-1">
                        / {isUnlimited ? "∞" : formatNum(limit)}
                    </span>
                </div>
            </div>
            <div className="h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                {isUnlimited ? (
                    <div className="h-full w-full bg-gradient-to-r from-emerald-500/30 to-emerald-400/10" />
                ) : (
                    <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barClasses[tierColor] || barClasses.indigo)}
                        style={{ width: `${pct}%` }}
                    />
                )}
            </div>
            {!isUnlimited && pct >= 80 && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    {pct >= 100 ? "Quota Exhausted" : `${Math.round(pct)}% Used — Approaching Limit`}
                </p>
            )}
        </div>
    );
}

export function UsageMeters({ teamId }: UsageMetersProps) {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch(`/api/admin/usage?teamId=${teamId}`);
                if (res.ok) {
                    setUsage(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch usage:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, [teamId]);

    if (loading) {
        return (
            <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-6 flex items-center justify-center gap-2 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading usage data...</span>
                </CardContent>
            </Card>
        );
    }

    if (!usage) {
        return (
            <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-6 text-center text-zinc-500 text-sm">
                    No usage data available. Quotas will begin tracking when the team subscription is active.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Usage</h3>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                        Current Period
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MeterBar
                        used={usage.email.used}
                        limit={usage.email.limit}
                        label="Emails"
                        icon={Mail}
                        color="indigo"
                    />
                    <MeterBar
                        used={usage.sms.used}
                        limit={usage.sms.limit}
                        label="SMS"
                        icon={MessageSquare}
                        color="cyan"
                    />
                    <MeterBar
                        used={usage.voice.used}
                        limit={usage.voice.limit}
                        label="Voice Minutes"
                        icon={Phone}
                        color="violet"
                    />
                    <MeterBar
                        used={usage.ai_tokens.used}
                        limit={usage.ai_tokens.limit}
                        label="AI Tokens"
                        icon={Brain}
                        color="emerald"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
