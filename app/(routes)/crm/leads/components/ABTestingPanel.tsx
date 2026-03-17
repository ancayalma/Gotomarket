"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    FlaskConical, Trophy, Plus, Loader2, BarChart3, Target,
    Crown, Percent, Mail, MousePointerClick, Reply
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Variant {
    id: string;
    name: string;
    weight: number;
    is_control: boolean;
    is_winner: boolean;
    subject: string | null;
    body_template: string | null;
    tone: string | null;
    cta_text: string | null;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    total_replied: number;
    open_rate: number;
    click_rate: number;
    reply_rate: number;
    _count: { items: number };
}

interface ABTestingPanelProps {
    campaignId: string;
}

const METRICS = [
    { value: "open_rate", label: "Open Rate", icon: Mail },
    { value: "click_rate", label: "Click Rate", icon: MousePointerClick },
    { value: "reply_rate", label: "Reply Rate", icon: Reply },
];

export default function ABTestingPanel({ campaignId }: ABTestingPanelProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/crm/outreach/${campaignId}/ab-variants`);
            setVariants(data.variants);
            setSettings(data.settings);
        } catch { /* skip */ }
        setLoading(false);
    }, [campaignId]);

    useEffect(() => { fetch(); }, [fetch]);

    const handleCreate = async (formData: any) => {
        try {
            await axios.post(`/api/crm/outreach/${campaignId}/ab-variants`, formData);
            setShowCreate(false);
            fetch();
        } catch { /* skip */ }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const bestMetric = settings?.ab_winner_metric || "open_rate";
    const MetricIcon = METRICS.find(m => m.value === bestMetric)?.icon || Mail;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-violet-400" />
                    <h3 className="font-semibold text-white">A/B Testing</h3>
                    {settings?.ab_enabled && (
                        <Badge className="bg-violet-500/10 text-violet-400 border-0 text-[10px]">Active</Badge>
                    )}
                </div>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={variants.length >= 5}>
                            <Plus className="w-3 h-3" /> Add Variant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Variant</DialogTitle>
                        </DialogHeader>
                        <CreateVariantForm onSubmit={handleCreate} variantCount={variants.length} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Winner Banner */}
            {settings?.ab_winner_variant && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                    <Trophy className="w-4 h-4 shrink-0" />
                    Winner declared: <strong>{variants.find(v => v.is_winner)?.name}</strong>
                    — All new sends use this variant.
                </div>
            )}

            {/* Variants Grid */}
            {variants.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Add at least 2 variants to start A/B testing.
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {variants.map(v => (
                        <div
                            key={v.id}
                            className={`rounded-lg border p-4 space-y-3 transition ${v.is_winner
                                    ? "border-amber-500/30 bg-amber-500/5"
                                    : "border-white/10 bg-white/5"
                                }`}
                        >
                            {/* Variant Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-white">{v.name}</span>
                                    {v.is_control && <Badge variant="outline" className="text-[9px]">Control</Badge>}
                                    {v.is_winner && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                </div>
                                <Badge variant="secondary" className="text-[9px]">
                                    <Target className="w-2.5 h-2.5 mr-1" />{v.weight}%
                                </Badge>
                            </div>

                            {/* Subject preview */}
                            {v.subject && (
                                <div className="text-xs text-muted-foreground truncate">
                                    📧 {v.subject}
                                </div>
                            )}

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                <MetricCell label="Opens" value={v.open_rate} count={v.total_opened} total={v.total_sent} highlight={bestMetric === "open_rate"} />
                                <MetricCell label="Clicks" value={v.click_rate} count={v.total_clicked} total={v.total_sent} highlight={bestMetric === "click_rate"} />
                                <MetricCell label="Replies" value={v.reply_rate} count={v.total_replied} total={v.total_sent} highlight={bestMetric === "reply_rate"} />
                            </div>

                            {/* Sends bar */}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (v.total_sent / (settings?.ab_auto_winner_threshold || 100)) * 100)}%` }}
                                    />
                                </div>
                                {v.total_sent} / {settings?.ab_auto_winner_threshold || 100} sends
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MetricCell({ label, value, count, total, highlight }: {
    label: string; value: number; count: number; total: number; highlight: boolean;
}) {
    return (
        <div className={`text-center p-2 rounded ${highlight ? "bg-violet-500/10" : "bg-white/5"}`}>
            <div className={`text-lg font-bold ${highlight ? "text-violet-300" : "text-white"}`}>
                {value.toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">{label}</div>
            <div className="text-[9px] text-muted-foreground">{count}/{total}</div>
        </div>
    );
}

function CreateVariantForm({ onSubmit, variantCount }: { onSubmit: (data: any) => void; variantCount: number }) {
    const [name, setName] = useState(`Variant ${String.fromCharCode(65 + variantCount)}`);
    const [subject, setSubject] = useState("");
    const [bodyTemplate, setBodyTemplate] = useState("");
    const [tone, setTone] = useState("formal");
    const [ctaText, setCtaText] = useState("");

    return (
        <div className="space-y-4 pt-2">
            <div>
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Variant B" className="mt-1" />
            </div>
            <div>
                <Label className="text-xs">Subject Line</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." className="mt-1" />
            </div>
            <div>
                <Label className="text-xs">Body Template</Label>
                <Textarea value={bodyTemplate} onChange={e => setBodyTemplate(e.target.value)} placeholder="Use {{first_name}}, {{company}} for personalization..." className="mt-1 min-h-[80px] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label className="text-xs">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="empathetic">Empathetic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">CTA Text</Label>
                    <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Book a call" className="mt-1" />
                </div>
            </div>
            <Button className="w-full" onClick={() => onSubmit({ name, subject, body_template: bodyTemplate, tone, cta_text: ctaText })}>
                Create Variant
            </Button>
        </div>
    );
}
