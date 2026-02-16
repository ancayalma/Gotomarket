"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { closeDealAndCreateProject } from "@/actions/crm/close-deal-and-create-project";
import { createInvoiceFromOpportunity } from "@/actions/invoice/create-invoice-from-opportunity";
import { crm_Opportunity_Status } from "@prisma/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Landmark, Coins, Calendar, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { UpdateOpportunityForm } from "../../components/UpdateOpportunityForm";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

interface OpportunityActionsProps {
    opportunityId: string;
    data: any;
    status?: crm_Opportunity_Status | null;
    hasAccount?: boolean;
}

export function OpportunityActions({ opportunityId, data, status, hasAccount }: OpportunityActionsProps) {
    const [open, setOpen] = useState(false);
    const [loadingClose, setLoadingClose] = useState(false);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const { data: crmData } = useSWR("/api/crm/opportunity", fetcher);

    const isClosed = status === "CLOSED"; // Or WON if using that logic internally

    const onCloseDeal = async () => {
        try {
            setLoadingClose(true);
            const res = await closeDealAndCreateProject(opportunityId);

            if (res.success) {
                toast({
                    title: "Congratulations!",
                    description: "Deal closed and Project created successfully.",
                });
                router.refresh();
                if (res.data?.projectId) {
                    router.push(`/projects/boards/${res.data.projectId}`);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: res.error || "Failed to close deal",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setLoadingClose(false);
        }
    };

    const onCreateInvoice = async () => {
        try {
            setLoadingInvoice(true);
            const res = await createInvoiceFromOpportunity(opportunityId);

            if (res.success) {
                toast({
                    title: "Invoice Created",
                    description: "Draft invoice generated successfully.",
                });
                router.refresh();
                if (res.data?.invoiceId) {
                    router.push(`/invoice/${res.data.invoiceId}`);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: res.error || "Failed to create invoice",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setLoadingInvoice(false);
        }
    };


    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={onCreateInvoice}
                disabled={loadingInvoice}
                variant="outline"
                className="gap-2 h-9 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                size="sm"
            >
                {loadingInvoice ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <FileText className="h-4 w-4 text-orange-400" />}
                Create Invoice
            </Button>

            {!isClosed && (
                <Button
                    onClick={onCloseDeal}
                    disabled={loadingClose}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 shadow-lg shadow-emerald-900/20"
                    size="sm"
                >
                    {loadingClose ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Close Won (Create Project)
                </Button>
            )}

            {isClosed && (
                <div className="flex items-center gap-2 text-emerald-400 font-bold px-4 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Closed Won</span>
                </div>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group">
                        <MoreHorizontal className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0a] border-white/10">
                    <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer gap-2 py-2.5">
                        <Pencil className="h-4 w-4 text-blue-400" />
                        <span>Edit Details</span>
                    </DropdownMenuItem>
                    {/* Add more actions here if needed */}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-white">Edit Opportunity</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <UpdateOpportunityForm
                            initialData={data}
                            setOpen={setOpen}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
