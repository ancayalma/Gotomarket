"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Linkedin, Users, MessageSquare, UserPlus, Send,
    Loader2, Check, Clock, ArrowRight, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LinkedInItem {
    id: string;
    status: string;
    linkedin_action: string | null;
    linkedin_profile_url: string | null;
    linkedin_message?: string;
    research_data: any;
    sentAt: string | null;
    repliedAt: string | null;
    assigned_lead: { firstName: string; lastName: string; company: string | null } | null;
}

interface LinkedInStats {
    total: number;
    pending: number;
    sent: number;
    replied: number;
    connectionRate: number;
    replyRate: number;
}

interface LinkedInSequencePanelProps {
    campaignId: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof UserPlus; label: string; color: string }> = {
    connect: { icon: UserPlus, label: "Connect", color: "text-blue-400" },
    message: { icon: MessageSquare, label: "Message", color: "text-emerald-400" },
    inmail: { icon: Send, label: "InMail", color: "text-purple-400" },
    engage: { icon: Linkedin, label: "Engage", color: "text-amber-400" },
    view_profile: { icon: Users, label: "View Profile", color: "text-sky-400" },
};

export default function LinkedInSequencePanel({ campaignId }: LinkedInSequencePanelProps) {
    const [items, setItems] = useState<LinkedInItem[]>([]);
    const [stats, setStats] = useState<LinkedInStats | null>(null);
    const [templates, setTemplates] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/crm/outreach/${campaignId}/linkedin`);
            setItems(data.items);
            setStats(data.stats);
            setTemplates(data.templates);
        } catch { /* skip */ }
        setLoading(false);
    }, [campaignId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdvance = async (itemId: string, outcome: string) => {
        try {
            await axios.put(`/api/crm/outreach/${campaignId}/linkedin`, { itemId, outcome });
            fetchData();
        } catch { /* skip */ }
    };

    const handleCopyMessage = (message: string) => {
        navigator.clipboard.writeText(message);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    <h3 className="font-semibold text-white">LinkedIn Sequences</h3>
                    <Badge className="bg-[#0A66C2]/10 text-[#0A66C2] border-0 text-[10px]">Social Selling</Badge>
                </div>
            </div>

            {/* Stats */}
            {stats && stats.total > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    <StatPill label="Total" value={stats.total} />
                    <StatPill label="Pending" value={stats.pending} />
                    <StatPill label="Connected" value={`${stats.connectionRate}%`} />
                    <StatPill label="Replied" value={`${stats.replyRate}%`} />
                </div>
            )}

            {/* Items List */}
            {items.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    <Linkedin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No LinkedIn sequence items yet. Add leads to start a social selling sequence.
                </div>
            ) : (
                <ScrollArea className="max-h-[50vh]">
                    <div className="space-y-2">
                        {items.map(item => {
                            const action = ACTION_CONFIG[item.linkedin_action || "connect"] || ACTION_CONFIG.connect;
                            const ActionIcon = action.icon;
                            const currentStep = (item.research_data as any)?.current_step || 0;
                            const totalSteps = (item.research_data as any)?.sequence_steps?.length || 1;

                            return (
                                <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/5`}>
                                                <ActionIcon className={`w-3.5 h-3.5 ${action.color}`} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {item.assigned_lead?.firstName} {item.assigned_lead?.lastName}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {item.assigned_lead?.company} · Step {currentStep + 1}/{totalSteps}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-[9px] border-0 ${item.status === "REPLIED" ? "bg-emerald-500/10 text-emerald-400" :
                                                        item.status === "SENT" || item.status === "DELIVERED" ? "bg-blue-500/10 text-blue-400" :
                                                            "bg-amber-500/10 text-amber-400"
                                                    }`}
                                            >
                                                {item.status === "REPLIED" ? <Check className="w-2.5 h-2.5 mr-1" /> :
                                                    item.status === "READY" ? <Clock className="w-2.5 h-2.5 mr-1" /> : null}
                                                {item.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Message preview + copy */}
                                    {item.research_data?.sequence_steps?.[currentStep] && item.status === "READY" && (
                                        <div className="space-y-2">
                                            <div className="bg-muted/30 rounded p-2 text-xs text-muted-foreground">
                                                {(item as any).linkedin_message || "No message generated"}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 text-[10px] gap-1"
                                                    onClick={() => handleCopyMessage((item as any).linkedin_message || "")}
                                                >
                                                    <Copy className="w-2.5 h-2.5" /> Copy Message
                                                </Button>
                                                {item.linkedin_profile_url && (
                                                    <a
                                                        href={item.linkedin_profile_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-6 px-2 inline-flex items-center text-[10px] gap-1 text-[#0A66C2] hover:underline"
                                                    >
                                                        <Linkedin className="w-2.5 h-2.5" /> Open Profile
                                                    </a>
                                                )}
                                                <div className="flex-1" />
                                                <Button
                                                    size="sm"
                                                    className="h-6 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                    onClick={() => handleAdvance(item.id, "accepted")}
                                                >
                                                    <Check className="w-2.5 h-2.5" /> Accepted
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px] gap-1"
                                                    onClick={() => handleAdvance(item.id, "no_response")}
                                                >
                                                    <ArrowRight className="w-2.5 h-2.5" /> Skip
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-bold text-white">{value}</div>
            <div className="text-[9px] text-muted-foreground">{label}</div>
        </div>
    );
}
