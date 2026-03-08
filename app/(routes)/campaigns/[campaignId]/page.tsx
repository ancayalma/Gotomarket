"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
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

type CampaignDetail = {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    channels: string[];
    total_leads: number;
    emails_sent: number;
    emails_opened: number;
    sms_sent: number;
    sms_delivered: number;
    calls_initiated: number;
    meetings_booked: number;
    meeting_link?: string | null;
    prompt_override?: string | null;
    signature_html?: string | null;
    campaign_branding?: any;
    resource_links?: any;
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

    const { data: campaign, error, isLoading, mutate } = useSWR<CampaignDetail>(
        campaignId ? `/api/campaigns/${campaignId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

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
                                {campaign.channels.map((ch) => (
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
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
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
                        <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-white/5 space-y-4">
                            <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                            <h3 className="font-bold">Outreach Items ({campaign.outreach_items?.length || 0})</h3>
                            {(campaign.outreach_items?.length || 0) > 0 ? (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {Object.entries(itemCounts).map(([status, count]) => (
                                        <Badge key={status} variant="outline" className="text-xs border-white/10">
                                            {status}: {count}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No outreach items yet. First scrape accounts into a list, then start outreach.</p>
                            )}
                        </div>
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
                </Tabs>
            </div>
        </div>
    );
}
