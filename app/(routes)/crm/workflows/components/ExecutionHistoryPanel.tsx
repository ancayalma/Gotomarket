"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    History, ChevronDown, ChevronRight, CheckCircle2, XCircle,
    Clock, Loader2, Webhook, Play, Timer, AlertTriangle, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface StepLog {
    nodeId: string;
    nodeType: string;
    label: string;
    status: "completed" | "failed" | "skipped" | "waiting";
    startTime: number;
    endTime?: number;
    inputData?: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    error?: string;
    branch?: string;
}

interface Execution {
    id: string;
    status: "RUNNING" | "COMPLETED" | "FAILED";
    trigger_source: string | null;
    trigger_data: any;
    step_logs: StepLog[] | null;
    completed_nodes: string[];
    error: string | null;
    startedAt: string;
    completedAt: string | null;
    scheduled_at: string | null;
}

interface ExecutionHistoryPanelProps {
    workflowId?: string;
}

const STATUS_CONFIG = {
    RUNNING: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10", label: "Running", spin: true },
    COMPLETED: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Completed", spin: false },
    FAILED: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Failed", spin: false },
};

const SOURCE_CONFIG: Record<string, { icon: typeof Play; label: string }> = {
    manual: { icon: Play, label: "Manual" },
    webhook: { icon: Webhook, label: "Webhook" },
    event: { icon: AlertTriangle, label: "Event" },
    scheduled: { icon: Timer, label: "Scheduled" },
};

function formatDuration(start: string, end: string | null): string {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

export default function ExecutionHistoryPanel({ workflowId }: ExecutionHistoryPanelProps) {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchExecutions = useCallback(async () => {
        setLoading(true);
        try {
            const url = workflowId
                ? `/api/workflows/${workflowId}/executions?limit=25`
                : `/api/workflows/executions?limit=25`;
            const { data } = await axios.get(url);
            setExecutions(data.executions);
            setTotal(data.total);
        } catch { /* skip */ }
        setLoading(false);
    }, [workflowId]);

    useEffect(() => { fetchExecutions(); }, [fetchExecutions]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Execution History</h3>
                    <Badge variant="outline" className="text-[10px]">{total}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={fetchExecutions} className="h-7 text-xs gap-1">
                    <RotateCcw className="w-3 h-3" /> Refresh
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && executions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No executions yet. Run or trigger this workflow to see history.
                </div>
            )}

            <ScrollArea className="max-h-[60vh]">
                <div className="space-y-1">
                    {executions.map(exec => {
                        const statusConf = STATUS_CONFIG[exec.status];
                        const StatusIcon = statusConf.icon;
                        const sourceConf = SOURCE_CONFIG[exec.trigger_source || "manual"] || SOURCE_CONFIG.manual;
                        const SourceIcon = sourceConf.icon;
                        const isExpanded = expandedId === exec.id;
                        const stepLogs = exec.step_logs || [];

                        return (
                            <div key={exec.id} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                                <button
                                    className="flex items-center gap-3 p-3 w-full text-left hover:bg-white/5 transition"
                                    onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${statusConf.bg}`}>
                                        <StatusIcon className={`w-3.5 h-3.5 ${statusConf.color} ${statusConf.spin ? "animate-spin" : ""}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white font-medium">{formatTime(exec.startedAt)}</span>
                                            <Badge className={`${statusConf.bg} ${statusConf.color} text-[9px] border-0`}>{statusConf.label}</Badge>
                                            <Badge variant="outline" className="text-[9px] gap-1">
                                                <SourceIcon className="w-2.5 h-2.5" /> {sourceConf.label}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            {exec.completed_nodes.length} nodes · {formatDuration(exec.startedAt, exec.completedAt)}
                                            {exec.error && <span className="text-red-400 ml-2">⚠ {exec.error.slice(0, 50)}</span>}
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {isExpanded && (
                                    <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">
                                        {/* Step Timeline */}
                                        {stepLogs.map((step, idx) => (
                                            <Collapsible key={idx}>
                                                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-white/5">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step.status === "completed" ? "bg-emerald-500/10" : step.status === "failed" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                                                        {step.status === "completed" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                                                            step.status === "failed" ? <XCircle className="w-3 h-3 text-red-400" /> :
                                                                <Clock className="w-3 h-3 text-amber-400" />}
                                                    </div>
                                                    <span className="text-xs font-medium text-white flex-1">{step.label}</span>
                                                    <Badge variant="outline" className="text-[9px]">{step.nodeType}</Badge>
                                                    {step.branch && <Badge variant="secondary" className="text-[9px]">→ {step.branch}</Badge>}
                                                    {step.endTime && step.startTime && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {step.endTime - step.startTime}ms
                                                        </span>
                                                    )}
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="ml-7 mt-1">
                                                    {step.outputData && Object.keys(step.outputData).length > 0 && (
                                                        <pre className="text-[10px] font-mono bg-muted/30 p-2 rounded border overflow-x-auto max-h-24">
                                                            {JSON.stringify(step.outputData, null, 2)}
                                                        </pre>
                                                    )}
                                                    {step.error && (
                                                        <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded mt-1">{step.error}</div>
                                                    )}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}

                                        {/* Trigger Data */}
                                        {exec.trigger_data && (
                                            <Collapsible>
                                                <CollapsibleTrigger className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1">
                                                    <ChevronRight className="w-3 h-3" /> View Trigger Data
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="mt-1">
                                                    <pre className="text-[10px] font-mono bg-muted/30 p-2 rounded border overflow-x-auto max-h-32">
                                                        {JSON.stringify(exec.trigger_data, null, 2)}
                                                    </pre>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
