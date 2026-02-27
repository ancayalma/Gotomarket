"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    FileText,
    Calendar,
    User,
    MoreHorizontal,
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    Mail,
    Loader2,
    Save
} from "lucide-react";
import { generateQuotePDF } from "@/lib/generate-quote-pdf";
import { SmartEmailModal } from "@/components/modals/SmartEmailModal";
import AlertModal from "@/components/modals/alert-modal";
import { cancelQuote, deleteQuote } from "@/actions/crm/quotes";
import { toast } from "sonner";

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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface QuotesClientProps {
    initialQuotes: any[];
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Clock },
    SENT: { label: "Sent", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ExternalLink },
    ACCEPTED: { label: "Accepted", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: XCircle },
    EXPIRED: { label: "Expired", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle },
};

export default function QuotesClient({ initialQuotes }: QuotesClientProps) {
    const [quotes, setQuotes] = useState(initialQuotes);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    // Email Modal State
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedEmailInfo, setSelectedEmailInfo] = useState<{
        email: string;
        name: string;
        leadId?: string;
        contactId?: string;
    } | null>(null);

    // Cancel Modal State
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [quoteToCancel, setQuoteToCancel] = useState<string | null>(null);

    // Delete Modal State
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);


    const filteredQuotes = quotes.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.account?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadPdf = (quote: any) => {
        try {
            setIsGenerating(quote.id);

            // Calculate Address
            const addressParts = [];
            if (quote.account?.billing_street) addressParts.push(quote.account.billing_street);
            if (quote.account?.billing_city || quote.account?.billing_state || quote.account?.billing_postal_code) {
                const line2 = [quote.account.billing_city, quote.account.billing_state, quote.account.billing_postal_code]
                    .filter(Boolean)
                    .join(", ");
                if (line2) addressParts.push(line2);
            }
            if (quote.account?.billing_country) addressParts.push(quote.account.billing_country);
            const customerAddress = addressParts.length > 0 ? addressParts.join("\n") : undefined;

            const doc = generateQuotePDF({
                quoteNumber: quote.quoteNumber,
                title: quote.title,
                createdAt: quote.createdAt,
                expirationDate: quote.expirationDate,
                accountName: quote.account?.name,
                contactName: quote.contact ? `${quote.contact.first_name} ${quote.contact.last_name}` : undefined,
                totalAmount: quote.totalAmount,
                taxRate: quote.taxRate,
                customerAddress,
                companyName: quote.team?.name,
                logoUrl: quote.team?.logo_url,
                subtotal: quote.items?.reduce((acc: number, item: any) => acc + item.totalPrice, 0) || quote.totalAmount,
                items: quote.items?.map((item: any) => ({
                    name: item.name || item.product?.name || "Product",
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    totalPrice: item.totalPrice
                })) || []
            });

            doc.save(`Proposal_${quote.quoteNumber}.pdf`);
            toast.success("PDF Generated Successfully");
        } catch (error) {
            console.error("[PDF_DOWNLOAD_ERROR]", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleOpenEmailModal = (quote: any) => {
        const email = quote.contact?.email || quote.lead?.email;
        if (!email) {
            toast.error("No email address found for this quote's contact or lead.");
            return;
        }

        const name = quote.contact ?
            `${quote.contact.first_name} ${quote.contact.last_name}` :
            `${quote.lead?.firstName} ${quote.lead?.lastName}`;

        setSelectedEmailInfo({
            email,
            name,
            leadId: quote.leadId,
            contactId: quote.contactId
        });
        setEmailModalOpen(true);
    };

    const handleCancel = async () => {
        if (!quoteToCancel) return;

        try {
            setIsCancelling(true);
            const result = await cancelQuote(quoteToCancel);
            if (result.success) {
                toast.success("Quote cancelled successfully");
                setQuotes((prev) => prev.map(q => q.id === quoteToCancel ? { ...q, status: "REJECTED" } : q));
            } else {
                toast.error(result.error || "Failed to cancel quote");
            }
        } catch (error) {
            toast.error("An error occurred while cancelling the quote");
        } finally {
            setIsCancelling(false);
            setCancelModalOpen(false);
            setQuoteToCancel(null);
        }
    };

    const handleDelete = async () => {
        if (!quoteToDelete) return;

        try {
            setIsDeleting(true);
            const result = await deleteQuote(quoteToDelete);
            if (result.success) {
                toast.success("Quote deleted successfully");
                setQuotes((prev) => prev.filter(q => q.id !== quoteToDelete));
            } else {
                toast.error(result.error || "Failed to delete quote");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the quote");
        } finally {
            setIsDeleting(false);
            setDeleteModalOpen(false);
            setQuoteToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            {selectedEmailInfo && (
                <SmartEmailModal
                    open={emailModalOpen}
                    onOpenChange={setEmailModalOpen}
                    recipientEmail={selectedEmailInfo.email}
                    recipientName={selectedEmailInfo.name}
                    leadId={selectedEmailInfo.leadId}
                    contactId={selectedEmailInfo.contactId}
                />
            )}

            <AlertModal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onConfirm={handleCancel}
                loading={isCancelling}
                title="Cancel Quote"
                description="Are you sure you want to cancel this quote? This will mark it as Rejected."
            />

            <AlertModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                loading={isDeleting}
                title="Delete Quote"
                description="Are you sure you want to permanently delete this quote? This action cannot be undone."
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search quotes by title, #, or account..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Link href="/crm/quotes/builder" className="w-full md:w-auto">
                    <Button className="gap-2 bg-primary w-full md:w-auto">
                        <Plus className="h-4 w-4" />
                        Create New Quote
                    </Button>
                </Link>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Quote Information</TableHead>
                                <TableHead>Account / Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead>Expiration</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredQuotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-muted rounded-full">
                                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-semibold text-foreground">No quotes found</p>
                                                <p className="text-sm">Click the button above to create your first sales quote.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredQuotes.map((quote) => {
                                    const StatusIcon = statusMap[quote.status]?.icon || Clock;
                                    return (
                                        <TableRow key={quote.id} className="group transition-colors hover:bg-muted/40">
                                            <TableCell>
                                                <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 transition-colors">
                                                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground leading-none mb-1">{quote.title}</span>
                                                    <span className="text-xs font-mono text-muted-foreground">{quote.quoteNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-1">
                                                    {quote.account ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center">
                                                                <User className="h-3 w-3 text-blue-500" />
                                                            </div>
                                                            <span className="text-sm font-medium">{quote.account.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">No account</span>
                                                    )}
                                                    {quote.contact && (
                                                        <span className="text-[10px] text-muted-foreground uppercase ml-7">
                                                            Attn: {quote.contact.first_name} {quote.contact.last_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("gap-1.5 px-2 py-0.5 font-semibold", statusMap[quote.status]?.color)}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusMap[quote.status]?.label || quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-foreground">
                                                        ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {quote.items?.length || 0} line items
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {quote.expirationDate ? format(new Date(quote.expirationDate), "MMM dd, yyyy") : "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <Link href={`/crm/quotes/${quote.id}`}>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                                                <ExternalLink className="h-3.5 w-3.5" /> View Details
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer"
                                                            onClick={() => handleDownloadPdf(quote)}
                                                            disabled={isGenerating === quote.id}
                                                        >
                                                            {isGenerating === quote.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Download className="h-3.5 w-3.5" />
                                                            )}
                                                            Download PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 cursor-pointer"
                                                            onClick={() => handleOpenEmailModal(quote)}
                                                        >
                                                            <Mail className="h-3.5 w-3.5" /> Send via Email
                                                        </DropdownMenuItem>

                                                        <div className="h-px bg-muted my-1" />
                                                        <DropdownMenuItem
                                                            className="gap-2 text-destructive cursor-pointer"
                                                            onClick={() => {
                                                                setQuoteToCancel(quote.id);
                                                                setCancelModalOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Cancel Quote
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 text-destructive cursor-pointer font-bold"
                                                            onClick={() => {
                                                                setQuoteToDelete(quote.id);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5 rotate-45" /> Delete Quote
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
