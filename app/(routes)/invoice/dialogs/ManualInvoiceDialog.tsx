
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { createManualInvoice } from "@/actions/invoice/create-manual-invoice";
import { getLeads } from "@/actions/crm/get-leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export function ManualInvoiceDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Data states
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(false);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);

    // Selection states
    const [selectedLead, setSelectedLead] = useState<string>("");
    const [selectedOpp, setSelectedOpp] = useState<string>("");
    const [selectedQuote, setSelectedQuote] = useState<string>("");

    // Context states (Read-only info)
    const [oppRevenue, setOppRevenue] = useState<string>("");

    // Form states
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [description, setDescription] = useState("");

    const router = useRouter();

    useEffect(() => {
        if (open) {
            const fetchInitialData = async () => {
                setIsLoadingLeads(true);
                try {
                    const leadsData = await getLeads();
                    setLeads(leadsData);
                } catch (error) {
                    console.error("Failed to fetch leads", error);
                } finally {
                    setIsLoadingLeads(false);
                }
            };
            fetchInitialData();
        } else {
            // Reset states when closing
            setSelectedLead("");
            setSelectedOpp("");
            setOpportunities([]);
            setQuotes([]);
            setSelectedQuote("");
            setOppRevenue("");
            setAmount("");
            setNumber("");
            setDescription("");
        }
    }, [open]);

    const handleLeadSelect = (id: string) => {
        setSelectedLead(id);
        setSelectedOpp("");
        setSelectedQuote("");
        setQuotes([]);
        setOppRevenue("");

        if (id) {
            const lead = leads.find(l => l.id === id);
            if (lead) {
                setOpportunities(lead.opportunities || []);
                if (lead.opportunities?.length > 0) {
                    toast.info(`${lead.opportunities.length} opportunities found for ${lead.firstName || ''} ${lead.lastName}`);
                } else {
                    toast.warning("No opportunities found for this lead");
                }
            }
        } else {
            setOpportunities([]);
        }
    };

    const handleOppSelect = (id: string) => {
        setSelectedOpp(id);
        setSelectedQuote("");
        if (id) {
            const opp = opportunities.find(o => o.id === id);
            if (opp) {
                setQuotes(opp.quotes || []);

                // Track Projected Revenue context
                const revenue = opp.budget || opp.expected_revenue || 0;
                setOppRevenue(revenue.toString());

                // Pre-fill fields from Opportunity
                setAmount(revenue.toString());
                setNumber(opp.name ? `INV-${opp.name.substring(0, 10).toUpperCase().replace(/\s+/g, '-')}` : "");
                setDescription(opp.description || `Invoice for ${opp.name}`);

                if (!opp.quotes || opp.quotes.length === 0) {
                    toast.info("Amount pre-filled from opportunity value", {
                        icon: <Sparkles className="h-4 w-4 text-amber-500" />
                    });
                }
            }
        } else {
            setQuotes([]);
            setOppRevenue("");
        }
    };

    const handleQuoteSelect = (id: string) => {
        setSelectedQuote(id);
        if (id) {
            const quote = quotes.find(q => q.id === id);
            if (quote) {
                setAmount(quote.totalAmount?.toString() || "");
                toast.info("Amount updated from quote", {
                    icon: <Sparkles className="h-4 w-4 text-emerald-500" />
                });
            }
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await createManualInvoice(formData);

            if (result.success && result.invoiceId) {
                toast.success("Invoice created!");
                setOpen(false);
                router.push(`/invoice/detail/${result.invoiceId}`);
            } else {
                toast.error(result.error || "Failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="group relative w-full p-3 overflow-hidden transition-colors duration-300 bg-background border border-border hover:border-primary/50 rounded-2xl h-[110px] cursor-pointer">
                    <PlusCircle
                        className="absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-[color,background-color,border-color,transform] duration-700 pointer-events-none opacity-10 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary text-emerald-400"
                    />
                    <div className="relative z-10 w-full h-full flex flex-col items-start pl-1 justify-center">
                        <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent py-0.5 px-2 leading-tight mb-0.5">
                            Create New
                        </h3>
                        <span className="block text-xl font-bold tracking-tight text-foreground mt-0.5 px-2">
                            Manual Invoice
                        </span>
                    </div>
                    {/* Subtle Glow on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Create Manual Invoice</DialogTitle>
                    <DialogDescription>
                        Hierarchical billing: Lead → Opportunity → Deal Item.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <input type="hidden" name="opportunityId" value={selectedOpp} />
                    <input type="hidden" name="quoteId" value={selectedQuote} />

                    <div className="grid gap-4 py-4">
                        {/* 1. Lead Selector */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right whitespace-nowrap text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                Lead
                            </Label>
                            <div className="col-span-3">
                                <Combobox
                                    options={leads.map(l => ({
                                        label: `${l.firstName || ''} ${l.lastName} ${l.company ? `(${l.company})` : ''}`,
                                        value: l.id
                                    }))}
                                    value={selectedLead}
                                    onChange={handleLeadSelect}
                                    isLoading={isLoadingLeads}
                                    placeholder="Search Leads..."
                                />
                            </div>
                        </div>

                        {/* 2. Opportunity Selector (Enabled if Lead selected) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right whitespace-nowrap text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                Opportunity
                            </Label>
                            <div className="col-span-3">
                                <Combobox
                                    options={opportunities.map(o => ({ label: o.name || 'Unnamed Opp', value: o.id }))}
                                    value={selectedOpp}
                                    onChange={handleOppSelect}
                                    disabled={!selectedLead}
                                    placeholder={selectedLead ? "Link an opportunity..." : "Select lead first"}
                                />
                            </div>
                        </div>

                        {/* Opportunity Revenue Indicator (ReadOnly) */}
                        {oppRevenue && (
                            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div className="text-right flex items-center justify-end gap-1.5 opacity-70">
                                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Deal Value</span>
                                </div>
                                <div className="col-span-3">
                                    <div className="bg-[#18181b] border border-[#27272a] rounded-md px-3 py-1.5 text-sm font-medium text-emerald-400 flex items-center justify-between">
                                        <span>Projected Revenue:</span>
                                        <span className="font-bold font-mono">${parseFloat(oppRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Deal Item Selector (Visible if Opp selected and has quotes) */}
                        {quotes.length > 0 && (
                            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                <Label className="text-right whitespace-nowrap text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                    Deal Item
                                </Label>
                                <div className="col-span-3">
                                    <Combobox
                                        options={quotes.map(q => ({ label: q.title, value: q.id }))}
                                        value={selectedQuote}
                                        onChange={handleQuoteSelect}
                                        placeholder="Select deal item / quote..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t border-white/5">
                            <Label htmlFor="number" className="text-right">
                                Number
                            </Label>
                            <Input
                                id="number"
                                name="number"
                                placeholder="INV-001"
                                className="col-span-3"
                                required
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount ($)
                            </Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="100.00"
                                className="col-span-3"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Consulting Services"
                                className="col-span-3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
