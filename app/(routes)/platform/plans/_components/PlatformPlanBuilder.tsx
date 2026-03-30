"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Check,
    Users,
    Settings,
} from "lucide-react";
import { toast } from "sonner";

import { SUBSCRIPTION_PLANS, type SubscriptionPlanType } from "@/config/subscriptions";

interface PlatformPlanBuilderProps {
    teams: any[];
}

export function PlatformPlanBuilder({ teams }: PlatformPlanBuilderProps) {
    const [assigningTeam, setAssigningTeam] = useState<string | null>(null);
    const [selectedPlans, setSelectedPlans] = useState<Record<string, SubscriptionPlanType>>({});

    const planKeys = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanType[];

    const handleAssignPlan = async (teamId: string) => {
        setAssigningTeam(teamId);
        try {
            const planSlug = selectedPlans[teamId] || "STARTER";
            const res = await fetch("/api/platform/assign-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId,
                    planSlug: planSlug,
                }),
            });
            if (res.ok) {
                toast.success(`Plan assigned successfully`);
            } else {
                toast.error("Failed to assign plan");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setAssigningTeam(null);
        }
    };

    const handleSelectChange = (teamId: string, value: SubscriptionPlanType) => {
        setSelectedPlans((prev) => ({
            ...prev,
            [teamId]: value
        }));
    };

    return (
        <div className="space-y-8">
            {/* ── Tier Limits Reference ── */}
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    Subscription Tier Limits (Reference)
                </h3>
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Tier</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Price</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Max Users</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">LeadGen / Month</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">AI Tokens / Month</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {planKeys.map((key) => {
                                        const plan = SUBSCRIPTION_PLANS[key];
                                        return (
                                            <tr key={key} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-3">
                                                    <div className="text-xs font-bold text-white">{plan.name}</div>
                                                </td>
                                                <td className="p-3 text-xs text-zinc-400">
                                                    ${plan.price}
                                                </td>
                                                <td className="p-3 text-xs text-zinc-400">
                                                    {plan.limits.max_users === -1 ? "Unlimited" : plan.limits.max_users}
                                                </td>
                                                <td className="p-3 text-xs text-emerald-400/90 font-mono">
                                                    {plan.limits.leadgen_credits === -1 ? "Unlimited" : plan.limits.leadgen_credits}
                                                </td>
                                                <td className="p-3 text-xs text-indigo-400/90 font-mono">
                                                    {plan.limits.ai_tokens === -1 ? "Unlimited" : plan.limits.ai_tokens.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Team Plan Assignment ── */}
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Assign Plans to Companies
                </h3>
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Company</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Current Plan</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Members</th>
                                        <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold text-right">Assign</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {teams.map((team: any) => {
                                        // "FREE" usually maps to "STARTER" in standard context.
                                        const currentPlanDisplay = (team.subscription_plan === "FREE" || !team.subscription_plan) ? "STARTER" : team.subscription_plan;
                                        const selectedPlan = selectedPlans[team.id] || currentPlanDisplay;

                                        return (
                                            <tr key={team.id} className="hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-3">
                                                    <div className="text-xs font-bold text-white">{team.name}</div>
                                                    <div className="text-[10px] text-zinc-500">{team.slug}</div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                                        {currentPlanDisplay}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-zinc-400">
                                                    {team.members?.length || 0}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <select
                                                            value={selectedPlan}
                                                            onChange={(e) => handleSelectChange(team.id, e.target.value as SubscriptionPlanType)}
                                                            className="h-7 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 px-2 outline-none"
                                                        >
                                                            {planKeys.map((s) => (
                                                                <option key={s} value={s}>{SUBSCRIPTION_PLANS[s].name}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/30 text-[10px]"
                                                            onClick={() => handleAssignPlan(team.id)}
                                                            disabled={assigningTeam === team.id}
                                                        >
                                                            {assigningTeam === team.id
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <Check className="w-3 h-3" />
                                                            }
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
