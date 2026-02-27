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
    Loader2
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

export default function CampaignsView() {
    const { data, error, isLoading } = useSWR("/api/campaigns", fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const campaigns = data?.campaigns || [];

    const filteredCampaigns = campaigns.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error) return <div className="p-8 text-center text-red-500">Failed to load campaigns</div>;

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
                            <TableHead className="text-right">Sent</TableHead>
                            <TableHead className="text-right">Opened</TableHead>
                            <TableHead className="text-right">Meetings</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
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
                                <TableRow key={campaign.id} className="group">
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
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Users className="w-3 h-3" />
                                            {campaign.total_leads || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Stats</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Sequence</DropdownMenuItem>
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

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-sm overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{title}</CardTitle>
                <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-current opacity-20 ${color}`} />
        </Card>
    );
}
