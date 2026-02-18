"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FileUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
    preview: {
        accounts: any[];
        contacts: any[];
    };
    fullPreview: {
        accounts: any[];
        contacts: any[];
    }
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
    const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
    const { toast } = useToast();

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
            const res = await fetch("/api/crm/accounts/import/commit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poolName,
                    poolDescription,
                    accounts: preview.fullPreview.accounts,
                    contacts: preview.fullPreview.contacts.map((c: any, i: number) => ({
                        ...c,
                        // Attempt to link contact to the account from the same row if possible
                        accountName: preview.fullPreview.accounts[i]?.name
                    }))
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Accounts & Contacts</DialogTitle>
                </DialogHeader>

                {step === "upload" && (
                    <div className="space-y-6 py-4">
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-10 text-center space-y-4">
                            <FileUp className="w-10 h-10 mx-auto text-muted-foreground/40" />
                            <div>
                                <Label htmlFor="file-upload" className="cursor-pointer text-indigo-500 hover:underline font-medium">
                                    Click to upload
                                </Label>
                                <input id="file-upload" type="file" className="hidden" accept=".xlsx,.csv" onChange={handleFileChange} />
                                <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx) or CSV files supported</p>
                            </div>
                            {file && (
                                <div className="bg-indigo-500/10 text-indigo-500 text-xs py-2 px-4 rounded-full inline-block font-medium">
                                    Selected: {file.name}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button disabled={!file || loading} onClick={startPreview}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Analyze File
                            </Button>
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
                                        {preview.preview.contacts.slice(0, 3).map((con, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2 font-bold">{preview.preview.accounts[i]?.name || "—"}</td>
                                                <td className="p-2">{con.fullName}</td>
                                                <td className="p-2 text-muted-foreground">{con.email || "—"}</td>
                                                <td className="p-2 font-mono text-[10px]">{con.phone || "—"}</td>
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
