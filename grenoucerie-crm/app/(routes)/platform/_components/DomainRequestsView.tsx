"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import {
    Loader2, Globe, CheckCircle2, XCircle, Clock, Copy, AlertCircle, ShieldCheck
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DomainRequest {
    id: string;
    team_id: string;
    custom_domain: string;
    domain_status: string;
    domain_dkim_tokens: string[];
    domain_verification_token: string | null;
    domain_requested_at: string;
    from_email: string;
    purpose: string;
    assigned_team: {
        id: string;
        name: string;
        slug: string;
        assigned_plan?: { name: string; slug: string } | null;
        subscription_plan?: string;
        owner?: { name: string; email: string } | null;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING_APPROVAL: { label: "Pending Approval", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Clock className="w-3.5 h-3.5" /> },
    DNS_PENDING: { label: "DNS Pending", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Globe className="w-3.5 h-3.5" /> },
    VERIFIED: { label: "Verified", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    FAILED: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export function DomainRequestsView() {
    const [requests, setRequests] = useState<DomainRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ configId: string; action: "approve" | "reject"; domain: string } | null>(null);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/platform/domain-requests");
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch {
            toast.error("Failed to load domain requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleAction = async (configId: string, action: "approve" | "reject") => {
        setActionLoading(configId);
        try {
            const res = await fetch("/api/platform/domain-requests", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ configId, action }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success(action === "approve" ? "Domain approved — DNS records shared with team" : "Domain request rejected");
            fetchRequests();
        } catch {
            toast.error(`Failed to ${action} request`);
        } finally {
            setActionLoading(null);
            setConfirmDialog(null);
        }
    };

    const pendingCount = requests.filter(r => r.domain_status === "PENDING_APPROVAL").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
                <Globe className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No domain verification requests yet</p>
                <p className="text-xs text-zinc-600">Companies will appear here when they request custom domain verification.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            {pendingCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-300 font-medium">
                        {pendingCount} domain{pendingCount > 1 ? "s" : ""} awaiting approval
                    </p>
                </div>
            )}

            {/* Requests List */}
            <div className="space-y-3">
                {requests.map((req) => {
                    const status = STATUS_CONFIG[req.domain_status] || STATUS_CONFIG.FAILED;
                    const planName = req.assigned_team?.assigned_plan?.name || req.assigned_team?.subscription_plan || "—";
                    const isPending = req.domain_status === "PENDING_APPROVAL";

                    return (
                        <div
                            key={req.id}
                            className="rounded-xl border border-white/5 bg-zinc-900/60 overflow-hidden transition-colors hover:border-white/10"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-indigo-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold text-sm truncate">{req.custom_domain}</span>
                                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                                            {status.icon}
                                            <span className="ml-1">{status.label}</span>
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                                        <span className="font-medium text-zinc-400">{req.assigned_team.name}</span>
                                        <span>•</span>
                                        <span>{req.assigned_team.slug}</span>
                                        <span>•</span>
                                        <span>{planName}</span>
                                        {req.assigned_team.owner && (
                                            <>
                                                <span>•</span>
                                                <span>{req.assigned_team.owner.email}</span>
                                            </>
                                        )}
                                        {req.domain_requested_at && (
                                            <>
                                                <span>•</span>
                                                <span>{new Date(req.domain_requested_at).toLocaleDateString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {isPending && (
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 gap-1.5"
                                            disabled={actionLoading === req.id}
                                            onClick={() => setConfirmDialog({ configId: req.id, action: "approve", domain: req.custom_domain })}
                                        >
                                            {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs h-8 gap-1.5"
                                            disabled={actionLoading === req.id}
                                            onClick={() => setConfirmDialog({ configId: req.id, action: "reject", domain: req.custom_domain })}
                                        >
                                            <XCircle className="w-3 h-3" />
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                {req.domain_status === "VERIFIED" && (
                                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                                        <ShieldCheck className="w-4 h-4" />
                                        Active
                                    </div>
                                )}
                            </div>

                            {/* DKIM Records (visible for DNS_PENDING) */}
                            {req.domain_status === "DNS_PENDING" && req.domain_dkim_tokens.length > 0 && (
                                <div className="px-4 pb-4 pt-0">
                                    <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">DNS Records (DKIM)</p>
                                        {req.domain_dkim_tokens.map((token, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                                                <span className="text-zinc-600 w-12">CNAME</span>
                                                <span className="text-blue-300 truncate">{token}._domainkey.{req.custom_domain}</span>
                                                <span className="text-zinc-600">→</span>
                                                <span className="text-green-300 truncate">{token}.dkim.amazonses.com</span>
                                                <button
                                                    className="ml-auto text-zinc-600 hover:text-white transition-colors shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${token}._domainkey.${req.custom_domain} CNAME ${token}.dkim.amazonses.com`);
                                                        toast.success("Copied!");
                                                    }}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
                <AlertDialogContent className="bg-[#0B1120] border-white/10 shadow-2xl">
                    <AlertDialogHeader>
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${
                            confirmDialog?.action === "approve"
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-red-500/10 border-red-500/20"
                        }`}>
                            {confirmDialog?.action === "approve"
                                ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                                : <XCircle className="w-6 h-6 text-red-500" />
                            }
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-center text-white">
                            {confirmDialog?.action === "approve" ? "Approve" : "Reject"} Domain?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-slate-400">
                            {confirmDialog?.action === "approve"
                                ? <>This will move <span className="text-white font-semibold">{confirmDialog?.domain}</span> to DNS Pending. The team will see the DKIM records to configure.</>
                                : <>This will reject the domain verification for <span className="text-white font-semibold">{confirmDialog?.domain}</span>.</>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6 sm:justify-center gap-3">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white w-28">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmDialog && handleAction(confirmDialog.configId, confirmDialog.action)}
                            className={`border-none shadow-lg w-32 ${
                                confirmDialog?.action === "approve"
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                        >
                            {confirmDialog?.action === "approve" ? "Approve" : "Reject"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
