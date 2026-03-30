"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Reply,
    Forward,
    Archive,
    Trash2,
    X,
    Undo2,
    Send,
    Users2,
    UserPlus,
    PenBox,
} from "lucide-react";
import { format } from "date-fns";
import { InboxEmptyState } from "./InboxEmptyState";

interface Message {
    id: string;
    subject: string | null;
    body: string | null;
    createdAt: Date | string;
    is_read: boolean;
    is_important: boolean;
    labels: string[];
    from_user_id: string;
    to_user_id: string;
    from_user?: { id: string; name: string | null; email: string | null } | null;
    to_user?: { id: string; name: string | null; email: string | null } | null;
    recipients?: { recipient_id: string; is_archived?: boolean; is_deleted?: boolean; is_read?: boolean }[];
    status?: string;
    _apiMeta?: { conversation_id?: string; direction?: string; channel?: string; contactId?: string; leadId?: string; clientName?: string; clientEmail?: string; [key: string]: any };
    _thread?: Message[];
    direction?: string;
    senderName?: string;
}

function avatarHue(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

function getInitials(name: string | null | undefined) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface InboxMessageDetailProps {
    selectedMessage: Message | null;
    currentUserId: string;
    isTrash: boolean;
    isApiMessage: boolean;

    // Handlers
    onClose: () => void;
    onReply: () => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    onConvertMessage: (type: "contact" | "lead") => void;
    isConvertingEmail: boolean;
    onCompose: () => void;

    // API reply
    apiReplyOpen: boolean;
    apiReplyBody: string;
    apiReplySending: boolean;
    apiReplyChannel: "EMAIL" | "NOTE";
    onApiReplyOpenChange: (open: boolean) => void;
    onApiReplyBodyChange: (body: string) => void;
    onApiReplyChannelChange: (channel: "EMAIL" | "NOTE") => void;
    onApiReplySend: () => void;
}

export function InboxMessageDetail({
    selectedMessage,
    currentUserId,
    isTrash,
    isApiMessage,
    onClose,
    onReply,
    onArchive,
    onDelete,
    onRestore,
    onPermanentDelete,
    onConvertMessage,
    isConvertingEmail,
    onCompose,
    apiReplyOpen,
    apiReplyBody,
    apiReplySending,
    apiReplyChannel,
    onApiReplyOpenChange,
    onApiReplyBodyChange,
    onApiReplyChannelChange,
    onApiReplySend,
}: InboxMessageDetailProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of thread on message change
    React.useEffect(() => {
        if (selectedMessage?._thread && scrollRef.current) {
            const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
            if (el) {
                requestAnimationFrame(() => {
                    el.scrollTop = el.scrollHeight;
                });
            }
        }
    }, [selectedMessage?.id]);

    if (!selectedMessage) {
        return (
            <div className="h-full flex flex-col">
                <InboxEmptyState type="detail" />
                <div className="flex justify-center pb-8">
                    <Button
                        variant="outline"
                        className="gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600"
                        onClick={onCompose}
                    >
                        <PenBox className="h-4 w-4" />
                        Compose Message
                    </Button>
                </div>
            </div>
        );
    }

    const msg = selectedMessage;
    const fromName = msg.from_user?.name || msg.from_user?.email || "Unknown";
    const fromColor = avatarHue(fromName);
    const showConvertBar = isApiMessage && msg._apiMeta?.channel === "EMAIL" && !msg._apiMeta?.contactId && !msg._apiMeta?.leadId;

    return (
        <div className="flex flex-col h-full min-w-0 overflow-hidden">
            {/* Sticky Header */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex-1 min-w-0 max-w-full">
                    <h3 className="text-[14px] font-semibold text-zinc-100 truncate">
                        {msg.subject || "(No Subject)"}
                    </h3>
                </div>

                <div className="flex items-center flex-wrap gap-2 flex-shrink-0">
                    {showConvertBar && (
                        <div className="flex items-center gap-1.5 border-r border-zinc-700/50 pr-2">
                            <Button size="sm" variant="outline" onClick={() => onConvertMessage("contact")} disabled={isConvertingEmail} className="h-7 text-[11px] gap-1 border-zinc-700 text-zinc-300 hover:text-white">
                                <Users2 className="w-3 h-3" /> Contact
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onConvertMessage("lead")} disabled={isConvertingEmail} className="h-7 text-[11px] gap-1 border-zinc-700 text-zinc-300 hover:text-white">
                                <UserPlus className="w-3 h-3" /> Lead
                            </Button>
                        </div>
                    )}

                    {/* Action toolbar */}
                    <div className="flex flex-wrap items-center gap-0.5 flex-shrink-0">
                        {isTrash ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => onRestore(msg.id)} className="gap-1.5 h-7 text-[11px] border-zinc-700 text-zinc-300 hover:text-white">
                                    <Undo2 className="h-3.5 w-3.5" /> Restore
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onPermanentDelete(msg.id)} className="gap-1.5 h-7 text-[11px]">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                                </Button>
                            </>
                        ) : (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" onClick={onReply}>
                                            <Reply className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">Reply (R)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                                            <Forward className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">Forward</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" onClick={() => onArchive(msg.id)}>
                                            <Archive className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">Archive (E)</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(msg.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">Delete (#)</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-zinc-500 hover:text-zinc-300" onClick={onClose}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sender Info Bar */}
            <div className="px-4 py-3 border-b border-zinc-800/40 bg-zinc-900/30">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-zinc-700/50">
                        <AvatarFallback
                            className="text-[11px] font-bold"
                            style={{ backgroundColor: `${fromColor}15`, color: fromColor }}
                        >
                            {getInitials(fromName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-zinc-100">{fromName}</span>
                            {msg.from_user_id === currentUserId && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-zinc-700 text-zinc-400">You</Badge>
                            )}
                        </div>
                        <div className="text-[11.5px] text-zinc-500">
                            To: {msg.to_user?.name || msg.to_user?.email || "Unknown"}
                            {msg.to_user_id === currentUserId && " (You)"}
                        </div>
                        <div className="text-[10.5px] text-zinc-600 mt-0.5">
                            {format(new Date(msg.createdAt), "PPpp")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Body / Thread */}
            <ScrollArea className="flex-1 min-w-0" ref={scrollRef}>
                <div className="p-4 overflow-hidden">
                    {/* API message badges */}
                    {isApiMessage && (
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="text-[10px] h-5 bg-indigo-500/10 text-indigo-400 border-indigo-500/25">
                                {msg._apiMeta?.channel || "NOTE"}
                            </Badge>
                            {msg._apiMeta?.conversation_id && (
                                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-mono">
                                    Thread: {msg._apiMeta.conversation_id.slice(0, 8)}…
                                </Badge>
                            )}
                            {msg._thread && msg._thread.length > 1 && (
                                <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 text-zinc-400">
                                    {msg._thread.length} messages
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Thread view */}
                    {isApiMessage && msg._thread && msg._thread.length > 0 ? (
                        <div className="space-y-3">
                            {msg._thread.map((threadMsg: any) => {
                                const isOut = threadMsg.direction === "OUTBOUND" || threadMsg._apiMeta?.direction === "OUTBOUND";
                                const senderName = threadMsg.senderName || threadMsg.from_user?.name || (isOut ? "You" : "Customer");
                                const sColor = avatarHue(senderName);
                                return (
                                    <div key={threadMsg.id} className={cn("flex", isOut ? "justify-end" : "justify-start")}>
                                        {!isOut && (
                                            <Avatar className="h-7 w-7 mr-2 mt-1 flex-shrink-0 ring-1 ring-zinc-700/30">
                                                <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: `${sColor}15`, color: sColor }}>
                                                    {getInitials(senderName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-[75%] rounded-2xl px-4 py-2.5",
                                            isOut
                                                ? "bg-indigo-600 text-white rounded-br-md"
                                                : "bg-zinc-800/80 border border-zinc-700/40 rounded-bl-md"
                                        )}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("text-[10.5px] font-semibold", isOut ? "text-indigo-200" : "text-zinc-400")}>
                                                    {senderName}
                                                </span>
                                                <span className={cn("text-[9.5px]", isOut ? "text-indigo-300/60" : "text-zinc-600")}>
                                                    {format(new Date(threadMsg.createdAt), "MMM d, h:mm a")}
                                                </span>
                                            </div>
                                            <div className={cn("text-[13px] whitespace-pre-wrap break-words break-all leading-relaxed", isOut ? "text-white/95" : "text-zinc-200")}>
                                                {threadMsg.body}
                                            </div>
                                        </div>
                                        {isOut && (
                                            <Avatar className="h-7 w-7 ml-2 mt-1 flex-shrink-0 ring-1 ring-zinc-700/30">
                                                <AvatarFallback className="text-[9px] font-bold bg-indigo-500/15 text-indigo-400">
                                                    {getInitials(senderName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Single message view */
                        <div className="prose prose-sm prose-invert w-full min-w-0 overflow-hidden">
                            <div className="text-[13px] text-zinc-300 leading-relaxed break-words break-all whitespace-pre-wrap">
                                {msg.body}
                            </div>
                        </div>
                    )}

                    {/* API Reply Form */}
                    {isApiMessage && apiReplyOpen && (
                        <div className="mt-5 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Reply className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="text-[12px] font-semibold text-zinc-300">Reply to thread</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-[11px] text-zinc-500 w-14">Channel</Label>
                                    <Select value={apiReplyChannel} onValueChange={(v: any) => onApiReplyChannelChange(v)}>
                                        <SelectTrigger className="h-7 w-28 text-[11px] bg-zinc-800/50 border-zinc-700/50 text-zinc-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700">
                                            <SelectItem value="EMAIL">Email</SelectItem>
                                            <SelectItem value="NOTE">Note</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {apiReplyChannel === "EMAIL" && (
                                        <span className="text-[10px] text-amber-400/80">Will send actual email</span>
                                    )}
                                </div>
                                <Textarea
                                    placeholder="Type your reply..."
                                    rows={3}
                                    value={apiReplyBody}
                                    onChange={(e) => onApiReplyBodyChange(e.target.value)}
                                    className="text-[12.5px] bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-indigo-500/30"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { onApiReplyOpenChange(false); onApiReplyBodyChange(""); }} className="h-7 text-[11px] border-zinc-700 text-zinc-400">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={onApiReplySend} disabled={apiReplySending || !apiReplyBody.trim()} className="h-7 text-[11px] gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white">
                                        <Send className="h-3 w-3" />
                                        {apiReplySending ? "Sending..." : "Send Reply"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick reply button */}
                    {isApiMessage && !apiReplyOpen && (
                        <div className="mt-5">
                            <Button
                                variant="outline"
                                className="w-full gap-2 h-9 text-[12px] border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-600"
                                onClick={() => {
                                    onApiReplyOpenChange(true);
                                    onApiReplyChannelChange(msg._apiMeta?.channel === "EMAIL" ? "EMAIL" : "NOTE");
                                }}
                            >
                                <Reply className="h-3.5 w-3.5" />
                                Reply to this message
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
