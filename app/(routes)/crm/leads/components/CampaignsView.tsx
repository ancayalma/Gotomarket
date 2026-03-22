"use client";

import React, { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import {
    Megaphone,
    Plus,
    MoreHorizontal,
    Mail,
    MousePointer2,
    Calendar,
    Users,
    Search,
    Filter,
    ArrowUpRight,
    Loader2,
    ArrowLeft,
    Settings2,
    Clock,
    Pause,
    Play,
    Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OutreachCampaignWizard from "./OutreachCampaignWizard";
import CampaignContactTracker from "./CampaignContactTracker";
import { toast } from "react-hot-toast";

export default function CampaignsView() {
    const { data, error, isLoading } = useSWR("/api/campaigns", fetcher, { refreshInterval: 10000 });
    const [searchQuery, setSearchQuery] = useState("");
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    const campaigns = data?.campaigns || [];

    const filteredCampaigns = campaigns.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedCampaign = selectedCampaignId
        ? campaigns.find((c: any) => c.id === selectedCampaignId)
        : null;

    if (error) return <div className="p-8 text-center text-red-500">Failed to load campaigns</div>;

    // ─── Campaign Detail View ─────────────────────────────────────────
    if (selectedCampaign) {
        return (
            <CampaignDetail
                campaign={selectedCampaign}
                onBack={() => setSelectedCampaignId(null)}
            />
        );
    }

    // ─── Campaign List View ───────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setIsWizardOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Active Campaigns"
                    value={campaigns.filter((c: any) => c.status === "ACTIVE").length}
                    icon={Megaphone}
                    color="text-blue-500"
                />
                <StatCard
                    title="Total Emails Sent"
                    value={campaigns.reduce((acc: number, c: any) => acc + (c.emails_sent || 0), 0)}
                    icon={Mail}
                    color="text-indigo-500"
                />
                <StatCard
                    title="Avg Open Rate"
                    value={`${(campaigns.reduce((acc: number, c: any) => acc + (c.emails_sent > 0 ? (c.emails_opened / c.emails_sent) : 0), 0) / (campaigns.length || 1) * 100).toFixed(1)}%`}
                    icon={MousePointer2}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Meetings Booked"
                    value={campaigns.reduce((acc: number, c: any) => acc + (c.meetings_booked || 0), 0)}
                    icon={Calendar}
                    color="text-orange-500"
                />
            </div>

            <Card className="border-none shadow-sm bg-muted/20">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Sent</TableHead>
                            <TableHead className="text-right">Opened</TableHead>
                            <TableHead className="text-right">Meetings</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading campaigns...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCampaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No campaigns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCampaigns.map((campaign: any) => (
                                <TableRow
                                    key={campaign.id}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedCampaignId(campaign.id)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{campaign.name}</span>
                                            <span className="text-[10px] text-muted-foreground">Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className={campaign.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" : ""}>
                                            {campaign.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <CampaignProgressBar sent={campaign.emails_sent || 0} total={campaign.total_leads || 0} />
                                    </TableCell>
                                    <TableCell className="text-right">{campaign.emails_sent || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span>{campaign.emails_opened || 0}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {campaign.emails_sent > 0 ? ((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-blue-500">{campaign.meetings_booked || 0}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCampaignId(campaign.id); }}>View Details</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-500">Archive</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <OutreachCampaignWizard
                // For now, new campaigns from this view start without specific leads selected
                selectedLeads={[]}
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
            />
        </div>
    );
}

// ─── Campaign Detail Component ───────────────────────────────────────────────

function CampaignDetail({ campaign, onBack }: { campaign: any; onBack: () => void }) {
    const [showSettings, setShowSettings] = useState(false);

    // Fetch cron jobs for this campaign
    const { data: cronData } = useSWR(
        `/api/cron/jobs?type=AUTO_FOLLOWUP`,
        fetcher
    );
    const campaignJobs = (cronData?.jobs || []).filter(
        (j: any) => j.campaign_id === campaign.id
    );

    const handleCronAction = async (jobId: string, action: string) => {
        try {
            const res = await fetch("/api/cron/jobs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, action }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast.success(action === "pause" ? "Job paused" : action === "resume" ? "Job resumed" : "Job cancelled");
        } catch (err: any) {
            toast.error(err?.message || "Failed to update job");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold">{campaign.name}</h2>
                        <p className="text-xs text-muted-foreground">
                            Created {new Date(campaign.createdAt).toLocaleDateString()} ·{" "}
                            <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                                {campaign.status}
                            </Badge>
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    Settings
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniStat label="Sent" value={campaign.emails_sent || 0} icon={Mail} />
                <MiniStat label="Opened" value={campaign.emails_opened || 0} icon={MousePointer2} />
                <MiniStat label="Meetings" value={campaign.meetings_booked || 0} icon={Calendar} />
                <MiniStat label="Leads" value={campaign.total_leads || 0} icon={Users} />
                <div className="flex flex-col justify-center p-3 rounded-lg border border-border/50 bg-muted/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Send Progress</p>
                    <CampaignProgressBar sent={campaign.emails_sent || 0} total={campaign.total_leads || 0} showLabel />
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <Card className="border border-border/50 bg-muted/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Campaign Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Follow-Up Config Summary */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Auto Follow-Ups</p>
                                <Badge variant={campaign.followup_enabled ? "default" : "secondary"}>
                                    {campaign.followup_enabled ? "Enabled" : "Disabled"}
                                </Badge>
                            </div>
                            {campaign.followup_enabled && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Delay</p>
                                        <p className="font-medium">{Math.round((campaign.followup_delay_hours || 72) / 24)} days</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Follow-Ups</p>
                                        <p className="font-medium">{campaign.followup_max_count || 2}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Cron Jobs */}
                        {campaignJobs.length > 0 && (
                            <div className="border-t pt-3 space-y-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Timer className="w-3 h-3" />
                                    Scheduled Jobs
                                </p>
                                {campaignJobs.map((job: any) => (
                                    <div key={job.id} className="flex items-center justify-between p-2.5 rounded-md bg-background border border-border/50 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${job.status === "ACTIVE" ? "bg-emerald-500" : job.status === "PAUSED" ? "bg-amber-500" : "bg-gray-400"}`} />
                                            <span className="font-medium">{job.label || job.job_type}</span>
                                            <span className="text-muted-foreground">
                                                · runs={job.run_count} · errors={job.error_count}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {job.last_run_at && (
                                                <span className="text-muted-foreground mr-2">
                                                    Last: {new Date(job.last_run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            )}
                                            {job.status === "ACTIVE" ? (
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCronAction(job.id, "pause")}>
                                                    <Pause className="w-3 h-3" />
                                                </Button>
                                            ) : job.status === "PAUSED" ? (
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCronAction(job.id, "resume")}>
                                                    <Play className="w-3 h-3" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Contact Progress Tracker */}
            <CampaignContactTracker campaignId={campaign.id} />
        </div>
    );
}

// ─── Small UI Components ─────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-sm overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{title}</CardTitle>
                <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-current opacity-20 ${color}`} />
        </Card>
    );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/10">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <div>
                <p className="text-lg font-semibold">{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}

function CampaignProgressBar({ sent, total, showLabel }: { sent: number; total: number; showLabel?: boolean }) {
    const pct = total > 0 ? Math.min(Math.round((sent / total) * 100), 100) : 0;
    const color =
        pct >= 80 ? "bg-emerald-500" :
        pct >= 40 ? "bg-amber-500" :
        "bg-sky-500";

    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel ? (
                <span className="text-xs font-semibold tabular-nums whitespace-nowrap">
                    {sent}/{total} ({pct}%)
                </span>
            ) : (
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
            )}
        </div>
    );
}
