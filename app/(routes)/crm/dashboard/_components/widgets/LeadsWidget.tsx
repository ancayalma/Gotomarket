"use client";

import React, { useState } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { UserPlus, Building2, CalendarIcon, ArrowRight, Plus, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewLeadForm } from "../../../leads/components/NewLeadForm";
import { SmartEmailModal } from "@/components/modals/SmartEmailModal";

interface Lead {
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date | null;
}

interface LeadsWidgetProps {
    leads: Lead[];
}

const LeadInterestIndicator = ({ createdAt }: { createdAt: Date | null }) => {
    const daysSinceAdded = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24) : 100;

    let color = "text-amber-400";
    let bg = "bg-amber-500/10";
    let label = "New";
    let glow = "";

    if (daysSinceAdded < 2) {
        color = "text-emerald-400";
        bg = "bg-emerald-500/20";
        label = "Hot";
        glow = "shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    } else if (daysSinceAdded < 7) {
        color = "text-indigo-400";
        bg = "bg-indigo-500/20";
        label = "Warm";
    } else {
        color = "text-slate-400";
        bg = "bg-slate-500/10";
        label = "Stable";
    }

    return (
        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-full ${bg} border border-white/5`}>
            <div className={`h-1 w-1 rounded-full ${color.replace('text-', 'bg-')} ${glow} ${label === 'Hot' ? 'animate-pulse' : ''}`} />
            <span className={`text-[8px] font-black uppercase tracking-tighter ${color}`}>
                {label}
            </span>
        </div>
    );
};

export const LeadsWidget = ({ leads: initialLeads }: LeadsWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const filteredLeads = initialLeads.filter(lead => {
        const name = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase();
        const company = (lead.company || "").toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: teamData } = useSWR(isModalOpen ? "/api/team/members" : null, fetcher);
    const { data: accountsData } = useSWR(isModalOpen ? "/api/crm/account" : null, fetcher);

    const rightAction = (
        <RightViewModal
            title="Create New Lead"
            description="Complete the form to add a new lead to your pipeline."
            customTrigger
            label={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10 text-primary"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={12} className="mr-1" />
                    NEW LEAD
                </Button>
            }
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
        >
            <NewLeadForm
                users={teamData?.members || []}
                accounts={accountsData || []}
                onFinish={() => setIsModalOpen(false)}
                redirectOnSuccess={false}
            />
        </RightViewModal>
    );

    return (
        <WidgetWrapper
            title="Active Leads"
            icon={UserPlus}
            iconColor="text-indigo-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/crm/leads"
            footerLabel="View All Captured Leads"
            count={initialLeads.length}
            rightAction={rightAction}
        >
            <SmartEmailModal
                open={emailModalOpen}
                onOpenChange={setEmailModalOpen}
                recipientEmail={selectedLead?.email || ""}
                recipientName={`${selectedLead?.firstName || ""} ${selectedLead?.lastName || ""}`}
                leadId={selectedLead?.id}
            />
            <div className="space-y-1.5 pb-4 mt-3">
                {filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <UserPlus className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No leads detected</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <div
                            key={lead.id}
                            className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="space-y-1 overflow-hidden flex-1 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white/90 truncate group-hover:text-primary transition-colors">
                                        {lead.firstName || lead.lastName
                                            ? `${lead.firstName || ""} ${lead.lastName || ""}`
                                            : lead.company || "Unnamed Lead"}
                                    </span>
                                    <LeadInterestIndicator createdAt={lead.createdAt} />
                                </div>

                                <div className="flex items-center gap-3 text-[10px] font-medium">
                                    {lead.company && (
                                        <span className="flex items-center gap-1.5 text-muted-foreground opacity-60 truncate">
                                            <Building2 size={10} className="shrink-0" />
                                            {lead.company}
                                        </span>
                                    )}
                                    {lead.createdAt && (
                                        <span className="flex items-center gap-1.5 text-muted-foreground opacity-60">
                                            <CalendarIcon size={10} className="shrink-0" />
                                            {format(new Date(lead.createdAt), "MMM d")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5 relative z-10">
                                {lead.email && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLead(lead);
                                            setEmailModalOpen(true);
                                        }}
                                    >
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                )}
                                {lead.phone && (
                                    <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300"
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    </a>
                                )}
                                <Link href={`/crm/leads/${lead.id}`}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
