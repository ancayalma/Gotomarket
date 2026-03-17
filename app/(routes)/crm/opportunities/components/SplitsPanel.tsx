"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Users, Plus, Trash2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";

interface Split {
    id: string;
    user_id: string;
    split_pct: number;
    split_type: "PRIMARY" | "OVERLAY" | "SUPPORT" | "REFERRAL";
    revenue_credit: number | null;
    note: string | null;
    user: { id: string; name: string | null; email: string; avatar: string | null };
}

interface SplitsPanelProps {
    opportunityId: string;
    expectedRevenue: number;
    teamMembers?: { id: string; name: string | null; email: string; avatar: string | null }[];
}

const SPLIT_TYPE_CONFIG = {
    PRIMARY: { color: "bg-blue-500/20 text-blue-400", label: "Primary" },
    OVERLAY: { color: "bg-purple-500/20 text-purple-400", label: "Overlay" },
    SUPPORT: { color: "bg-emerald-500/20 text-emerald-400", label: "Support" },
    REFERRAL: { color: "bg-amber-500/20 text-amber-400", label: "Referral" },
};

export default function SplitsPanel({ opportunityId, expectedRevenue, teamMembers = [] }: SplitsPanelProps) {
    const [splits, setSplits] = useState<Split[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ user_id: "", split_pct: "50", split_type: "PRIMARY" });

    const fetchSplits = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/crm/opportunities/${opportunityId}/splits`);
            setSplits(data);
        } catch { /* skip */ }
    }, [opportunityId]);

    useEffect(() => { fetchSplits(); }, [fetchSplits]);

    const totalPct = splits.reduce((sum, s) => sum + s.split_pct, 0);
    const remaining = 100 - totalPct;

    const handleAdd = async () => {
        if (!form.user_id) { toast.error("Select a team member"); return; }
        const pct = parseFloat(form.split_pct);
        if (isNaN(pct) || pct <= 0 || pct > 100) { toast.error("Invalid percentage"); return; }
        if (pct > remaining) { toast.error(`Only ${remaining}% remaining`); return; }

        try {
            await axios.post(`/api/crm/opportunities/${opportunityId}/splits`, {
                user_id: form.user_id,
                split_pct: pct,
                split_type: form.split_type,
            });
            toast.success("Split added");
            setForm({ user_id: "", split_pct: "50", split_type: "PRIMARY" });
            setIsAdding(false);
            fetchSplits();
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to add split");
        }
    };

    const handleDelete = async (splitId: string) => {
        try {
            await axios.delete(`/api/crm/opportunities/${opportunityId}/splits`, { data: { splitId } });
            toast.success("Split removed");
            fetchSplits();
        } catch { toast.error("Failed to remove split"); }
    };

    const formatRevenue = (amount: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

    // Filter out users who already have splits
    const availableMembers = teamMembers.filter(m => !splits.some(s => s.user_id === m.id));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Revenue Splits</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${totalPct === 100 ? "text-emerald-400" : totalPct > 100 ? "text-red-400" : "text-amber-400"}`}>
                        {totalPct}% allocated
                    </span>
                    {remaining > 0 && (
                        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="h-7 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${totalPct === 100 ? "bg-emerald-500" : totalPct > 100 ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(totalPct, 100)}%` }}
                />
            </div>

            {isAdding && (
                <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                    <Select value={form.user_id} onValueChange={v => setForm({ ...form, user_id: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select team member" /></SelectTrigger>
                        <SelectContent>
                            {availableMembers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <Input type="number" min="1" max={remaining.toString()} value={form.split_pct}
                                onChange={e => setForm({ ...form, split_pct: e.target.value })} className="h-8 text-sm pr-8" />
                            <Percent className="w-3 h-3 absolute right-3 top-2.5 text-muted-foreground" />
                        </div>
                        <Select value={form.split_type} onValueChange={v => setForm({ ...form, split_type: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRIMARY">Primary</SelectItem>
                                <SelectItem value="OVERLAY">Overlay</SelectItem>
                                <SelectItem value="SUPPORT">Support</SelectItem>
                                <SelectItem value="REFERRAL">Referral</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                            Credit: {formatRevenue(expectedRevenue * (parseFloat(form.split_pct) || 0) / 100)}
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">Cancel</Button>
                            <Button size="sm" onClick={handleAdd} className="h-7 text-xs">Save Split</Button>
                        </div>
                    </div>
                </div>
            )}

            {splits.length === 0 && !isAdding && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <Percent className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No revenue splits configured
                </div>
            )}

            {splits.map(s => {
                const config = SPLIT_TYPE_CONFIG[s.split_type];
                const credit = expectedRevenue * s.split_pct / 100;
                return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={s.user.avatar || undefined} />
                            <AvatarFallback className="text-xs">{(s.user.name || s.user.email).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{s.user.name || s.user.email}</div>
                            <div className="text-xs text-muted-foreground">{formatRevenue(credit)} credit</div>
                        </div>
                        <Badge className={`${config.color} text-[10px]`}>{config.label}</Badge>
                        <span className="text-sm font-mono font-bold text-white">{s.split_pct}%</span>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
