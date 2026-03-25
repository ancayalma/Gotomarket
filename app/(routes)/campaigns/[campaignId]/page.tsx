"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Mail,
    MessageSquare,
    Phone,
    Users,
    BarChart3,
    Target,
    Calendar,
    Settings,
    Zap,
    Loader2,
    Building2,
    Send,
    Eye,
    CheckCircle2,
    Edit3,
    Package,
    FlaskConical,
    Linkedin,
    Trash2,
    Clock,
    AlertTriangle,
    Play,
    Pause,
    XCircle,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import ABTestingPanel from "@/app/(routes)/crm/leads/components/ABTestingPanel";
import LinkedInSequencePanel from "@/app/(routes)/crm/leads/components/LinkedInSequencePanel";
import { CampaignContactTracker } from "@/app/(routes)/crm/leads/components/CampaignContactTracker";

function CronJobCard({ job, toggleCronJob }: any) {
    return (
        <div
            className={`border rounded-lg p-4 transition-all ${
                job.status === "ACTIVE"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : job.status === "PAUSED"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-white/5 bg-card/50"
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{job.label || job.job_type}</span>
                        <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase ${
                                job.status === "ACTIVE"
                                    ? "border-emerald-500/30 text-emerald-400"
                                    : job.status === "PAUSED"
                                        ? "border-amber-500/30 text-amber-400"
                                        : "border-white/10 text-muted-foreground"
                            }`}
                        >
                            {job.status}
                        </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Type: <span className="text-white">{job.job_type}</span></span>
                        <span>Interval: <span className="text-white">{Math.round((job.interval_ms || 3600000) / 60000)}m</span></span>
                        <span>Runs: <span className="text-white">{job.run_count}</span></span>
                        {job.error_count > 0 && (
                            <span className="text-red-400">Errors: {job.error_count}</span>
                        )}
                        {job.last_run_at && (
                            <span>Last: <span className="text-white">{new Date(job.last_run_at).toLocaleString()}</span></span>
                        )}
                    </div>
                    {job.last_error && (
                        <p className="text-xs text-red-400 mt-1">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {job.last_error}
                        </p>
                    )}
                </div>
                <div className="flex gap-1">
                    {job.status === "ACTIVE" && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => toggleCronJob(job.id, "pause")}
                        >
                            <Pause className="w-3 h-3 mr-1" /> Pause
                        </Button>
                    )}
                    {job.status === "PAUSED" && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => toggleCronJob(job.id, "resume")}
                        >
                            <Play className="w-3 h-3 mr-1" /> Resume
                        </Button>
                    )}
                    {job.status !== "COMPLETED" && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => toggleCronJob(job.id, "cancel")}
                        >
                            <XCircle className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

type CampaignDetail = {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    channels: string[];
    total_leads: number;
    emails_sent: number;
    emails_opened: number;
    emails_replied?: number;
    sms_sent: number;
    sms_delivered: number;
    calls_initiated: number;
    meetings_booked: number;
    meeting_link?: string | null;
    prompt_override?: string | null;
    signature_html?: string | null;
    campaign_branding?: any;
    resource_links?: any;
    auto_reply_enabled?: boolean;
    auto_reply_max_count?: number;
    auto_reply_prompt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    assigned_user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    } | null;
    assigned_pool?: {
        id: string;
        name: string;
    } | null;
    assigned_project?: {
        id: string;
        title: string;
    } | null;
    outreach_items?: {
        id: string;
        status: string;
        channel: string;
    }[];
};


const getStatusColor = (status: string) => {
    switch (status) {
        case "ACTIVE":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "DRAFT":
            return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        case "PAUSED":
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "COMPLETED":
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "ARCHIVED":
            return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        default:
            return "bg-muted/50 text-muted-foreground border-transparent";
    }
};

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.campaignId as string;
    const [activeTab, setActiveTab] = useState("overview");
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [autoReplyLoading, setAutoReplyLoading] = useState(false);
    const [backfillLoading, setBackfillLoading] = useState(false);

    const { data: campaign, error, isLoading, mutate } = useSWR<CampaignDetail>(
        campaignId ? `/api/campaigns/${campaignId}` : null,
        fetcher,
        { revalidateOnFocus: true, refreshInterval: 10000 }
    );

    // Fetch CRON jobs when on that tab
    const { data: cronData, mutate: mutateCron } = useSWR(
        activeTab === "cron" ? `/api/cron/jobs?campaignId=${campaignId}` : null,
        fetcher,
        { refreshInterval: 15000 }
    );
    const cronJobs = (cronData as any)?.jobs?.filter?.((j: any) => j.campaign_id === campaignId) || [];
    const emailJobs = cronJobs.filter((j: any) => j.job_type === "AUTO_FOLLOWUP");
    const voiceJobs = cronJobs.filter((j: any) => j.job_type === "VOICE_BATCH");

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Campaign deleted. ${data.cleaned?.leadsReset || 0} leads reset, ${data.cleaned?.cronJobsCancelled || 0} CRON jobs cancelled.`);
                router.push("/campaigns");
            } else {
                const err = await res.json();
                toast.error(err.message || "Delete failed");
            }
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        }
        setDeleting(false);
        setConfirmDelete(false);
    }

    async function toggleCronJob(jobId: string, action: "pause" | "resume" | "cancel") {
        try {
            const res = await fetch("/api/cron/jobs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, action }),
            });
            if (res.ok) {
                toast.success(`Job ${action}d`);
                mutateCron();
            } else {
                toast.error(`Failed to ${action} job`);
            }
        } catch {
            toast.error(`Failed to ${action} job`);
        }
    }

    async function toggleAutoReply(enable: boolean) {
        setAutoReplyLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/auto-reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: enable }),
            });
            if (res.ok) {
                const data = await res.json();
                mutate();
                if (enable && data.backfill_triggered > 0) {
                    toast.success(`Auto-reply enabled. Processing ${data.backfill_triggered} existing replies...`);
                } else if (enable) {
                    toast.success("Auto-reply enabled. Future replies will be handled by AI.");
                } else {
                    toast.success("Auto-reply disabled.");
                }
            } else {
                toast.error("Failed to update auto-reply settings");
            }
        } catch {
            toast.error("Failed to update auto-reply settings");
        }
        setAutoReplyLoading(false);
    }

    async function backfillReplies() {
        setBackfillLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/auto-reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backfill_only: true }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.backfill_triggered > 0) {
                    toast.success(`Scanning ${data.backfill_triggered} unreplied threads...`);
                } else {
                    toast.success("No unreplied threads found. All caught up!");
                }
            } else {
                toast.error("Failed to scan replies");
            }
        } catch {
            toast.error("Failed to scan replies");
        }
        setBackfillLoading(false);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <p className="text-red-500">Failed to load campaign</p>
                <Button variant="outline" onClick={() => router.push("/campaigns")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Campaigns
                </Button>
            </div>
        );
    }

    const productFocus = campaign.campaign_branding?.product_focus;
    const brandColor = campaign.campaign_branding?.primary_brand_color || "#6366f1";
    const openRate = campaign.emails_sent > 0
        ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100)
        : 0;

    // Count outreach item statuses
    const itemCounts = (campaign.outreach_items || []).reduce(
        (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    // Total auto-replies sent across all outreach items
    const autoRepliesSent = (campaign.outreach_items || []).reduce(
        (sum, item) => sum + ((item as any).auto_reply_count || 0),
        0
    );

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 md:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">{campaign.name}</h1>
                            <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(campaign.status)}`}
                            >
                                {campaign.status}
                            </Badge>
                            {productFocus && (
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-none gap-1">
                                    <Package className="w-3 h-3" />
                                    {productFocus}
                                </Badge>
                            )}
                        </div>
                        {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {campaign.assigned_user && (
                                <span>Created by <span className="font-bold text-foreground">{campaign.assigned_user.name}</span></span>
                            )}
                            {campaign.createdAt && (
                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                            )}
                            <span className="flex items-center gap-1">
                                {(campaign.channels || []).map((ch) => (
                                    <Badge key={ch} variant="outline" className="text-[9px] font-bold border-white/10 gap-0.5 h-5 px-1.5">
                                        {ch === "EMAIL" && <Mail className="w-2.5 h-2.5" />}
                                        {ch === "SMS" && <MessageSquare className="w-2.5 h-2.5" />}
                                        {ch === "PHONE" && <Phone className="w-2.5 h-2.5" />}
                                        {ch}
                                    </Badge>
                                ))}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-white/10"
                            onClick={() => router.push("/crm/accounts?tab=wizard")}
                        >
                            <Zap className="w-4 h-4" />
                            Scrape Accounts
                        </Button>
                        <Button
                            size="sm"
                            className="gap-2 bg-primary"
                            onClick={() => {
                                if (campaign.assigned_pool) {
                                    router.push(`/crm/accounts/lists/${campaign.assigned_pool.id}`);
                                } else {
                                    router.push("/lists");
                                }
                            }}
                        >
                            <Send className="w-4 h-4" />
                            Outreach
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => setConfirmDelete(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                        { label: "Total Accounts", value: campaign.total_leads, icon: Building2, color: "text-emerald-400" },
                        { label: "Emails Sent", value: campaign.emails_sent, icon: Send, color: "text-blue-400" },
                        { label: "Emails Opened", value: campaign.emails_opened, icon: Eye, color: "text-amber-400" },
                        { label: "Open Rate", value: `${openRate}%`, icon: BarChart3, color: "text-purple-400" },
                        { label: "Meetings Booked", value: campaign.meetings_booked, icon: Calendar, color: "text-rose-400" },
                        { label: "SMS Sent", value: campaign.sms_sent, icon: MessageSquare, color: "text-teal-400" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm p-4 space-y-1"
                        >
                            <div className="flex items-center gap-2">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-black">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Email Send Progress Bar */}
                {campaign.status === "ACTIVE" && campaign.total_leads > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-bold uppercase tracking-wider">Send Progress</span>
                            <span className="font-mono font-bold text-primary">
                                {campaign.emails_sent} / {campaign.total_leads}
                                <span className="text-muted-foreground ml-1">
                                    ({campaign.total_leads > 0 ? Math.round((campaign.emails_sent / campaign.total_leads) * 100) : 0}%)
                                </span>
                            </span>
                        </div>
                        <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                style={{ width: `${campaign.total_leads > 0 ? Math.min(100, (campaign.emails_sent / campaign.total_leads) * 100) : 0}%` }}
                            />
                        </div>
                    </div>
                )}

                <Separator className="bg-white/5" />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-background/50 border border-primary/10 rounded-xl p-1">
                        <TabsTrigger value="overview" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Target className="w-3.5 h-3.5" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="lists" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Users className="w-3.5 h-3.5" />
                            Lists
                        </TabsTrigger>
                        <TabsTrigger value="outreach" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            Outreach
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="abtesting" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <FlaskConical className="w-3.5 h-3.5" />
                            A/B Tests
                        </TabsTrigger>
                        <TabsTrigger value="linkedin" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Linkedin className="w-3.5 h-3.5" />
                            LinkedIn
                        </TabsTrigger>
                        <TabsTrigger value="cron" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            CRON Jobs
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        {/* AI Auto-Reply — Hero Section */}
                        <Card className={`backdrop-blur-sm ${campaign.auto_reply_enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${campaign.auto_reply_enabled ? "bg-emerald-500/20" : "bg-indigo-500/20"}`}>
                                            <Zap className={`w-5 h-5 ${campaign.auto_reply_enabled ? "text-emerald-400" : "text-indigo-400"}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                AI Auto-Reply
                                                {campaign.auto_reply_enabled && (
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                {campaign.auto_reply_enabled
                                                    ? "AI is actively monitoring and replying to inbound emails"
                                                    : "Enable to let AI autonomously respond to lead replies using campaign context"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        size="lg"
                                        variant={campaign.auto_reply_enabled ? "default" : "default"}
                                        className={`gap-2 px-6 font-bold text-sm transition-all ${
                                            campaign.auto_reply_enabled
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                                        }`}
                                        onClick={() => toggleAutoReply(!campaign.auto_reply_enabled)}
                                        disabled={autoReplyLoading}
                                    >
                                        {autoReplyLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : campaign.auto_reply_enabled ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                        {campaign.auto_reply_enabled ? "Enabled — Click to Disable" : "Enable AI Auto-Reply"}
                                    </Button>
                                </div>
                            </CardHeader>
                            {campaign.auto_reply_enabled && (
                                <CardContent className="space-y-3 pt-0">
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Replies Received</span>
                                            <div className="text-xl font-black text-emerald-400 mt-1">{campaign.emails_replied || 0}</div>
                                        </div>
                                        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Auto-Replies Sent</span>
                                            <div className="text-xl font-black text-amber-400 mt-1">{autoRepliesSent}</div>
                                        </div>
                                        <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Max Replies / Thread</span>
                                            <div className="text-xl font-black text-indigo-400 mt-1">{campaign.auto_reply_max_count ?? 3}</div>
                                        </div>
                                        <div className="rounded-lg bg-background/50 border border-white/5 p-3 md:col-span-2 flex items-center gap-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 border-white/10 hover:bg-white/5 text-xs"
                                                onClick={backfillReplies}
                                                disabled={backfillLoading}
                                            >
                                                {backfillLoading ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-3 h-3" />
                                                )}
                                                Scan Existing Replies
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground">
                                                Process unreplied inbound threads with AI
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Campaign Brief */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Edit3 className="w-4 h-4 text-primary" />
                                        Campaign Brief
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {campaign.campaign_branding?.campaign_brief ||
                                            campaign.campaign_branding?.mission_statement ||
                                            "No campaign brief set. Edit campaign settings to add one."}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Brand Identity Snapshot */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-primary" />
                                        Brand Identity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {campaign.campaign_branding?.company_name && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Company</span>
                                            <p className="text-sm font-semibold">{campaign.campaign_branding.company_name}</p>
                                        </div>
                                    )}
                                    {productFocus && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Product Focus</span>
                                            <p className="text-sm font-semibold">{productFocus}</p>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.persona_preset && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Voice</span>
                                            <p className="text-sm">{campaign.campaign_branding.persona_preset}</p>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.brand_voice && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tone</span>
                                            <p className="text-sm text-muted-foreground">{campaign.campaign_branding.brand_voice}</p>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.outreach_approach && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Outreach Approach</span>
                                            <p className="text-sm text-muted-foreground">{campaign.campaign_branding.outreach_approach}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ICP Targeting */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Target className="w-4 h-4 text-primary" />
                                        ICP Targeting
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {campaign.campaign_branding?.target_industries?.length > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Industries</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {campaign.campaign_branding.target_industries.map((ind: string) => (
                                                    <Badge key={ind} variant="secondary" className="text-[10px]">{ind}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.target_geos?.length > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Geographies</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {campaign.campaign_branding.target_geos.map((geo: string) => (
                                                    <Badge key={geo} variant="secondary" className="text-[10px]">{geo}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.ideal_customer_profile && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ideal Customer</span>
                                            <p className="text-sm text-muted-foreground mt-1">{campaign.campaign_branding.ideal_customer_profile}</p>
                                        </div>
                                    )}
                                    {campaign.campaign_branding?.key_value_props?.length > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Value Props</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {campaign.campaign_branding.key_value_props.map((prop: string) => (
                                                    <Badge key={prop} variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">{prop}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Outreach Pipeline */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Send className="w-4 h-4 text-primary" />
                                        Outreach Pipeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {Object.entries(itemCounts).length > 0 ? (
                                        Object.entries(itemCounts).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between">
                                                <span className="text-xs uppercase tracking-wider text-muted-foreground">{status}</span>
                                                <Badge variant="outline" className="text-[10px] font-bold border-white/10">{count}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No outreach items yet. Launch the wizard to start.</p>
                                    )}
                                    {campaign.meeting_link && (
                                        <div className="pt-3 mt-2 border-t border-white/5">
                                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Meeting Link</span>
                                            <a href={campaign.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mt-0.5 truncate">
                                                {campaign.meeting_link}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Lists Tab */}
                    <TabsContent value="lists" className="mt-6">
                        <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-white/5">
                            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                            {campaign.assigned_pool ? (
                                <div>
                                    <h3 className="font-bold mb-2">Linked List: {campaign.assigned_pool.name}</h3>
                                    <Button
                                        variant="default"
                                        className="mt-2"
                                        onClick={() => router.push(`/crm/accounts/lists/${campaign.assigned_pool!.id}`)}
                                    >
                                        View List Details
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-bold mb-2">No lists linked yet</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Use the LeadGen Wizard to scrape accounts into a list, then link it to this campaign.</p>
                                    <Button onClick={() => router.push("/crm/accounts?tab=wizard")}>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Launch LeadGen Wizard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Outreach Tab */}
                    <TabsContent value="outreach" className="mt-6">
                        <CampaignContactTracker campaignId={campaignId} onRefresh={() => mutate()} />
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Funnel */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Conversion Funnel</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { label: "Accounts Scraped", value: campaign.total_leads, color: "bg-emerald-500" },
                                        { label: "Emails Sent", value: campaign.emails_sent, color: "bg-blue-500" },
                                        { label: "Emails Opened", value: campaign.emails_opened, color: "bg-amber-500" },
                                        { label: "Meetings Booked", value: campaign.meetings_booked, color: "bg-rose-500" },
                                    ].map((step) => {
                                        const maxVal = Math.max(campaign.total_leads, 1);
                                        const pct = Math.round((step.value / maxVal) * 100);
                                        return (
                                            <div key={step.label}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">{step.label}</span>
                                                    <span className="font-bold">{step.value} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${step.color}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* Channels Breakdown */}
                            <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Channel Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-bold">Email</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">{campaign.emails_sent} sent</div>
                                            <div className="text-xs text-muted-foreground">{openRate}% open rate</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-teal-400" />
                                            <span className="text-sm font-bold">SMS</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">{campaign.sms_sent} sent</div>
                                            <div className="text-xs text-muted-foreground">{campaign.sms_delivered} delivered</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-bold">Phone</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">{campaign.calls_initiated} calls</div>
                                            <div className="text-xs text-muted-foreground">{campaign.meetings_booked} meetings</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* A/B Testing Tab */}
                    <TabsContent value="abtesting" className="mt-6">
                        <ABTestingPanel campaignId={campaignId} />
                    </TabsContent>

                    {/* LinkedIn Tab */}
                    <TabsContent value="linkedin" className="mt-6">
                        <LinkedInSequencePanel campaignId={campaignId} />
                    </TabsContent>

                    {/* CRON Jobs Tab */}
                    <TabsContent value="cron" className="mt-6">
                        <Tabs defaultValue="email" className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="bg-background/50 border border-primary/10 rounded-xl p-1">
                                    <TabsTrigger value="email" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                        Email Follow-ups
                                    </TabsTrigger>
                                    <TabsTrigger value="voice" className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        Voice Batches
                                    </TabsTrigger>
                                </TabsList>
                                <Badge variant="outline" className="hidden sm:inline-flex">{cronJobs.length} total jobs</Badge>
                            </div>

                            <TabsContent value="email" className="mt-0">
                                {emailJobs.length === 0 ? (
                                    <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-white/5">
                                        <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                                        <h3 className="font-bold">No Email CRON Jobs</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Auto follow-up email jobs will appear here when configured.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {emailJobs.map((job: any) => (
                                            <CronJobCard key={job.id} job={job} toggleCronJob={toggleCronJob} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="voice" className="mt-0">
                                {voiceJobs.length === 0 ? (
                                    <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-white/5">
                                        <Phone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                                        <h3 className="font-bold">No Voice CRON Jobs</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Voice batching jobs will appear here when an AI Voice payload is configured.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {voiceJobs.map((job: any) => (
                                            <CronJobCard key={job.id} job={job} toggleCronJob={toggleCronJob} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>

                {/* Delete Confirmation Overlay */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-card border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Delete Campaign</h3>
                                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                                </div>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
                                <p className="text-sm">This will:</p>
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                                    <li>Delete all outreach items for this campaign</li>
                                    <li>Reset all leads back to <span className="text-white font-bold">IDLE</span> status</li>
                                    <li>Cancel all CRON jobs linked to this campaign</li>
                                    <li>Permanently delete the campaign record</li>
                                </ul>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="gap-2"
                                >
                                    {deleting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4" /> Delete Campaign</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
