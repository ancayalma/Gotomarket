"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Trash2,
    Calculator,
    ChevronLeft,
    Save,
    Search,
    Package,
    ShoppingCart,
    Info,
    Calendar as CalendarIcon,
    User,
    Building2,
    CheckCircle2,
    Loader2,
    Briefcase,
    FileText,
    Settings2,
    MessageSquare,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createQuote } from "@/actions/crm/quotes";
import { searchCrmEntities } from "@/actions/crm/search";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    description?: string;
    category?: string;
}

interface QuoteBuilderClientProps {
    products: Product[];
    initialAccounts?: { id: string, name: string }[];
    initialContacts?: { id: string, first_name?: string, last_name: string }[];
    initialLeads?: { id: string, firstName?: string, lastName: string }[];
}

interface LineItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number; // percentage
}

export default function QuoteBuilderClient({ products, initialAccounts = [], initialContacts = [], initialLeads = [] }: QuoteBuilderClientProps) {
    const router = useRouter();
    const [title, setTitle] = useState(`New Proposal - ${format(new Date(), "PP")}`);
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [selectedContact, setSelectedContact] = useState<string>("");
    const [selectedLead, setSelectedLead] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [terms, setTerms] = useState("Standard payment terms apply. Valid for 30 days.");
    const [expirationDate, setExpirationDate] = useState<Date>(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    );
    const [items, setItems] = useState<LineItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Lists & Search
    const [accounts, setAccounts] = useState(initialAccounts);
    const [contacts, setContacts] = useState(initialContacts);
    const [leads, setLeads] = useState(initialLeads);
    const [isSearching, setIsSearching] = useState({ accounts: false, contacts: false, leads: false });

    const handleSearch = async (type: "account" | "contact" | "lead", query: string) => {
        if (!query || query.length < 2) return;

        setIsSearching(prev => ({ ...prev, [type + "s"]: true }));
        try {
            const results = await searchCrmEntities(query, type, selectedAccount || undefined);
            if (type === "account") setAccounts(results as any);
            if (type === "contact") setContacts(results as any);
            if (type === "lead") setLeads(results as any);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(prev => ({ ...prev, [type + "s"]: false }));
        }
    };

    // Derived values
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }, [items]);

    const totalDiscount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discount / 100)), 0);
    }, [items]);

    const total = subtotal - totalDiscount;

    const addItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.price,
            discount: 0
        }]);
        toast.success(`Added ${product.name} to quote`);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!selectedAccount) {
            toast.error("Please select an account");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one item to the quote");
            return;
        }

        setIsSaving(true);
        try {
            const res = await createQuote({
                title,
                accountId: selectedAccount,
                contactId: selectedContact || undefined,
                leadId: selectedLead || undefined,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    discount: Number(item.discount),
                    totalPrice: (item.quantity * item.unitPrice) * (1 - item.discount / 100)
                })),
                totalAmount: total,
                expirationDate: expirationDate
            });

            if (res.success) {
                toast.success("Quote created successfully!");
                router.push("/crm/quotes");
            } else {
                toast.error(res.error || "Failed to create quote");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20">
            {/* Left Column: Configuration & Items */}
            <div className="lg:col-span-3 space-y-6">
                <Card className="glass border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FileText className="h-32 w-32 rotate-12" />
                    </div>
                    <CardHeader className="pb-4 relative z-10">
                        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            Proposal Command Center
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        {/* Row 1: Aligned Title, Reference, and Date */}
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="flex-[2] space-y-2 w-full">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] mb-1 block">
                                    Proposal Identifier / Title
                                </label>
                                <Input
                                    placeholder="e.g. Enterprise Software License Q1"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="font-black text-lg bg-white/5 border-white/10 focus:border-primary/50 transition-all h-14 uppercase"
                                />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] mb-1 block">
                                    Expiration Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-black text-lg bg-white/5 border-white/10 h-14 transition-all hover:bg-white/10",
                                                !expirationDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                            {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0a0a0a] border-white/20 shadow-2xl" align="start">
                                        <div className="bg-[#0a0a0a] rounded-xl overflow-hidden p-2">
                                            <Calendar
                                                mode="single"
                                                selected={expirationDate}
                                                onSelect={(date) => date && setExpirationDate(date)}
                                                initialFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Row 2: Metadata - Status, Currency, Reference */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] block">
                                    System Status
                                </label>
                                <Select defaultValue="DRAFT">
                                    <SelectTrigger className="bg-white/5 border-white/10 h-10 font-bold text-[10px] tracking-widest uppercase">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/20 text-white">
                                        <SelectItem value="DRAFT">Draft Mode</SelectItem>
                                        <SelectItem value="SENT">Transmitted</SelectItem>
                                        <SelectItem value="SIGNED">Executed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] block">
                                    Transaction Currency
                                </label>
                                <Select defaultValue="USD">
                                    <SelectTrigger className="bg-white/5 border-white/10 h-10 font-bold text-[10px] tracking-widest uppercase">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/20 text-white">
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="GBP">GBP - Pound Sterling</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] block">
                                    Internal Reference #
                                </label>
                                <div className="h-10 px-3 flex items-center bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-white/40 tracking-widest uppercase">
                                    QB-{Math.random().toString(36).substring(2, 9).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Account, Contact, Lead */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em] mb-2 block">
                                    Organization / Account
                                </label>
                                <Combobox
                                    options={accounts.map(acc => ({ label: acc.name, value: acc.id }))}
                                    value={selectedAccount}
                                    onChange={(val) => {
                                        setSelectedAccount(val);
                                        setSelectedContact("");
                                        setSelectedLead("");
                                    }}
                                    onSearch={(q) => handleSearch("account", q)}
                                    isLoading={isSearching.accounts}
                                    placeholder="Search accounts..."
                                    className="bg-white/5 border-white/10 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block transition-colors",
                                    !selectedAccount ? "text-white/20" : "text-white/40"
                                )}>
                                    Primary Contact {!selectedAccount && "(Locked)"}
                                </label>
                                <Combobox
                                    options={contacts.map(c => ({ label: `${c.first_name || ""} ${c.last_name}`.trim(), value: c.id }))}
                                    value={selectedContact}
                                    disabled={!selectedAccount}
                                    onChange={(val) => {
                                        setSelectedContact(val);
                                        if (val) setSelectedLead("");
                                    }}
                                    onSearch={(q) => handleSearch("contact", q)}
                                    isLoading={isSearching.contacts}
                                    placeholder={selectedAccount ? "Search account contacts..." : "Select account first..."}
                                    className={cn(
                                        "h-11 transition-all",
                                        !selectedAccount ? "bg-white/[0.02] border-white/5 text-white/20" : "bg-white/5 border-white/10"
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block transition-colors",
                                    !selectedAccount ? "text-white/20" : "text-white/40"
                                )}>
                                    Associate Lead {!selectedAccount && "(Locked)"}
                                </label>
                                <Combobox
                                    options={leads.map(l => ({ label: `${l.firstName || ""} ${l.lastName}`.trim(), value: l.id }))}
                                    value={selectedLead}
                                    disabled={!selectedAccount}
                                    onChange={(val) => {
                                        setSelectedLead(val);
                                        if (val) setSelectedContact("");
                                    }}
                                    onSearch={(q) => handleSearch("lead", q)}
                                    isLoading={isSearching.leads}
                                    placeholder={selectedAccount ? "Search account leads..." : "Select account first..."}
                                    className={cn(
                                        "h-11 transition-all",
                                        !selectedAccount ? "bg-white/[0.02] border-white/5 text-white/20" : "bg-white/5 border-white/10"
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-white/10 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white/5">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Line Items
                        </CardTitle>
                        <div className="w-[300px]">
                            <Combobox
                                options={products.map(p => ({
                                    label: `${p.name} (${p.sku}) - $${p.price}`,
                                    value: p.id
                                }))}
                                value=""
                                onChange={addItem}
                                placeholder="Add a product..."
                                className="bg-primary text-primary-foreground border-none hover:bg-primary/90 transition-all font-bold"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10">
                                    <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest text-white/40">Product</TableHead>
                                    <TableHead className="w-24 text-[10px] font-bold uppercase tracking-widest text-white/40">Qty</TableHead>
                                    <TableHead className="w-32 text-[10px] font-bold uppercase tracking-widest text-white/40">Unit Price</TableHead>
                                    <TableHead className="w-24 text-[10px] font-bold uppercase tracking-widest text-white/40">Disc %</TableHead>
                                    <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-widest text-white/40">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow className="border-white/5">
                                        <TableCell colSpan={6} className="text-center py-16 text-white/20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 rounded-full bg-white/5 border border-white/10 shadow-inner">
                                                    <Package className="h-10 w-10 opacity-40 text-primary" />
                                                </div>
                                                <p className="text-sm font-medium italic">No products added yet. Use the search above to start configuration.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-white/5 transition-colors border-white/5 group">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-white/90">{item.productName}</span>
                                                    <span className="text-[10px] uppercase font-mono text-white/40 tracking-tighter">{item.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    className="h-9 text-center bg-white/5 border-white/10 focus:border-primary/50 w-20"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                                        className="h-9 pl-5 text-right font-mono bg-white/5 border-white/10 focus:border-primary/50 w-28"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        max="100"
                                                        min="0"
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                                                        className="h-9 text-center bg-white/5 border-white/10 focus:border-primary/50 w-16 pr-1"
                                                    />
                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/30">%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black pr-6 text-primary">
                                                ${((item.quantity * item.unitPrice) * (1 - item.discount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-8 w-8 text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass border-white/10 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white/60">
                                <MessageSquare className="h-4 w-4" />
                                Project Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Add internal notes or special instructions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[120px] focus:border-primary/50 transition-all"
                            />
                        </CardContent>
                    </Card>
                    <Card className="glass border-white/10 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white/60">
                                <Settings2 className="h-4 w-4" />
                                Terms & Conditions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Specify legal terms, payment schedules, etc."
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[120px] focus:border-primary/50 transition-all font-mono text-[10px]"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Column: Totals & Status */}
            <div className="space-y-6">
                <Card className="sticky top-6 glass border-primary/20 bg-primary/5 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator className="h-20 w-20" />
                    </div>
                    <CardHeader className="relative z-10 border-b border-white/10">
                        <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                            Financial Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 relative z-10">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40 uppercase tracking-widest font-bold">Gross Subtotal</span>
                                <span className="font-mono text-white/80">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40 uppercase tracking-widest font-bold">Applied Savings</span>
                                <span className="font-mono text-emerald-500">-${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-black text-primary tracking-widest">Total Investment</span>
                                    <span className="text-4xl font-black text-white font-mono tracking-tighter">
                                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <Button
                                className="w-full h-14 text-lg font-black gap-2 bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                                Deploy Proposal
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-10 gap-2 font-bold border-white/10 hover:bg-white/5 uppercase text-[10px] tracking-widest"
                                onClick={() => router.back()}
                                disabled={isSaving}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Cancel Operation
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-white/5 border-t border-white/10 p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500 shrink-0">
                                <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <p className="text-[10px] text-white/40 leading-relaxed italic">
                                Operation secured. Proposal will be indexed and available for client distribution immediately after deployment.
                            </p>
                        </div>
                    </CardFooter>
                </Card>

                {/* CPQ Insights */}
                <Card className="glass border-white/10 bg-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Settings2 className="h-3 w-3" />
                            CPQ Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40">Item Count</span>
                            <Badge variant="outline" className="font-mono text-[10px] border-white/10 text-white/60">{items.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40">Average Discount</span>
                            <span className="font-mono text-[10px] text-emerald-500">
                                {items.length > 0 ? (totalDiscount / subtotal * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] text-white/40 italic">
                                <Info className="h-3 w-3 text-primary" />
                                <span>Real-time tax calculation pending state selection.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
