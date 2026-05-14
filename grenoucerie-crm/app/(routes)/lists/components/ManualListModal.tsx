"use client";

import { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Save, X, Building2, User } from "lucide-react";

type AccountRef = { id: string; name: string; email: string | null };
type ContactRef = { id: string; first_name: string | null; last_name: string | null; email: string | null; assigned_accounts: { name: string } | null };

type ResourcesResponse = {
    accounts: AccountRef[];
    contacts: ContactRef[];
}

export function ManualListModal({
    isOpen,
    onClose,
    onCreated,
    existingPoolId,
    existingPoolName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    existingPoolId?: string;
    existingPoolName?: string;
}) {
    const isAppendMode = !!existingPoolId;
    const { data, isLoading } = useSWR<ResourcesResponse>("/api/crm/leads/pools/manual/resources", fetcher);

    const [tab, setTab] = useState<"accounts" | "contacts">("accounts");
    const [searchQuery, setSearchQuery] = useState("");
    const [listName, setListName] = useState("");
    
    // Arrays for deterministic ordering in UI 
    const [selectedAccounts, setSelectedAccounts] = useState<AccountRef[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<ContactRef[]>([]);

    const [isSaving, setIsSaving] = useState(false);

    const validAccounts = (data?.accounts || []).filter(a => a.email && a.email.trim() !== "");
    const validContacts = (data?.contacts || []).filter(c => c.email && c.email.trim() !== "");

    const filteredAccounts = validAccounts.filter(a => 
        (a.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (a.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const filteredContacts = validContacts.filter(c => 
        (c.first_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (c.last_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
        (c.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const toggleAccount = (acc: AccountRef) => {
        if (selectedAccounts.find(s => s.id === acc.id)) {
            setSelectedAccounts(selectedAccounts.filter(s => s.id !== acc.id));
        } else {
            setSelectedAccounts([...selectedAccounts, acc]);
        }
    };

    const toggleContact = (con: ContactRef) => {
        if (selectedContacts.find(s => s.id === con.id)) {
            setSelectedContacts(selectedContacts.filter(s => s.id !== con.id));
        } else {
            setSelectedContacts([...selectedContacts, con]);
        }
    };

    const totalSelected = selectedAccounts.length + selectedContacts.length;

    const handleSave = async () => {
        if (!isAppendMode && !listName.trim()) {
            alert("Please provide a name for the list.");
            return;
        }
        if (totalSelected === 0) {
            alert("Please select at least one Account or Contact to add.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/crm/leads/pools/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: listName || existingPoolName || "Unnamed List",
                    accounts: selectedAccounts.map(a => a.id),
                    contacts: selectedContacts.map(c => c.id),
                    ...(existingPoolId ? { existingPoolId } : {})
                })
            });

            if (!res.ok) throw new Error(await res.text());
            
            // Clean up cleanly
            setListName("");
            setSelectedAccounts([]);
            setSelectedContacts([]);
            onCreated();
            onClose();
        } catch (e: any) {
            console.error(e);
            alert("Failed to create list: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-card border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col h-[85vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 shrink-0 bg-muted/20">
                    <DialogTitle className="text-xl font-black italic tracking-tight uppercase bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        {isAppendMode ? `Add to ${existingPoolName}` : "Build List Manually"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm mt-1">
                        {isAppendMode
                            ? "Select Accounts and Contacts from your directory to add to this list."
                            : "Select specific Accounts and Contacts from your database to organize perfectly targeted outreach lists."
                        }
                    </DialogDescription>
                </div>

                {/* Two Column Layout container */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                    
                    {/* LEFT COLUMN: Data Selection */}
                    <div className="w-1/2 md:w-3/5 border-r border-white/5 flex flex-col bg-card">
                        <div className="px-4 pt-4 shrink-0 space-y-4">
                            <div className="flex bg-muted p-1 rounded-lg">
                                <button
                                    onClick={() => setTab("accounts")}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${tab === "accounts" ? "bg-card shadow text-primary" : "text-muted-foreground hover:bg-white/5"}`}
                                >
                                    Accounts ({validAccounts.length})
                                </button>
                                <button
                                    onClick={() => setTab("contacts")}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${tab === "contacts" ? "bg-card shadow text-primary" : "text-muted-foreground hover:bg-white/5"}`}
                                >
                                    Contacts ({validContacts.length})
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={`Search ${tab}...`}
                                    className="pl-9 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Scrolling list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : tab === "accounts" ? (
                                filteredAccounts.length > 0 ? (
                                    filteredAccounts.map(account => {
                                        const isSelected = !!selectedAccounts.find(s => s.id === account.id);
                                        return (
                                            <div key={account.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 rounded-md bg-muted text-muted-foreground shrink-0"><Building2 className="w-4 h-4" /></div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-semibold text-sm truncate">{account.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{account.email || "No email"}</div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant={isSelected ? "secondary" : "outline"} 
                                                    className={`shrink-0 ml-4 h-8 px-3 text-xs font-bold uppercase ${isSelected ? "text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30" : ""}`}
                                                    onClick={() => toggleAccount(account)}
                                                >
                                                    {isSelected ? "Remove" : "Add"}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center p-8 text-sm text-muted-foreground">No accounts found.</div>
                                )
                            ) : (
                                filteredContacts.length > 0 ? (
                                    filteredContacts.map(contact => {
                                        const isSelected = !!selectedContacts.find(s => s.id === contact.id);
                                        return (
                                            <div key={contact.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 rounded-md bg-muted text-muted-foreground shrink-0"><User className="w-4 h-4" /></div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-semibold text-sm truncate">{contact.first_name} {contact.last_name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {contact.email || "No email"} {contact.assigned_accounts && `• ${contact.assigned_accounts.name}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant={isSelected ? "secondary" : "outline"} 
                                                    className={`shrink-0 ml-4 h-8 px-3 text-xs font-bold uppercase ${isSelected ? "text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30" : ""}`}
                                                    onClick={() => toggleContact(contact)}
                                                >
                                                    {isSelected ? "Remove" : "Add"}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center p-8 text-sm text-muted-foreground">No contacts found.</div>
                                )
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Staged Selection */}
                    <div className="w-1/2 md:w-2/5 bg-muted/10 flex flex-col relative h-full">
                        <div className="p-4 border-b border-white/5 bg-muted/30 shrink-0">
                            <h3 className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Staged Targets ({totalSelected})</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {totalSelected === 0 ? (
                                <div className="text-center px-4 py-12 flex flex-col justify-center items-center h-full">
                                    <p className="text-xs text-muted-foreground">No targets officially staged.</p>
                                    <p className="text-[10px] text-muted-foreground mt-2 opacity-50">Select items from the left to review them here before confirming the creation of the list.</p>
                                </div>
                            ) : (
                                <>
                                    {selectedAccounts.map(account => (
                                        <div key={account.id} className="group flex items-center justify-between p-2 rounded border border-white/5 bg-card/50 text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden truncate">
                                                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                <span className="truncate">{account.name}</span>
                                            </div>
                                            <button onClick={() => toggleAccount(account)} className="text-muted-foreground hover:text-red-400 p-1 rounded hover:bg-white/5 transition opacity-0 group-hover:opacity-100 shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedContacts.map(contact => (
                                        <div key={contact.id} className="group flex items-center justify-between p-2 rounded border border-white/5 bg-card/50 text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden truncate">
                                                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                <span className="truncate">{contact.first_name} {contact.last_name}</span>
                                            </div>
                                            <button onClick={() => toggleContact(contact)} className="text-muted-foreground hover:text-red-400 p-1 rounded hover:bg-white/5 transition opacity-0 group-hover:opacity-100 shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="p-4 border-t border-white/10 bg-card sticky flex flex-col md:flex-row gap-4 items-end shrink-0">
                    {!isAppendMode && (
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">List Name</label>
                            <Input 
                                value={listName} 
                                onChange={(e) => setListName(e.target.value)} 
                                placeholder="e.g. Q4 Target Accounts" 
                                className="bg-muted/50 focus-visible:ring-indigo-500/30 h-10"
                            />
                        </div>
                    )}
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || totalSelected === 0 || (!isAppendMode && !listName.trim())} 
                        className="w-full md:w-auto px-8 h-10 bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest text-xs font-bold text-white shrink-0"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? "Saving..." : isAppendMode ? "Add to List" : "Create List"}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
