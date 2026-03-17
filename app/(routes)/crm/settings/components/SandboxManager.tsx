"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
import axios from "axios";
import {
    Box, Plus, Rocket, Trash2, Eye, Loader2,
    CheckCircle2, XCircle, Clock, AlertTriangle, GitCompare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

interface Sandbox {
    id: string;
    name: string;
    description: string | null;
    status: "ACTIVE" | "PROMOTED" | "DISCARDED";
    createdAt: string;
    promotedAt: string | null;
    _count: { deploy_logs: number };
}

interface SandboxDetail {
    sandbox: Sandbox;
    logs: Array<{
        id: string;
        action: string;
        entity_type: string;
        entity_name: string | null;
        performedAt: string;
    }>;
    stats: { totalCloned: number; totalModified: number };
}

const STATUS_CONFIG = {
    ACTIVE: {
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        icon: Clock,
        label: "Active",
    },
    PROMOTED: {
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        icon: CheckCircle2,
        label: "Promoted",
    },
    DISCARDED: {
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        icon: XCircle,
        label: "Discarded",
    },
};

export default function SandboxManager() {
    const { data: sandboxes, error, isLoading } = useSWR<Sandbox[]>("/api/sandbox", fetcher);
    const [createOpen, setCreateOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [detail, setDetail] = useState<SandboxDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [discarding, setDiscarding] = useState(false);

    // Load sandbox detail
    const loadDetail = useCallback(async (id: string) => {
        setDetailId(id);
        setDetailLoading(true);
        try {
            const { data } = await axios.get(`/api/sandbox/${id}`);
            setDetail(data);
        } catch { /* skip */ }
        setDetailLoading(false);
    }, []);

    // Create sandbox
    const handleCreate = useCallback(async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await axios.post("/api/sandbox", {
                name: newName.trim(),
                description: newDesc.trim() || undefined,
            });
            setCreateOpen(false);
            setNewName("");
            setNewDesc("");
            mutate("/api/sandbox");
        } catch { /* skip */ }
        setCreating(false);
    }, [newName, newDesc]);

    // Promote sandbox
    const handlePromote = useCallback(async (id: string) => {
        setPromoting(true);
        try {
            await axios.post(`/api/sandbox/${id}`, { action: "promote" });
            mutate("/api/sandbox");
            if (detailId === id) loadDetail(id);
        } catch { /* skip */ }
        setPromoting(false);
    }, [detailId, loadDetail]);

    // Discard sandbox
    const handleDiscard = useCallback(async (id: string) => {
        setDiscarding(true);
        try {
            await axios.delete(`/api/sandbox/${id}`);
            mutate("/api/sandbox");
            if (detailId === id) setDetailId(null);
        } catch { /* skip */ }
        setDiscarding(false);
    }, [detailId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white">Sandbox Environments</h2>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {sandboxes?.filter(s => s.status === "ACTIVE").length || 0}/3 active
                    </Badge>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600">
                            <Plus className="w-3.5 h-3.5" />
                            New Sandbox
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Sandbox</DialogTitle>
                            <DialogDescription>
                                A sandbox clones your current workflows and validation rules
                                for safe testing. Changes don&apos;t affect production until promoted.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Q3 Workflow Refactor"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                                <Textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="What are you testing?"
                                    className="h-20"
                                />
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !newName.trim()}
                                className="w-full"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Box className="w-4 h-4 mr-2" />
                                )}
                                Create Sandbox
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Info Banner */}
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                    <strong>How sandboxes work:</strong> Creating a sandbox clones your
                    workflows and validation rules. Edit them safely, then promote to
                    replace production or discard to throw away changes.
                </div>
            </div>

            {/* Sandbox List + Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* List */}
                <div className="space-y-2">
                    {(!sandboxes || sandboxes.length === 0) ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No sandboxes yet. Create one to start testing.</p>
                        </div>
                    ) : (
                        sandboxes.map((sb) => {
                            const cfg = STATUS_CONFIG[sb.status];
                            const StatusIcon = cfg.icon;
                            const isSelected = detailId === sb.id;

                            return (
                                <div
                                    key={sb.id}
                                    className={`p-4 rounded-lg border transition cursor-pointer ${
                                        isSelected
                                            ? "border-amber-500/50 bg-amber-500/5"
                                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                    }`}
                                    onClick={() => loadDetail(sb.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white text-sm">{sb.name}</h4>
                                                <Badge variant="outline" className={`text-[9px] ${cfg.color}`}>
                                                    <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                                    {cfg.label}
                                                </Badge>
                                            </div>
                                            {sb.description && (
                                                <p className="text-xs text-muted-foreground">{sb.description}</p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Created {new Date(sb.createdAt).toLocaleDateString()} ·
                                                {sb._count.deploy_logs} log entries
                                            </p>
                                        </div>

                                        {sb.status === "ACTIVE" && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-blue-400 hover:text-blue-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePromote(sb.id);
                                                    }}
                                                    disabled={promoting}
                                                    title="Promote to production"
                                                >
                                                    <Rocket className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-400 hover:text-red-300"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDiscard(sb.id);
                                                    }}
                                                    disabled={discarding}
                                                    title="Discard sandbox"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                {detailId && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : detail ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <GitCompare className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-sm font-semibold text-white">
                                        {detail.sandbox.name} — Activity Log
                                    </h3>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded border border-white/10 bg-white/5 text-center">
                                        <div className="text-lg font-bold text-white">
                                            {detail.stats.totalCloned}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Cloned Items
                                        </div>
                                    </div>
                                    <div className="p-3 rounded border border-white/10 bg-white/5 text-center">
                                        <div className="text-lg font-bold text-white">
                                            {detail.stats.totalModified}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Modifications
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Log */}
                                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                    {detail.logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center gap-2 py-1.5 px-2 rounded text-xs hover:bg-white/5"
                                        >
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] shrink-0 ${
                                                    log.action === "CLONE"
                                                        ? "text-cyan-400"
                                                        : log.action === "MODIFY"
                                                            ? "text-amber-400"
                                                            : log.action === "PROMOTE"
                                                                ? "text-emerald-400"
                                                                : "text-red-400"
                                                }`}
                                            >
                                                {log.action}
                                            </Badge>
                                            <span className="text-muted-foreground truncate">
                                                {log.entity_type}
                                            </span>
                                            <span className="text-white truncate">
                                                {log.entity_name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                                                {new Date(log.performedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))}
                                    {detail.logs.length === 0 && (
                                        <div className="text-center py-6 text-muted-foreground text-xs">
                                            No activity yet
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
