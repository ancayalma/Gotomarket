"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Eye,
  MessageSquare,
  Target,
  FileText,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
  Ban,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OutreachItemWithActions {
  id: string;
  lead: string | null;
  status: string;
  subject: string | null;
  candidate_email: string | null;
  candidate_name: string | null;
  candidate_company: string | null;
  candidate_job_title: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  reply_sentiment: string | null;
  reply_snippet: string | null;
  followup_count: number;
  unsubscribed_at: string | null;
  account_id: string | null;
  contact_id: string | null;
  // Joined data
  opportunity?: { id: string; name: string; status: string } | null;
  pendingActions?: Array<{
    id: string;
    action_type: string;
    status: string;
    reasoning: string;
    requires_human: boolean;
    payload: any;
    createdAt: string;
  }>;
}

interface CampaignContactTrackerProps {
  campaignId: string;
  onRefresh?: () => void;
}

// ─── Pipeline Stage Config ───────────────────────────────────────────────────

const STAGES = [
  { key: "pool", label: "Pool", icon: Target, color: "#6b7280" },
  { key: "sent", label: "Sent", icon: Mail, color: "#3b82f6" },
  { key: "opened", label: "Opened", icon: Eye, color: "#8b5cf6" },
  { key: "replied", label: "Replied", icon: MessageSquare, color: "#f59e0b" },
  { key: "opportunity", label: "Opportunity", icon: Sparkles, color: "#10b981" },
  { key: "quote", label: "Quote", icon: FileText, color: "#06b6d4" },
  { key: "contract", label: "Contract", icon: FileSignature, color: "#ec4899" },
  { key: "closed", label: "Closed", icon: CheckCircle2, color: "#22c55e" },
];

function getStageIndex(item: OutreachItemWithActions): number {
  if (item.unsubscribed_at) return -1; // Unsubscribed — show red
  if (item.opportunity) {
    // Check for quote/contract actions
    const hasQuote = item.pendingActions?.some(
      (a) => a.action_type === "SEND_QUOTE" && a.status === "EXECUTED"
    );
    const hasContract = item.pendingActions?.some(
      (a) => a.action_type === "GENERATE_CONTRACT" && a.status === "EXECUTED"
    );
    if (hasContract) return 6;
    if (hasQuote) return 5;
    return 4;
  }
  if (item.repliedAt) return 3;
  if (item.openedAt) return 2;
  if (item.sentAt) return 1;
  return 0;
}

function getSentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case "POSITIVE":
      return "#22c55e";
    case "NEGATIVE":
      return "#ef4444";
    case "NEUTRAL":
      return "#eab308";
    default:
      return "#9ca3af";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CampaignContactTracker({
  campaignId,
  onRefresh,
}: CampaignContactTrackerProps) {
  const [items, setItems] = useState<OutreachItemWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadItems();
  }, [campaignId]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/crm/campaigns/${campaignId}/contacts`
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      toast.error("Failed to load campaign contacts");
    }
    setLoading(false);
  }

  async function handleApprove(actionId: string) {
    try {
      const res = await fetch("/api/agents/deal/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision: "approve" }),
      });
      if (res.ok) {
        toast.success("Action approved and executed");
        loadItems();
      } else {
        toast.error("Approval failed");
      }
    } catch {
      toast.error("Approval failed");
    }
  }

  async function handleReject(actionId: string) {
    try {
      const res = await fetch("/api/agents/deal/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision: "reject", reason: "Rejected by user" }),
      });
      if (res.ok) {
        toast.success("Action rejected");
        loadItems();
      }
    } catch {
      toast.error("Rejection failed");
    }
  }

  const filteredItems =
    filter === "all"
      ? items
      : filter === "pending_approval"
        ? items.filter(
            (i) => i.pendingActions?.some((a) => a.status === "PROPOSED")
          )
        : items.filter((i) => {
            const stage = getStageIndex(i);
            return STAGES[stage]?.key === filter;
          });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Contact Progress</h3>
          <Badge variant="outline">{items.length} contacts</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter badges */}
          <div className="flex gap-1 flex-wrap">
            {["all", "pending_approval", "sent", "opened", "replied", "opportunity"].map(
              (f) => (
                <Badge
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setFilter(f)}
                >
                  {f === "pending_approval" ? "⚠️ Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
                </Badge>
              )
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              loadItems();
              onRefresh?.();
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Cards */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading contacts...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No contacts match this filter
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const stageIdx = getStageIndex(item);
            const hasPending = item.pendingActions?.some(
              (a) => a.status === "PROPOSED"
            );
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 transition-all ${
                  hasPending
                    ? "border-amber-500/50 bg-amber-500/5"
                    : item.unsubscribed_at
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border"
                }`}
              >
                {/* Contact Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">
                        {item.candidate_name || item.candidate_email || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.candidate_company && (
                          <span>{item.candidate_company} · </span>
                        )}
                        {item.candidate_email}
                        {item.candidate_job_title && (
                          <span> · {item.candidate_job_title}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.reply_sentiment && (
                      <Badge
                        style={{
                          backgroundColor: getSentimentColor(item.reply_sentiment) + "20",
                          color: getSentimentColor(item.reply_sentiment),
                          borderColor: getSentimentColor(item.reply_sentiment) + "40",
                        }}
                        className="text-xs"
                      >
                        {item.reply_sentiment}
                      </Badge>
                    )}
                    {item.unsubscribed_at && (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="h-3 w-3 mr-1" /> Unsubscribed
                      </Badge>
                    )}
                    {hasPending && (
                      <Badge className="bg-amber-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" /> Approval
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : item.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    {STAGES.map((stage, idx) => {
                      const isActive = idx <= stageIdx;
                      const isCurrent = idx === stageIdx;
                      const StageIcon = stage.icon;

                      return (
                        <Tooltip key={stage.key}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <div
                                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                                  isCurrent
                                    ? "ring-2 ring-offset-1"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: isActive
                                    ? stage.color + "20"
                                    : "transparent",
                                  color: isActive
                                    ? stage.color
                                    : "#d1d5db",
                                  borderColor: stage.color,
                                }}
                              >
                                <StageIcon className="h-3.5 w-3.5" />
                              </div>
                              {idx < STAGES.length - 1 && (
                                <div
                                  className="w-4 h-0.5 mx-0.5"
                                  style={{
                                    backgroundColor: isActive
                                      ? stage.color + "60"
                                      : "#e5e7eb",
                                  }}
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{stage.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>

                  {/* Follow-up indicator */}
                  {item.followup_count > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.followup_count} follow-up{item.followup_count > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    {/* Reply Snippet */}
                    {item.reply_snippet && (
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Latest Reply
                        </p>
                        <p className="text-sm italic">
                          &quot;{item.reply_snippet}&quot;
                        </p>
                      </div>
                    )}

                    {/* Pending Actions */}
                    {item.pendingActions && item.pendingActions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          AI Agent Actions
                        </p>
                        {item.pendingActions.map((action) => (
                          <div
                            key={action.id}
                            className={`border rounded-md p-3 ${
                              action.status === "PROPOSED"
                                ? "border-amber-500/40 bg-amber-500/5"
                                : action.status === "EXECUTED"
                                  ? "border-green-500/40 bg-green-500/5"
                                  : "border-red-500/40 bg-red-500/5"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {action.action_type.replace(/_/g, " ")}
                                </Badge>
                                <Badge
                                  variant={
                                    action.status === "PROPOSED"
                                      ? "default"
                                      : action.status === "EXECUTED"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {action.status}
                                </Badge>
                              </div>
                              {action.status === "PROPOSED" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-green-500/50 text-green-600 hover:bg-green-500/10"
                                    onClick={() => handleApprove(action.id)}
                                  >
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-500/50 text-red-600 hover:bg-red-500/10"
                                    onClick={() => handleReject(action.id)}
                                  >
                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              <Sparkles className="h-3 w-3 inline mr-1" />
                              {action.reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {item.sentAt && (
                        <span>Sent: {new Date(item.sentAt).toLocaleDateString()}</span>
                      )}
                      {item.openedAt && (
                        <span>Opened: {new Date(item.openedAt).toLocaleDateString()}</span>
                      )}
                      {item.repliedAt && (
                        <span>Replied: {new Date(item.repliedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CampaignContactTracker;
