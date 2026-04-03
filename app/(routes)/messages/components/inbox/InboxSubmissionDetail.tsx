"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    FormInput,
    UserPlus,
    Archive,
    Trash2,
    Undo2,
    X,
} from "lucide-react";
import { format } from "date-fns";

interface FormSubmission {
    id: string;
    form_id: string;
    data: Record<string, any>;
    source_url?: string;
    ip_address?: string;
    status: string;
    is_deleted?: boolean;
    createdAt: Date | string;
    converted_lead_id?: string | null;
    lead_id?: string | null;
    form: { id: string; name: string; slug: string; project_id?: string | null };
}

interface InboxSubmissionDetailProps {
    submission: FormSubmission;
    onClose: () => void;
    onConvertToLead: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    isConverting: boolean;
    isDeleting: boolean;
}

export function InboxSubmissionDetail({
    submission,
    onClose,
    onConvertToLead,
    onArchive,
    onDelete,
    onRestore,
    onPermanentDelete,
    isConverting,
    isDeleting,
}: InboxSubmissionDetailProps) {
    const name =
        submission.data?.name ||
        submission.data?.full_name ||
        `${submission.data?.first_name || ""} ${submission.data?.last_name || ""}`.trim() ||
        submission.data?.email?.split("@")[0] ||
        "Anonymous Visitor";

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Sticky Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-foreground truncate">
                            {submission.form.name}
                        </h3>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-violet-500/30 text-violet-500 bg-violet-500/10">
                            Form
                        </Badge>
                    </div>
                </div>

                {/* Actions */}
                {!submission.converted_lead_id && !submission.lead_id && (
                    submission.form?.project_id ? (
                        <Button
                            size="sm"
                            onClick={() => onConvertToLead(submission.id)}
                            disabled={isConverting}
                            className="gap-1.5 h-7 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <UserPlus className="h-3 w-3" />
                            {isConverting ? "Creating..." : "Create Lead"}
                        </Button>
                    ) : (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/10 font-medium">
                            ⚠ No project assigned
                        </Badge>
                    )
                )}
                {(submission.converted_lead_id || submission.lead_id) && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold">
                        ✓ Lead Created
                    </Badge>
                )}

                {submission.is_deleted ? (
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => onRestore(submission.id)} disabled={isDeleting} className="h-7 text-[11px] gap-1 border-border text-muted-foreground hover:text-foreground">
                            <Undo2 className="h-3 w-3" /> Restore
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => onPermanentDelete(submission.id)} disabled={isDeleting} className="h-7 text-[11px] gap-1">
                            <Trash2 className="h-3 w-3" /> Delete Forever
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => onArchive(submission.id)} disabled={isDeleting}>
                                    <Archive className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted border-border text-foreground text-xs">Archive</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(submission.id)} disabled={isDeleting}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-muted border-border text-foreground text-xs">Trash</TooltipContent>
                        </Tooltip>
                    </div>
                )}

                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-foreground" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Submission Meta */}
            <div className="px-4 py-3 border-b border-border/40 bg-muted/10">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <FormInput className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-foreground">{name}</span>
                        </div>
                        {submission.data?.email && (
                            <div className="text-[11.5px] text-muted-foreground">{submission.data.email}</div>
                        )}
                        <div className="text-[10.5px] text-muted-foreground/70 mt-0.5">
                            Submitted {format(new Date(submission.createdAt), "PPpp")}
                            {submission.source_url && (
                                <span className="ml-1.5">
                                    • from {(() => { try { return new URL(submission.source_url).hostname; } catch { return submission.source_url; } })()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Field Data */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                        Submitted Data
                    </h4>
                    <div className="space-y-2.5">
                        {Object.entries(submission.data || {}).map(([key, value]) => (
                            <div key={key} className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                    {key.replace(/_/g, " ")}
                                </div>
                                <div className="text-[13px] text-foreground whitespace-pre-wrap">
                                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value || "—")}
                                </div>
                            </div>
                        ))}
                    </div>
                    {(submission.source_url || submission.ip_address) && (
                        <div className="mt-6 pt-4 border-t border-border/40">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
                                Metadata
                            </h4>
                            <div className="text-[12px] text-muted-foreground space-y-1">
                                {submission.source_url && <div><span className="text-muted-foreground/70">Source:</span> {submission.source_url}</div>}
                                {submission.ip_address && <div><span className="text-muted-foreground/70">IP:</span> {submission.ip_address}</div>}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
