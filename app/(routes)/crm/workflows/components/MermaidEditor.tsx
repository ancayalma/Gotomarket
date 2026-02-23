"use client";

import React, { useEffect, useState, useRef } from "react";
import { MermaidDiagram } from "../../university/_components/MermaidDiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Code,
    Play,
    RefreshCw,
    Save,
    Share2,
    Mail,
    Copy,
    Check,
    Loader2,
    FolderOpen,
    Trash2,
    Link,
    Download,
    MoreVertical,
    Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Saved Diagram Type ─────────────────────────────
type SavedDiagram = {
    id: string;
    name: string;
    code: string;
    createdAt: string;
    updatedAt: string;
};

const STORAGE_KEY = "basalt_mermaid_diagrams";

function getSavedDiagrams(): SavedDiagram[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function persistDiagrams(diagrams: SavedDiagram[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
}

// ─── Component ──────────────────────────────────────
export function MermaidEditor() {
    const { toast } = useToast();

    const defaultChart = `%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '13px', 'clusterBkg': 'rgba(15, 23, 42, 0.3)', 'clusterBorder': '#334155' }}}%%
graph TB
    A[New Lead Created] --> B{Is lead hot?}
    B -- Yes --> C[Assign to Sales Rep]
    B -- No --> D[Add to Nurture Campaign]
    C --> E[Send Welcome Email]
    D --> E
    
    style A fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style B fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    style D fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
    style E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff
`;

    const [chartCode, setChartCode] = useState(defaultChart);
    const [activeChartCode, setActiveChartCode] = useState(defaultChart);
    const [diagramName, setDiagramName] = useState("Untitled Diagram");
    const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);

    // Dialogs
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Email
    const [recipientEmail, setRecipientEmail] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Misc
    const [copied, setCopied] = useState(false);
    const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSavedDiagrams(getSavedDiagrams());
    }, []);

    // ─── Actions ─────────────────────────────────────
    const handleRun = () => {
        setActiveChartCode(chartCode);
    };

    const handleReset = () => {
        setChartCode(defaultChart);
        setActiveChartCode(defaultChart);
        setDiagramName("Untitled Diagram");
        setActiveDiagramId(null);
    };

    // ── Save ────────────────────────────────────────
    const handleSave = () => {
        const now = new Date().toISOString();
        const diagrams = getSavedDiagrams();

        if (activeDiagramId) {
            // Update existing
            const idx = diagrams.findIndex((d) => d.id === activeDiagramId);
            if (idx !== -1) {
                diagrams[idx] = { ...diagrams[idx], name: diagramName, code: chartCode, updatedAt: now };
                persistDiagrams(diagrams);
                setSavedDiagrams([...diagrams]);
                toast({ title: "Diagram updated", description: `"${diagramName}" saved successfully.` });
                setSaveDialogOpen(false);
                return;
            }
        }

        // Create new
        const newDiagram: SavedDiagram = {
            id: crypto.randomUUID(),
            name: diagramName,
            code: chartCode,
            createdAt: now,
            updatedAt: now,
        };
        diagrams.unshift(newDiagram);
        persistDiagrams(diagrams);
        setSavedDiagrams([...diagrams]);
        setActiveDiagramId(newDiagram.id);
        toast({ title: "Diagram saved", description: `"${diagramName}" saved locally.` });
        setSaveDialogOpen(false);
    };

    // ── Load ────────────────────────────────────────
    const handleLoad = (diagram: SavedDiagram) => {
        setChartCode(diagram.code);
        setActiveChartCode(diagram.code);
        setDiagramName(diagram.name);
        setActiveDiagramId(diagram.id);
        setLoadDialogOpen(false);
        toast({ title: "Diagram loaded", description: `"${diagram.name}" loaded.` });
    };

    // ── Delete ──────────────────────────────────────
    const handleDeleteDiagram = (id: string) => {
        const diagrams = getSavedDiagrams().filter((d) => d.id !== id);
        persistDiagrams(diagrams);
        setSavedDiagrams([...diagrams]);
        if (activeDiagramId === id) setActiveDiagramId(null);
        toast({ title: "Diagram deleted" });
    };

    // ── Copy Code ───────────────────────────────────
    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(chartCode);
        setCopied(true);
        toast({ title: "Copied!", description: "Mermaid code copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Copy Share Link ─────────────────────────────
    const handleCopyShareLink = async () => {
        const encoded = encodeURIComponent(chartCode);
        const url = `${window.location.origin}/crm/workflows?view=editor&code=${encoded}`;
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Shareable link copied to clipboard." });
        setShareDialogOpen(false);
    };

    // ── Download SVG ────────────────────────────────
    const handleDownloadSvg = () => {
        const svgEl = previewRef.current?.querySelector("svg");
        if (!svgEl) {
            toast({ variant: "destructive", title: "No diagram", description: "Build a diagram first." });
            return;
        }
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgEl);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${diagramName.replace(/\s+/g, "_")}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: "SVG file saved." });
    };

    // ── Email ───────────────────────────────────────
    const handleSendEmail = async () => {
        if (!recipientEmail.trim()) {
            toast({ variant: "destructive", title: "Missing email", description: "Enter a recipient email." });
            return;
        }
        setIsSendingEmail(true);
        try {
            const res = await fetch("/api/crm/workflows/share-diagram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientEmail: recipientEmail.trim(),
                    diagramName,
                    diagramCode: chartCode,
                    senderName: "Your Team", // Will be replaced by session on backend
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: "Email sent!", description: `Diagram shared with ${recipientEmail}.` });
            setRecipientEmail("");
            setEmailDialogOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Failed", description: err?.message || "Could not send email." });
        } finally {
            setIsSendingEmail(false);
        }
    };

    // ── Load from URL param ─────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            try {
                const decoded = decodeURIComponent(code);
                setChartCode(decoded);
                setActiveChartCode(decoded);
                toast({ title: "Diagram loaded from link" });
            } catch { /* ignore */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Render ─────────────────────────────────────
    return (
        <>
            <div className="flex flex-col h-full space-y-4">
                {/* ── Toolbar ────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-background/50 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <Input
                            value={diagramName}
                            onChange={(e) => setDiagramName(e.target.value)}
                            className="h-8 w-56 text-sm font-semibold bg-transparent border-white/10 focus-visible:ring-primary/30"
                            placeholder="Diagram name..."
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10" onClick={handleReset}>
                            <RefreshCw className="w-3 h-3" /> Reset
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10" onClick={() => setLoadDialogOpen(true)}>
                            <FolderOpen className="w-3 h-3" /> Open
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10" onClick={() => setSaveDialogOpen(true)}>
                            <Save className="w-3 h-3" /> Save
                        </Button>

                        <div className="w-px h-5 bg-white/10 mx-1" />

                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10" onClick={handleCopyCode}>
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Copied" : "Copy Code"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10" onClick={handleDownloadSvg}>
                            <Download className="w-3 h-3" /> SVG
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-white/10">
                                    <Share2 className="w-3 h-3" /> Share
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 border-white/10 bg-background/95 backdrop-blur-xl">
                                <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                                    <Link className="mr-2 h-4 w-4" /> Copy Share Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
                                    <Mail className="mr-2 h-4 w-4" /> Send via Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleCopyCode}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy Mermaid Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadSvg}>
                                    <Download className="mr-2 h-4 w-4" /> Download SVG
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="w-px h-5 bg-white/10 mx-1" />

                        <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-lg shadow-primary/20" onClick={handleRun}>
                            <Play className="w-3 h-3" /> Build Diagram
                        </Button>
                    </div>
                </motion.div>

                {/* ── Editor + Preview Grid ───────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[500px]">
                    {/* Editor Column */}
                    <Card className="flex flex-col h-full border-white/10 bg-background/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Code className="w-4 h-4 text-primary" />
                                Mermaid Editor
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Write your flowchart syntax here
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 px-4 pb-4">
                            <Textarea
                                value={chartCode}
                                onChange={(e) => setChartCode(e.target.value)}
                                className="w-full h-full min-h-[400px] font-mono text-xs bg-muted/20 border-white/5 resize-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 p-4"
                                placeholder="graph TD..."
                                spellCheck={false}
                            />
                        </CardContent>
                    </Card>

                    {/* Preview Column */}
                    <Card className="flex flex-col h-full border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden relative">
                        <CardHeader className="pb-3 border-b border-white/5 z-10 bg-background/50 backdrop-blur-sm">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Play className="w-4 h-4 text-emerald-500" />
                                Live Preview
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Visual representation of your workflow
                            </CardDescription>
                        </CardHeader>
                        <CardContent
                            ref={previewRef}
                            className="flex-1 p-0 overflow-auto relative flex items-center justify-center min-h-[400px] bg-grid-white/[0.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0 pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] z-0 pointer-events-none" />
                            <div className="relative z-10 w-full p-6">
                                <MermaidDiagram
                                    chart={activeChartCode}
                                    className="w-full h-full min-h-[300px] flex items-center justify-center"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══════════ DIALOGS ═══════════ */}

            {/* ── Save Dialog ────────────────── */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="sm:max-w-md border-white/10 glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="w-5 h-5 text-primary" /> Save Diagram
                        </DialogTitle>
                        <DialogDescription>
                            Save this diagram locally for quick access later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagram Name</label>
                            <Input
                                value={diagramName}
                                onChange={(e) => setDiagramName(e.target.value)}
                                placeholder="e.g., Lead Qualification Flow"
                                className="bg-muted/20 border-white/10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="border-white/10">Cancel</Button>
                        <Button onClick={handleSave} className="shadow-lg shadow-primary/20 gap-1.5">
                            <Save className="w-3.5 h-3.5" /> Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Load / Open Dialog ─────────── */}
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogContent className="sm:max-w-lg border-white/10 glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary" /> Saved Diagrams
                        </DialogTitle>
                        <DialogDescription>
                            Select a previously saved diagram to load it into the editor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[350px] overflow-y-auto space-y-2 py-2 custom-scrollbar pr-1">
                        {savedDiagrams.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground/60">
                                <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">No saved diagrams yet</p>
                                <p className="text-xs mt-1">Save your first diagram to see it here.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {savedDiagrams.map((d) => (
                                    <motion.div
                                        key={d.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-background hover:border-primary/20 hover:bg-primary/[0.02] cursor-pointer transition-all group"
                                        onClick={() => handleLoad(d)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{d.name}</p>
                                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                                Updated {new Date(d.updatedAt).toLocaleDateString()} • {d.code.split("\n").length} lines
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDiagram(d.id);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Share Link Dialog ──────────── */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-md border-white/10 glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link className="w-5 h-5 text-primary" /> Share Diagram
                        </DialogTitle>
                        <DialogDescription>
                            Copy a link that includes the diagram code. Anyone with the link can view and edit it in the Visual Editor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-white/5 text-xs font-mono text-muted-foreground break-all max-h-24 overflow-y-auto">
                            {`${typeof window !== "undefined" ? window.location.origin : ""}/crm/workflows?view=editor&code=...`}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="border-white/10">Cancel</Button>
                        <Button onClick={handleCopyShareLink} className="shadow-lg shadow-primary/20 gap-1.5">
                            <Copy className="w-3.5 h-3.5" /> Copy Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Email Dialog ──────────────── */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent className="sm:max-w-md border-white/10 glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" /> Email Diagram
                        </DialogTitle>
                        <DialogDescription>
                            Send the Mermaid code to a colleague so they can view it in their own editor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Email</label>
                            <Input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="bg-muted/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagram Name</label>
                            <Input
                                value={diagramName}
                                onChange={(e) => setDiagramName(e.target.value)}
                                placeholder="e.g., Lead Qualification Flow"
                                className="bg-muted/20 border-white/10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)} className="border-white/10">Cancel</Button>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail}
                            className="shadow-lg shadow-primary/20 gap-1.5"
                        >
                            {isSendingEmail ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                            ) : (
                                <><Mail className="w-3.5 h-3.5" /> Send Email</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
