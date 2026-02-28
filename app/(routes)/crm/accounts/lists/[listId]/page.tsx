"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2, Trash2, Search, ArrowUpDown, CheckCircle2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { LearnLink } from "@/components/ui/LearnLink";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Lead = {
    id: string;
    accountId?: string;
    contactId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    status: string;
    createdAt: string;
};

type PoolDetails = {
    id: string;
    name: string;
    description: string;
    leads: Lead[];
    _count: {
        leads: number;
    };
};

export default function AccountListDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const listId = params.listId as string;

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lead, direction: 'asc' | 'desc' } | null>({
        key: 'company',
        direction: 'asc'
    });

    const { data: poolInfo, error: poolError, isLoading: poolLoading } = useSWR<Omit<PoolDetails, "leads">>(
        listId ? `/api/crm/leads/pools/${listId}` : null,
        fetcher
    );

    const { data: leadsData, error: leadsError, isLoading: leadsLoading, mutate: mutateLeads } = useSWR<{ leads: Lead[] }>(
        listId ? `/api/crm/leads/pools/${listId}/leads` : null,
        fetcher
    );

    const pool = poolInfo ? { ...poolInfo, leads: leadsData?.leads || [] } : null;
    const isLoading = poolLoading || leadsLoading;
    const error = poolError || leadsError;
    const mutate = () => {
        mutateLeads();
    };

    const [deleting, setDeleting] = useState<string | null>(null);
    const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

    const onSort = (key: keyof Lead) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedLeads = (pool?.leads || [])
        .filter(lead => {
            const searchStr = `${lead.company || ""} ${lead.firstName || ""} ${lead.lastName || ""} ${lead.email || ""} ${lead.phone || ""}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            // Special handling for Account Name (company || lastName)
            let aValue = (key === 'company' ? (a.company || a.lastName) : a[key]) || "";
            let bValue = (key === 'company' ? (b.company || b.lastName) : b[key]) || "";

            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

    const onDeleteLead = async (leadId: string) => {
        setDeleting(leadId);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete contact");

            toast.success("Contact removed");
            setLeadToDelete(null);
            mutate();
        } catch (error) {
            toast.error("Failed to remove contact");
        } finally {
            setDeleting(null);
        }
    };

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase() || "NEW";
        switch (s) {
            case "CONVERTED": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
            case "SENT":
            case "CONTACTED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "OPENED": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "REPLIED":
            case "MEETING_BOOKED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "NEW":
            case "IDENTIFIED": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
            case "REJECTED": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "ACTIVE": return "bg-green-500/10 text-green-500 border-green-500/20";
            default: return "bg-muted/50 text-muted-foreground border-transparent";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !pool) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <p className="text-red-500">Failed to load account details</p>
                <Button variant="outline" onClick={() => router.push("/lists")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Accounts
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <LearnLink
                tab="accounts"
                overviewTitle="Account Intelligence List"
                overviewWhat="A curated collection of regional or industry-specific organizations staged for active outreach and vetting."
                overviewWhy="Lists act as 'mini-databases' that allow you to segment your market. This view focuses strictly on the data health and status of those segmented records before they are fully committed to a workflow."
                overviewHow="Monitor the 'Status' column to see which leads are ready for promotion. Use the 'Approval Center' button to verify data accuracy or the 'Add Contacts' wizard to expand the current batch."
            />
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/lists")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <Heading title={pool.name} description={pool.description || "Account Details"} />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => router.push(`/crm/accounts/lists/${listId}/approve`)}
                        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approval Center
                    </Button>
                    <Button onClick={() => router.push("/crm/accounts?tab=wizard")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contacts
                    </Button>
                </div>
                <Separator />

                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 pb-8">
                <div className="rounded-md border bg-card/50 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('company')}>
                                    <div className="flex items-center gap-1">
                                        Account Name
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('email')}>
                                    <div className="flex items-center gap-1">
                                        Email
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSort('status')}>
                                    <div className="flex items-center gap-1">
                                        Status
                                        <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedLeads.length > 0 ? (
                                filteredAndSortedLeads.map((lead) => (
                                    <TableRow key={lead.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-semibold text-primary">
                                            {lead.accountId ? (
                                                <button
                                                    onClick={() => router.push(`/crm/accounts/${lead.accountId}`)}
                                                    className="hover:underline text-left transition-colors"
                                                >
                                                    {lead.company || lead.lastName}
                                                </button>
                                            ) : (
                                                <span>{lead.company || lead.lastName}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                            {lead.email || "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {lead.phone || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {lead.contactId ? (
                                                    <button
                                                        onClick={() => router.push(`/crm/contacts/${lead.contactId}`)}
                                                        className="font-medium hover:underline text-left transition-colors"
                                                    >
                                                        {lead.firstName} {lead.lastName}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                                                )}
                                                {lead.jobTitle && <span className="text-xs text-muted-foreground">{lead.jobTitle}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`font-mono text-[10px] uppercase tracking-wider border ${getStatusStyles(lead.status)}`}
                                            >
                                                {lead.status === 'CONVERTED' ? 'In CRM' : (lead.status || "New")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => setLeadToDelete(lead)}
                                                disabled={deleting === lead.id}
                                            >
                                                {deleting === lead.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {searchTerm ? "No results found matching your search." : "No contacts found in this account list."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
                <AlertDialogContent className="bg-card border-white/10 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-destructive">Remove from List</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to remove <span className="text-foreground font-semibold">{leadToDelete?.firstName} {leadToDelete?.lastName}</span> from this list?
                            This will not delete the contact from the CRM, but will remove them from this specific account list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="border-white/10 hover:bg-white/5 uppercase tracking-widest text-[10px] font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => leadToDelete && onDeleteLead(leadToDelete.id)}
                            className="bg-red-600 hover:bg-red-700 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-red-600/20"
                        >
                            {deleting ? "Removing..." : "Remove Contact"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
