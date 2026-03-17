"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Shield, ShieldAlert, ShieldCheck, Plus, Trash2, ExternalLink,
    Swords, Target, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

interface Competitor {
    id: string;
    name: string;
    website?: string;
    contact_name?: string;
    product?: string;
    strengths?: string;
    weaknesses?: string;
    strategy?: string;
    threat_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    outcome: "ACTIVE" | "WON_AGAINST" | "LOST_TO" | "NO_DECISION";
    price_position?: string;
}

interface CompetitorPanelProps {
    opportunityId: string;
}

const THREAT_CONFIG = {
    LOW: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: ShieldCheck, label: "Low" },
    MEDIUM: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Shield, label: "Medium" },
    HIGH: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: ShieldAlert, label: "High" },
    CRITICAL: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert, label: "Critical" },
};

const OUTCOME_CONFIG = {
    ACTIVE: { color: "bg-blue-500/20 text-blue-400", label: "Active" },
    WON_AGAINST: { color: "bg-emerald-500/20 text-emerald-400", label: "Won" },
    LOST_TO: { color: "bg-red-500/20 text-red-400", label: "Lost To" },
    NO_DECISION: { color: "bg-zinc-500/20 text-zinc-400", label: "No Decision" },
};

export default function CompetitorPanel({ opportunityId }: CompetitorPanelProps) {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "", website: "", product: "", strengths: "", weaknesses: "",
        strategy: "", threat_level: "MEDIUM", outcome: "ACTIVE", price_position: "",
    });

    const fetchCompetitors = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/crm/opportunities/${opportunityId}/competitors`);
            setCompetitors(data);
        } catch { /* skip */ }
    }, [opportunityId]);

    useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

    const handleAdd = async () => {
        if (!form.name.trim()) { toast.error("Competitor name is required"); return; }
        try {
            await axios.post(`/api/crm/opportunities/${opportunityId}/competitors`, form);
            toast.success("Competitor added");
            setForm({ name: "", website: "", product: "", strengths: "", weaknesses: "", strategy: "", threat_level: "MEDIUM", outcome: "ACTIVE", price_position: "" });
            setIsAdding(false);
            fetchCompetitors();
        } catch { toast.error("Failed to add competitor"); }
    };

    const handleDelete = async (competitorId: string) => {
        try {
            await axios.delete(`/api/crm/opportunities/${opportunityId}/competitors`, { data: { competitorId } });
            toast.success("Competitor removed");
            fetchCompetitors();
        } catch { toast.error("Failed to remove competitor"); }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Competitors ({competitors.length})</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>

            {isAdding && (
                <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                    <Input placeholder="Competitor name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="h-8 text-sm" />
                        <Input placeholder="Their product" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={form.threat_level} onValueChange={v => setForm({ ...form, threat_level: v })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low Threat</SelectItem>
                                <SelectItem value="MEDIUM">Medium Threat</SelectItem>
                                <SelectItem value="HIGH">High Threat</SelectItem>
                                <SelectItem value="CRITICAL">Critical Threat</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Price position (e.g. 20% lower)" value={form.price_position} onChange={e => setForm({ ...form, price_position: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <Textarea placeholder="Their strengths" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} rows={2} className="text-sm" />
                    <Textarea placeholder="Their weaknesses" value={form.weaknesses} onChange={e => setForm({ ...form, weaknesses: e.target.value })} rows={2} className="text-sm" />
                    <Textarea placeholder="Our counter-strategy" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} rows={2} className="text-sm" />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleAdd} className="h-7 text-xs">Save Competitor</Button>
                    </div>
                </div>
            )}

            {competitors.length === 0 && !isAdding && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No competitors tracked yet
                </div>
            )}

            {competitors.map(c => {
                const threat = THREAT_CONFIG[c.threat_level];
                const outcome = OUTCOME_CONFIG[c.outcome];
                const ThreatIcon = threat.icon;
                const isExpanded = expandedId === c.id;

                return (
                    <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                        <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition"
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        >
                            <ThreatIcon className={`w-4 h-4 ${threat.color.split(" ")[1]}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{c.name}</div>
                                {c.product && <div className="text-xs text-muted-foreground truncate">{c.product}</div>}
                            </div>
                            <Badge className={`${threat.color} text-[10px] border`}>{threat.label}</Badge>
                            <Badge className={`${outcome.color} text-[10px]`}>{outcome.label}</Badge>
                            {c.price_position && <span className="text-[10px] text-muted-foreground">{c.price_position}</span>}
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>

                        {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                                {c.website && (
                                    <a href={c.website} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-primary flex items-center gap-1 hover:underline">
                                        <ExternalLink className="w-3 h-3" /> {c.website}
                                    </a>
                                )}
                                {c.strengths && <div className="text-xs"><span className="text-emerald-400 font-medium">Strengths:</span> <span className="text-muted-foreground">{c.strengths}</span></div>}
                                {c.weaknesses && <div className="text-xs"><span className="text-red-400 font-medium">Weaknesses:</span> <span className="text-muted-foreground">{c.weaknesses}</span></div>}
                                {c.strategy && <div className="text-xs"><span className="text-blue-400 font-medium">Our Strategy:</span> <span className="text-muted-foreground">{c.strategy}</span></div>}
                                <div className="flex justify-end">
                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="h-6 text-xs text-red-400 hover:text-red-300">
                                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
