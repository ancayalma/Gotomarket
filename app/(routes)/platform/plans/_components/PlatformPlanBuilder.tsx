"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Crown,
    Zap,
    Shield,
    Hexagon,
    Save,
    Loader2,
    Check,
    Users,
    Mail,
    MessageSquare,
    Phone,
    Brain,
    HardDrive,
    Search,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { SUBSCRIPTION_PLANS, type SubscriptionPlanType } from "@/config/subscriptions";

interface PlatformPlanBuilderProps {
    teams: any[];
}

type EditableLimits = {
    max_users: number;
    max_storage: number;
    emails_per_month: number;
    sms_per_month: number;
    voice_minutes_per_month: number;
    ai_tokens: number;
    leadgen_credits: number;
    credits: number;
    max_active_quests: number;
};

const PLAN_ICONS: Record<string, React.ElementType> = {
    STARTER: Shield,
    GROWTH: Zap,
    SCALE: Crown,
    ENTERPRISE: Hexagon,
    EXEMPT: Sparkles,
};

const PLAN_GRADIENTS: Record<string, string> = {
    STARTER: "from-zinc-500 to-zinc-700",
    GROWTH: "from-indigo-500 to-violet-600",
    SCALE: "from-amber-500 to-orange-600",
    ENTERPRISE: "from-emerald-500 to-teal-600",
    EXEMPT: "from-cyan-500 to-blue-600",
};

const LIMIT_META: { key: keyof EditableLimits; label: string; icon: React.ElementType; unit: string }[] = [
    { key: "max_users", label: "Max Users", icon: Users, unit: "" },
    { key: "emails_per_month", label: "Emails / mo", icon: Mail, unit: "" },
    { key: "sms_per_month", label: "SMS / mo", icon: MessageSquare, unit: "" },
    { key: "voice_minutes_per_month", label: "Voice min / mo", icon: Phone, unit: "min" },
    { key: "ai_tokens", label: "AI Tokens / mo", icon: Brain, unit: "" },
    { key: "leadgen_credits", label: "LeadGen Credits", icon: Search, unit: "" },
    { key: "max_storage", label: "Storage (MB)", icon: HardDrive, unit: "MB" },
    { key: "max_active_quests", label: "Active Quests", icon: Sparkles, unit: "" },
];

function formatLimit(val: number): string {
    if (val === -1) return "∞";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
}

export function PlatformPlanBuilder({ teams }: PlatformPlanBuilderProps) {
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlanType | null>(null);
    const [editLimits, setEditLimits] = useState<EditableLimits | null>(null);
    const [saving, setSaving] = useState(false);
    const [assigningTeam, setAssigningTeam] = useState<string | null>(null);
    const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<SubscriptionPlanType>("GROWTH");

    const planKeys = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanType[];

    const handleEdit = (slug: SubscriptionPlanType) => {
        const plan = SUBSCRIPTION_PLANS[slug];
        setEditingPlan(slug);
        setEditLimits({ ...plan.limits });
    };

    const handleSavePlan = async () => {
        if (!editingPlan || !editLimits) return;
        setSaving(true);
        try {
            const res = await fetch("/api/platform/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: editingPlan,
                    limits: editLimits,
                }),
            });
            if (res.ok) {
                toast.success(`${editingPlan} plan limits updated`);
                setEditingPlan(null);
            } else {
                toast.error("Failed to save plan");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const handleAssignPlan = async (teamId: string) => {
        setAssigningTeam(teamId);
        try {
            const res = await fetch("/api/platform/assign-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId,
                    planSlug: selectedPlanForAssign,
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

    return (
        <div className="space-y-8">
            {/* ── Plan Cards Grid ── */}
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Core Subscription Plans
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {planKeys.map((slug) => {
                        const plan = SUBSCRIPTION_PLANS[slug];
                        const Icon = PLAN_ICONS[slug] || Shield;
                        const gradient = PLAN_GRADIENTS[slug] || "from-zinc-500 to-zinc-700";
                        const isEditing = editingPlan === slug;

                        return (
                            <Card
                                key={slug}
                                className={`bg-zinc-900/60 border-zinc-800 overflow-hidden transition-all duration-300 ${isEditing ? "ring-1 ring-indigo-500/30 border-indigo-500/30" : "hover:border-zinc-700"}`}
                            >
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${gradient}`}>
                                                <Icon className="w-4.5 h-4.5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                                                <p className="text-[10px] text-zinc-500 font-mono">{slug}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                                            {plan.price > 0 ? `$${plan.price}/user` : plan.price === 0 && slug !== "ENTERPRISE" ? "Free" : "Custom"}
                                        </Badge>
                                    </div>

                                    {/* Limits */}
                                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                                        {LIMIT_META.map(({ key, label, icon: LIcon }) => (
                                            <div key={key} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <LIcon className="w-3 h-3 text-zinc-600" />
                                                    {label}
                                                </div>
                                                {isEditing && editLimits ? (
                                                    <Input
                                                        type="number"
                                                        min="-1"
                                                        value={editLimits[key]}
                                                        onChange={(e) =>
                                                            setEditLimits({ ...editLimits, [key]: Number(e.target.value) })
                                                        }
                                                        className="h-6 w-24 bg-zinc-950 border-zinc-800 text-right text-xs px-2"
                                                    />
                                                ) : (
                                                    <span className="font-mono font-bold text-white text-[11px]">
                                                        {formatLimit(plan.limits[key])}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-1 pt-2">
                                        {plan.features.slice(0, 5).map((f) => (
                                            <span key={f} className="text-[9px] bg-zinc-800/50 text-zinc-500 px-1.5 py-0.5 rounded-full">
                                                {f}
                                            </span>
                                        ))}
                                        {plan.features.length > 5 && (
                                            <span className="text-[9px] bg-zinc-800/50 text-zinc-500 px-1.5 py-0.5 rounded-full">
                                                +{plan.features.length - 5} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                                                    onClick={handleSavePlan}
                                                    disabled={saving}
                                                >
                                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-zinc-700 text-zinc-400"
                                                    onClick={() => setEditingPlan(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full border-zinc-700 text-zinc-400 hover:text-white"
                                                onClick={() => handleEdit(slug)}
                                            >
                                                Edit Limits
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
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
                                    {teams.map((team: any) => (
                                        <tr key={team.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-3">
                                                <div className="text-xs font-bold text-white">{team.name}</div>
                                                <div className="text-[10px] text-zinc-500">{team.slug}</div>
                                            </td>
                                            <td className="p-3">
                                                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                                    {team.subscription_plan || "STARTER"}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-xs text-zinc-400">
                                                {team.members?.length || 0}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        value={selectedPlanForAssign}
                                                        onChange={(e) => setSelectedPlanForAssign(e.target.value as SubscriptionPlanType)}
                                                        className="h-7 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 px-2"
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
