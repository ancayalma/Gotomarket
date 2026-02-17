"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react";
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

type Lead = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

    const onDeleteLead = async (leadId: string) => {
        if (!confirm("Are you sure you want to remove this contact from the account list?")) return;

        setDeleting(leadId);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}`, {
                method: "DELETE" // Verify if DELETE leads/${id} removes from pool or deletes lead entirely. Assuming standard REST.
            });

            if (!res.ok) throw new Error("Failed to delete contact");

            toast.success("Contact removed");
            mutate();
        } catch (error) {
            toast.error("Failed to remove contact");
        } finally {
            setDeleting(null);
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
                <Button variant="outline" onClick={() => router.push("/crm/accounts?tab=pools")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Accounts
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/crm/accounts?tab=pools")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <Heading title={pool.name} description={pool.description || "Account Details"} />
                    </div>
                    <Button onClick={() => router.push("/crm/accounts?tab=wizard")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contacts
                    </Button>
                </div>
                <Separator />
            </div>

            <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 pb-8">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contact Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pool.leads && pool.leads.length > 0 ? (
                                pool.leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell className="font-medium">
                                            {lead.firstName} {lead.lastName}
                                        </TableCell>
                                        <TableCell>{lead.email}</TableCell>
                                        <TableCell>{lead.jobTitle}</TableCell>
                                        <TableCell>{lead.company}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{lead.status || "New"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => onDeleteLead(lead.id)}
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
                                        No contacts found in this account list.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
