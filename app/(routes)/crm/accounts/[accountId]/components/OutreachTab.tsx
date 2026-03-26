"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import axios from "axios";
import { format } from "date-fns";
import {
    Mail,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    MousePointerClick,
    Reply,
    Send,
    ChevronDown,
    ChevronUp,
    XCircle,
    SkipForward,
    Loader2,
    Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OutreachItem {
    id: string;
    channel: string;
    status: string;
    subject?: string;
    body_text?: string;
    body_html?: string;
    candidate_email?: string;
    candidate_name?: string;
    error_message?: string;
    sentAt?: string;
    openedAt?: string;
    clickedAt?: string;
    repliedAt?: string;
    reply_snippet?: string;
    reply_sentiment?: string;
    createdAt?: string;
    campaign_name?: string;
    campaign_status?: string;
    sender_email?: string;
}

// Isolated iframe for rendering HTML emails with proper image loading
function EmailIframe({ html }: { html: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(300);

    const writeContent = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;

        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body { margin: 0 auto; padding: 16px; max-width: 680px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a; background: #fff; word-wrap: break-word; overflow-wrap: break-word; }
            img { max-width: 100%; height: auto; }
            a { color: #2563eb; }
            table { max-width: 100% !important; margin: 0 auto; }
        </style></head><body>${html}</body></html>`);
        doc.close();

        setTimeout(() => {
            try {
                const h = doc.body?.scrollHeight;
                if (h) setHeight(Math.min(h + 16, 800));
            } catch {}
        }, 300);
    }, [html]);

    useEffect(() => {
        writeContent();
    }, [writeContent]);

    return (
        <iframe
            ref={iframeRef}
            className="w-full border-0 bg-white rounded-b-xl"
            style={{ height: `${height}px` }}
        />
    );
}

export function AccountOutreachTab({ accountId }: { accountId: string }) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const { data, isLoading, error } = useSWR(
        `/api/crm/account/${accountId}/outreach`,
        (url) => axios.get(url).then((res) => res.data),
        { revalidateOnFocus: false }
    );

    const items: OutreachItem[] = data?.items || [];
    const stats = data?.stats || { sent: 0, opened: 0, replied: 0, failed: 0, pending: 0, skipped: 0 };

    const toggleExpand = (id: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "SENT": return <Send className="h-3.5 w-3.5 text-emerald-400" />;
            case "DELIVERED": return <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />;
            case "OPENED": return <Eye className="h-3.5 w-3.5 text-amber-400" />;
            case "CLICKED": return <MousePointerClick className="h-3.5 w-3.5 text-orange-400" />;
            case "REPLIED": return <Reply className="h-3.5 w-3.5 text-purple-400" />;
            case "FAILED": return <XCircle className="h-3.5 w-3.5 text-red-400" />;
            case "SKIPPED": return <SkipForward className="h-3.5 w-3.5 text-zinc-500" />;
            case "PENDING": return <Clock className="h-3.5 w-3.5 text-zinc-400" />;
            default: return <Clock className="h-3.5 w-3.5 text-zinc-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SENT": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "DELIVERED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "OPENED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "CLICKED": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "REPLIED": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "FAILED": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "SKIPPED": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
            default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Failed to load outreach data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                    { label: "Sent", value: stats.sent, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Opened", value: stats.opened, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Replied", value: stats.replied, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    { label: "Failed", value: stats.failed, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Skipped", value: stats.skipped, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
                    { label: "Pending", value: stats.pending, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
                ].map((stat) => (
                    <div key={stat.label} className={cn("rounded-xl border p-3 text-center", stat.bg)}>
                        <p className={cn("text-xl font-black tabular-nums", stat.color)}>{stat.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Items List */}
            {items.length === 0 ? (
                <Card className="bg-transparent border-white/5 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-white/20">
                        <Megaphone className="h-12 w-12 mb-4 opacity-10" />
                        <p className="text-sm italic tracking-tight font-medium">No outreach campaigns have targeted this account yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const isExpanded = expandedItems.has(item.id);
                        return (
                            <div
                                key={item.id}
                                className="rounded-xl border border-white/5 bg-[#0f0f0f] overflow-hidden transition-colors hover:border-white/10"
                            >
                                {/* Header Row */}
                                <button
                                    onClick={() => toggleExpand(item.id)}
                                    className="w-full flex items-center gap-3 p-4 text-left"
                                >
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(item.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold text-white/90 truncate">
                                                {item.subject || item.candidate_email || "No Subject"}
                                            </span>
                                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 py-0 shrink-0", getStatusColor(item.status))}>
                                                {item.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                                            {item.campaign_name && (
                                                <span className="truncate">Campaign: {item.campaign_name}</span>
                                            )}
                                            {item.sentAt && (
                                                <span className="whitespace-nowrap">
                                                    Sent {format(new Date(item.sentAt), "MMM d, h:mm a")}
                                                </span>
                                            )}
                                            {item.sender_email && (
                                                <span className="truncate">via {item.sender_email}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 text-zinc-600">
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                                        {/* Tracking Indicators */}
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { label: "Opened", time: item.openedAt, icon: Eye, color: "emerald" },
                                                { label: "Clicked", time: item.clickedAt, icon: MousePointerClick, color: "orange" },
                                                { label: "Replied", time: item.repliedAt, icon: Reply, color: "purple" },
                                            ].map((tracker) => (
                                                <div key={tracker.label} className="flex items-center gap-1.5">
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                                        tracker.time
                                                            ? `bg-${tracker.color}-500 shadow-${tracker.color}-500/50`
                                                            : "bg-white/10 shadow-transparent"
                                                    )} />
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                                        <tracker.icon size={10} />
                                                        {tracker.time
                                                            ? `${tracker.label}: ${format(new Date(tracker.time), "MMM d, h:mm a")}`
                                                            : `Not ${tracker.label}`
                                                        }
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Email Body */}
                                        {(item.body_html || item.body_text) && (
                                            <div className="rounded-xl overflow-hidden border border-white/5">
                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 pt-3 pb-2 bg-white/[0.02]">Email Content</p>
                                                {item.body_html ? (
                                                    <EmailIframe html={item.body_html} />
                                                ) : (
                                                    <div className="px-4 pb-4">
                                                        <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">
                                                            {item.body_text}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply Snippet */}
                                        {item.reply_snippet && (
                                            <div className="border-l-2 border-primary/30 pl-3 py-1 bg-primary/[0.02] rounded-r-lg">
                                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Reply Received</p>
                                                <p className="text-sm text-white/70 italic">{item.reply_snippet}</p>
                                                {item.reply_sentiment && (
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] h-4 px-1.5 py-0 mt-1",
                                                        item.reply_sentiment === "POSITIVE" ? "border-emerald-500/30 text-emerald-400" :
                                                        item.reply_sentiment === "NEGATIVE" ? "border-red-500/30 text-red-400" :
                                                        "border-zinc-500/30 text-zinc-400"
                                                    )}>
                                                        {item.reply_sentiment}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {item.error_message && (
                                            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-300/80">{item.error_message}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
