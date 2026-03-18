"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewCustomModelRequest } from "@/actions/ai/manage-models";
import { toast } from "sonner";
import { Check, X, Clock, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelRequest {
    id: string;
    provider: string;
    modelId: string;
    displayName: string;
    baseUrl: string | null;
    description: string | null;
    team_id: string;
    team_name: string | null;
    requested_by: string;
    status: string;
    createdAt: Date;
}

interface PendingRequestsSectionProps {
    requests: ModelRequest[];
    reviewerId: string;
}

export const PendingRequestsSection = ({ requests, reviewerId }: PendingRequestsSectionProps) => {
    const [isPending, startTransition] = useTransition();
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

    const handleReview = (requestId: string, status: "APPROVED" | "REJECTED") => {
        const formData = new FormData();
        formData.append("id", requestId);
        formData.append("status", status);
        formData.append("reviewed_by", reviewerId);
        if (reviewNotes[requestId]) {
            formData.append("review_notes", reviewNotes[requestId]);
        }

        startTransition(async () => {
            try {
                await reviewCustomModelRequest(formData);
                toast.success(`Request ${status.toLowerCase()}`);
            } catch (error: any) {
                toast.error(error?.message || "Failed to process request");
            }
        });
    };

    if (requests.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                    {requests.length} Pending
                </Badge>
            </div>

            {requests.map(request => (
                <div
                    key={request.id}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-semibold text-sm text-foreground">{request.displayName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono text-muted-foreground">{request.modelId}</span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                    {request.provider}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {request.team_name && (
                        <p className="text-xs text-muted-foreground">
                            Requested by team: <span className="font-medium text-foreground">{request.team_name}</span>
                        </p>
                    )}

                    {request.description && (
                        <p className="text-xs text-muted-foreground italic">{request.description}</p>
                    )}

                    {request.baseUrl && (
                        <p className="text-xs font-mono text-muted-foreground">
                            Endpoint: {request.baseUrl}
                        </p>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Review notes (optional)"
                                value={reviewNotes[request.id] || ""}
                                onChange={e => setReviewNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            onClick={() => handleReview(request.id, "APPROVED")}
                            disabled={isPending}
                        >
                            <Check className="w-3 h-3" />
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleReview(request.id, "REJECTED")}
                            disabled={isPending}
                        >
                            <X className="w-3 h-3" />
                            Reject
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
