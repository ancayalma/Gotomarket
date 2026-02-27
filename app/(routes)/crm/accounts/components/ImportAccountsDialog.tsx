"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    FileUp,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Database,
    RefreshCcw,
    ChevronRight,
    Users,
    Layers,
    FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type PreviewStats = {
    totalRows: number;
    validAccounts: number;
    validContacts: number;
    corruptRows: number;
};

type PreviewResponse = {
    stats: PreviewStats;
    mapping: {
        usedColumns: string[];
        allColumns: string[];
    };
    preview: any[];
    fullPreview: any[];
};

type Props = {
    onImportComplete?: () => void;
};

export default function ImportAccountsDialog({ onImportComplete }: Props) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [poolName, setPoolName] = useState("");
    const [poolDescription, setPoolDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [mode, setMode] = useState<"simple" | "advanced">("simple");
    const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const startPreview = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/crm/accounts/import/preview", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            setPreview(data);
            setStep("preview");
            setPoolName(file.name.replace(/\.[^/.]+$/, "") + " Import");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error analyzing file",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        if (!preview || !poolName) return;
        setLoading(true);
        try {
            const allAccounts: any[] = [];
            const allContacts: any[] = [];

            // Flatten rows back into lists for the API
            preview.fullPreview.forEach((row: any) => {
                if (row.account) {
                    allAccounts.push({
                        ...row.account,
                        name: row.account.companyName || "Unknown Account"
                    });
                }
                if (row.contacts && row.contacts.length > 0) {
                    row.contacts.forEach((c: any) => {
                        allContacts.push({
                            ...c,
                            accountName: row.account?.companyName,
                            candidateKey: row.account?.dedupeKey
                        });
                    });
                }
            });

            const res = await fetch("/api/crm/accounts/import/commit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poolName,
                    poolDescription,
                    accounts: allAccounts,
                    contacts: allContacts
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            toast({
                title: "Import Successful",
                description: "Your accounts and contacts have been added and organized into a list."
            });
            setStep("complete");
            if (onImportComplete) onImportComplete();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Import Failed",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setStep("upload");
        setPoolName("");
        setPoolDescription("");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-indigo-500/50 hover:bg-indigo-500/10">
                    <FileUp className="w-4 h-4" />
                    Import Accounts
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-zinc-950 text-white border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Import Accounts & Contacts</DialogTitle>
                </DialogHeader>

                {step === "upload" && (
                    <div className="space-y-6 py-2">
                        {/* Intelligence Header & Toggle */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Database className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-none">Mapping Intelligence</h4>
                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Preparation Guide</p>
                                </div>
                            </div>
                            <div className="flex bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
                                <button
                                    onClick={() => setMode("simple")}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tighter",
                                        mode === "simple" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setMode("advanced")}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tighter",
                                        mode === "advanced" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Migration
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/80 space-y-4 shadow-2xl backdrop-blur-sm">
                                    {mode === "simple" ? (
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Core Fields</p>
                                                <ul className="space-y-1.5">
                                                    <li className="flex justify-between items-center text-[11px] bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/30">
                                                        <span className="text-zinc-400">Company</span>
                                                        <span className="font-mono text-indigo-400 font-bold">Company Name</span>
                                                    </li>
                                                    <li className="flex justify-between items-center text-[11px] bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/30">
                                                        <span className="text-zinc-400">Contact</span>
                                                        <span className="font-mono text-indigo-400 font-bold">Full Name</span>
                                                    </li>
                                                    <li className="flex justify-between items-center text-[11px] bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/30">
                                                        <span className="text-zinc-400">Email</span>
                                                        <span className="font-mono text-indigo-400 font-bold">Primary Email</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="flex flex-col justify-center space-y-4">
                                                <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                                                        Our engine automatically recognizes variations like <span className="text-white">"Org"</span>, <span className="text-white">"Corp"</span>, or <span className="text-white">"Person"</span>.
                                                    </p>
                                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px]">
                                                        <CheckCircle2 className="w-3 h-3" /> All CSV/XLSX supported
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-4 space-y-4">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest italic">High Fidelity Mapping</p>
                                                    <ul className="space-y-1 text-[10px]">
                                                        <li className="flex justify-between py-1 border-b border-zinc-800/50">
                                                            <span className="text-zinc-500">History/Bio</span>
                                                            <span className="text-white font-bold">Description</span>
                                                        </li>
                                                        <li className="flex justify-between py-1 border-b border-zinc-800/50">
                                                            <span className="text-zinc-500">Secondary Email</span>
                                                            <span className="text-white font-bold">Email 2</span>
                                                        </li>
                                                        <li className="flex justify-between py-1 border-b border-zinc-800/50">
                                                            <span className="text-zinc-500">Mobile/Direct</span>
                                                            <span className="text-white font-bold">Phone 2</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="md:col-span-8 flex flex-col justify-between">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-800/80 space-y-1.5">
                                                        <p className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                            <Users className="w-3 h-3" /> Multi-Contact Strategy
                                                        </p>
                                                        <p className="text-[9px] text-zinc-500 leading-tight">
                                                            Upload multiple rows with the same <span className="text-white font-medium">Domain</span>. The system will merge the account and link each unique person.
                                                        </p>
                                                    </div>
                                                    <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-800/80 space-y-1.5">
                                                        <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                            <Layers className="w-3 h-3" /> Deduplication
                                                        </p>
                                                        <p className="text-[9px] text-zinc-500 leading-tight">
                                                            We match on <span className="text-white font-medium">Exact Domain</span>. If "acme.com" exists, we'll enrich rather than duplicate.
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-4 text-[10px] h-9 bg-zinc-950 border-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-xl shadow-xl shadow-black/40 border-b-2 border-b-indigo-500/20"
                                                    onClick={() => {
                                                        const headers = "Company Name,Domain,Full Name,Title,Email,Email 2,Phone,Phone 2,Description,Industry,Tech Stack,LinkedIn URL\n";
                                                        const blob = new Blob([headers], { type: 'text/csv' });
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.setAttribute('hidden', '');
                                                        a.setAttribute('href', url);
                                                        a.setAttribute('download', 'basalt_migration_master.csv');
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                    }}
                                                >
                                                    <FileText className="w-3 h-3 mr-2 text-indigo-400" />
                                                    Download Migration Master Template (.csv)
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Dropzone Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "group relative aspect-[3/1] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden mt-2 border-zinc-800/80 hover:border-indigo-500/30",
                                file
                                    ? "bg-emerald-500/5 border-emerald-500/30 shadow-2xl shadow-emerald-500/10"
                                    : "bg-zinc-950/40 hover:bg-zinc-900/60"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center space-y-2"
                                >
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-white font-bold text-base leading-none tracking-tight">{file.name}</p>
                                    <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest italic">Intelligence Scan Ready</p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <FileUp className="w-8 h-8 text-zinc-700 mb-3 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-300" />
                                    <p className="text-zinc-500 font-medium text-sm text-center">
                                        Drop CSV or XLSX to begin mapping
                                    </p>
                                    <p className="text-zinc-700 text-[9px] mt-2 uppercase tracking-[0.3em] font-black italic">Auto-detection Engine</p>
                                </>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
                                    <RefreshCcw className="w-3 h-3 text-zinc-600 animate-[spin_4s_linear_infinite]" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">V2.4 Intelligence active</span>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="ghost" className="text-zinc-600 hover:text-white transition-colors" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button
                                    disabled={loading || !file}
                                    onClick={startPreview}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 rounded-xl shadow-xl shadow-indigo-600/20 group transform transition-all hover:scale-[1.02]"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <div className="flex items-center gap-2 uppercase tracking-tighter italic font-black">
                                            Preview Dataset
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "preview" && preview && (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-muted/50 p-3 rounded-lg text-center">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold italic">Total Rows</p>
                                <p className="text-xl font-bold">{preview.stats.totalRows}</p>
                            </div>
                            <div className="bg-emerald-500/10 p-3 rounded-lg text-center">
                                <p className="text-[10px] uppercase text-emerald-600 font-bold italic">Accounts</p>
                                <p className="text-xl font-bold text-emerald-600">{preview.stats.validAccounts}</p>
                            </div>
                            <div className="bg-blue-500/10 p-3 rounded-lg text-center">
                                <p className="text-[10px] uppercase text-blue-600 font-bold italic">Contacts</p>
                                <p className="text-xl font-bold text-blue-600">{preview.stats.validContacts}</p>
                            </div>
                            <div className="bg-amber-500/10 p-3 rounded-lg text-center">
                                <p className="text-[10px] uppercase text-amber-600 font-bold italic">Bad Rows</p>
                                <p className="text-xl font-bold text-amber-600">{preview.stats.corruptRows}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>List Name (Organization)</Label>
                                <Input
                                    value={poolName}
                                    onChange={(e) => setPoolName(e.target.value)}
                                    placeholder="e.g. Q1 Investors List"
                                />
                                <p className="text-[10px] text-muted-foreground italic">These accounts will be added to the CRM and organized into this list.</p>
                            </div>
                            <div className="space-y-1">
                                <Label>Description</Label>
                                <Input
                                    value={poolDescription}
                                    onChange={(e) => setPoolDescription(e.target.value)}
                                    placeholder="Optional details about this import..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Data Preview (Top 3)</p>
                            <div className="border rounded-lg overflow-hidden text-xs">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-2 text-left">Account</th>
                                            <th className="p-2 text-left">Contact</th>
                                            <th className="p-2 text-left">Email</th>
                                            <th className="p-2 text-left">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.preview.slice(0, 3).map((row: any, i: number) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2 font-bold">{row.account?.companyName || "—"}</td>
                                                <td className="p-2">{row.contacts?.[0]?.fullName || "—"}</td>
                                                <td className="p-2 text-muted-foreground">{row.contacts?.[0]?.email || "—"}</td>
                                                <td className="p-2 font-mono text-[10px]">{row.contacts?.[0]?.phone || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <Button variant="ghost" size="sm" onClick={reset}>Back to upload</Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button disabled={loading || !poolName} onClick={handleCommit}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Confirm & Import
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "complete" && (
                    <div className="py-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Import Complete!</h3>
                            <p className="text-muted-foreground">Your {preview?.stats.totalRows} records have been processed and organized.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                            <Button variant="outline" onClick={reset}>Import Another</Button>
                            <Button onClick={() => setOpen(false)}>Done</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
