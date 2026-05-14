"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Save, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UserAllocation {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    emails_per_month: number | null;
    sms_per_month: number | null;
    voice_minutes_per_month: number | null;
}

interface UserAllocationManagerProps {
    teamId: string;
}

export function UserAllocationManager({ teamId }: UserAllocationManagerProps) {
    const [allocations, setAllocations] = useState<UserAllocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllocations = async () => {
            try {
                const res = await fetch(`/api/admin/allocations?teamId=${teamId}`);
                if (res.ok) {
                    setAllocations(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch allocations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllocations();
    }, [teamId]);

    const handleUpdate = async (userId: string, field: string, value: number | null) => {
        setAllocations(prev =>
            prev.map(a => a.user_id === userId ? { ...a, [field]: value } : a)
        );
    };

    const handleSave = async (userId: string) => {
        const alloc = allocations.find(a => a.user_id === userId);
        if (!alloc) return;
        setSaving(userId);
        try {
            const res = await fetch("/api/admin/allocations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId,
                    userId,
                    emails_per_month: alloc.emails_per_month,
                    sms_per_month: alloc.sms_per_month,
                    voice_minutes_per_month: alloc.voice_minutes_per_month,
                }),
            });
            if (res.ok) {
                toast.success(`Allocation updated for ${alloc.user_name || alloc.user_email}`);
            } else {
                toast.error("Failed to save allocation");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-6 flex items-center justify-center gap-2 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading user allocations...</span>
                </CardContent>
            </Card>
        );
    }

    if (allocations.length === 0) {
        return (
            <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-6 text-center text-zinc-500 text-sm">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-zinc-600" />
                    No team members found. Per-user allocations will appear once users are added to the team.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Per-User Allocations
                    </h3>
                    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                        {allocations.length} Users
                    </Badge>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Set individual limits within your team&apos;s total quota. Leave blank to allow the user to consume from the shared pool.
                </p>

                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">User</th>
                                <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold text-center">Emails/mo</th>
                                <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold text-center">SMS/mo</th>
                                <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold text-center">Voice min/mo</th>
                                <th className="p-3 text-[10px] text-zinc-500 uppercase tracking-wider font-bold text-right">Save</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {allocations.map((alloc) => (
                                <tr key={alloc.user_id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-3">
                                        <div className="text-xs font-bold text-white">{alloc.user_name || "Unnamed"}</div>
                                        <div className="text-[10px] text-zinc-500">{alloc.user_email}</div>
                                    </td>
                                    <td className="p-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Shared"
                                            value={alloc.emails_per_month ?? ""}
                                            onChange={(e) => handleUpdate(alloc.user_id, "emails_per_month", e.target.value ? Number(e.target.value) : null)}
                                            className="h-8 w-24 mx-auto bg-zinc-950 border-zinc-800 text-center text-xs"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Shared"
                                            value={alloc.sms_per_month ?? ""}
                                            onChange={(e) => handleUpdate(alloc.user_id, "sms_per_month", e.target.value ? Number(e.target.value) : null)}
                                            className="h-8 w-24 mx-auto bg-zinc-950 border-zinc-800 text-center text-xs"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Shared"
                                            value={alloc.voice_minutes_per_month ?? ""}
                                            onChange={(e) => handleUpdate(alloc.user_id, "voice_minutes_per_month", e.target.value ? Number(e.target.value) : null)}
                                            className="h-8 w-24 mx-auto bg-zinc-950 border-zinc-800 text-center text-xs"
                                        />
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2 text-zinc-400 hover:text-white"
                                            onClick={() => handleSave(alloc.user_id)}
                                            disabled={saving === alloc.user_id}
                                        >
                                            {saving === alloc.user_id
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <Save className="w-3.5 h-3.5" />
                                            }
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
