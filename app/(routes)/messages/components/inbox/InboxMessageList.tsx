"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Search,
    Inbox,
    FormInput,
    Bell,
    Trash2,
    Archive,
} from "lucide-react";
import { InboxMessageRow } from "./InboxMessageRow";
import { InboxEmptyState } from "./InboxEmptyState";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";

// Type shims matching parent
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
    _apiMeta?: { channel?: string; [key: string]: any };
    _thread?: Message[];
    direction?: string;
    senderName?: string;
}

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

interface SystemNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    isRead: boolean;
    isCleared: boolean;
    createdAt: Date | string;
}

type NavId = "inbox" | "sent" | "drafts" | "archive" | "trash" | "submissions" | "notifications";

interface InboxMessageListProps {
    activeNav: NavId;
    filteredMessages: Message[];
    activeSubmissions: FormSubmission[];
    activeNotifications: SystemNotification[];
    archivedSubmissions: FormSubmission[];
    trashedSubmissions: FormSubmission[];
    currentUserId: string;
    selectedMessageId: string | null;
    selectedSubmissionId: string | null;
    selectedNotificationId: string | null;
    searchQuery: string;
    filterReadStatus: string;
    onSearchChange: (q: string) => void;
    onFilterChange: (f: string) => void;
    onSelectMessage: (id: string) => void;
    onSelectSubmission: (id: string) => void;
    onSelectNotification: (id: string) => void;
    onArchiveMessage: (id: string) => void;
    onDeleteMessage: (id: string) => void;
    onEditDraft: (msg: Message) => void;
    onMessageRead: (msg: Message) => void;
    onSubmissionViewed: (id: string, status: string) => void;
    onMarkNotificationRead: (n: SystemNotification) => void;

    // Batch Selection Props
    selectedBatchIds: string[];
    onToggleBatchSelection: (id: string) => void;
    onClearBatchSelection: () => void;
    onBatchArchive: () => void;
    onBatchDelete: () => void;
    onBatchMarkRead: () => void;
    isBulkProcessing: boolean;
}

// Group messages by date
function groupByDate(messages: Message[]): { label: string; messages: Message[] }[] {
    const groups: Map<string, Message[]> = new Map();

    for (const msg of messages) {
        const d = new Date(msg.createdAt);
        let label: string;
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";
        else if (isThisWeek(d, { weekStartsOn: 1 })) label = "This Week";
        else label = format(d, "MMMM yyyy");

        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(msg);
    }

    return Array.from(groups.entries()).map(([label, msgs]) => ({ label, messages: msgs }));
}

export function InboxMessageList({
    activeNav,
    filteredMessages,
    activeSubmissions,
    activeNotifications,
    archivedSubmissions,
    trashedSubmissions,
    currentUserId,
    selectedMessageId,
    selectedSubmissionId,
    selectedNotificationId,
    searchQuery,
    filterReadStatus,
    onSearchChange,
    onFilterChange,
    onSelectMessage,
    onSelectSubmission,
    onSelectNotification,
    onArchiveMessage,
    onDeleteMessage,
    onEditDraft,
    onMessageRead,
    onSubmissionViewed,
    onMarkNotificationRead,
    selectedBatchIds,
    onToggleBatchSelection,
    onClearBatchSelection,
    onBatchArchive,
    onBatchDelete,
    onBatchMarkRead,
    isBulkProcessing,
}: InboxMessageListProps) {
    const folderLabels: Record<string, string> = {
        inbox: "Inbox",
        sent: "Sent",
        drafts: "Drafts",
        archive: "Archive",
        trash: "Trash",
        submissions: "Submissions",
        notifications: "Notifications",
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/30">
            {/* Header */}
            <div className="flex items-center px-4 py-2.5 border-b border-zinc-800/60">
                <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight">
                    {folderLabels[activeNav] || "Inbox"}
                </h2>
                <div className="ml-auto flex items-center gap-2">
                    <Tabs value={filterReadStatus} onValueChange={onFilterChange} className="w-auto">
                        <TabsList className="h-7 bg-zinc-800/50 border border-zinc-700/40 p-0.5">
                            <TabsTrigger value="all" className="text-[11px] h-6 px-2.5 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">All</TabsTrigger>
                            <TabsTrigger value="unread" className="text-[11px] h-6 px-2.5 data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400">Unread</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2 border-b border-zinc-800/40 bg-zinc-900/40 backdrop-blur-sm">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-8 h-8 text-[12.5px] bg-zinc-800/40 border-zinc-700/40 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/40"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Message List */}
            <ScrollArea className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
                {activeNav === "submissions" ? (
                    /* ─── Submissions List ─── */
                    activeSubmissions.length === 0 ? (
                        <InboxEmptyState type="submissions" />
                    ) : (
                        <div className="divide-y divide-zinc-800/40 w-full max-w-full min-w-0">
                            {activeSubmissions.map((sub) => {
                                const email = sub.data?.email || sub.data?.Email || "";
                                const name = sub.data?.name || sub.data?.full_name ||
                                    `${sub.data?.first_name || ""} ${sub.data?.last_name || ""}`.trim() ||
                                    sub.data?.firstName || email.split("@")[0] || "Anonymous";
                                return (
                                    <InboxMessageRow
                                        key={sub.id}
                                        id={sub.id}
                                        name={name}
                                        email={email}
                                        subject={sub.form.name}
                                        body={email || sub.source_url || "Form submission"}
                                        createdAt={sub.createdAt}
                                        isRead={sub.status !== "NEW"}
                                        isImportant={false}
                                        isSelected={selectedSubmissionId === sub.id}
                                        isFromMe={false}
                                        channel="NOTE"
                                        onClick={() => {
                                            onSelectSubmission(sub.id);
                                            onSubmissionViewed(sub.id, sub.status);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )
                ) : activeNav === "notifications" ? (
                    /* ─── Notifications List ─── */
                    activeNotifications.length === 0 ? (
                        <InboxEmptyState type="notifications" />
                    ) : (
                        <div className="divide-y divide-zinc-800/40 w-full max-w-full min-w-0">
                            {activeNotifications.map((notification) => (
                                <InboxMessageRow
                                    key={notification.id}
                                    id={notification.id}
                                    name="System"
                                    subject={notification.title}
                                    body={notification.message}
                                    createdAt={notification.createdAt}
                                    isRead={notification.isRead}
                                    isImportant={false}
                                    isSelected={selectedNotificationId === notification.id}
                                    isFromMe={false}
                                    onClick={() => {
                                        onSelectNotification(notification.id);
                                        onMarkNotificationRead(notification);
                                    }}
                                />
                            ))}
                        </div>
                    )
                ) : activeNav === "trash" ? (
                    /* ─── Trash (combined messages + submissions) ─── */
                    (trashedSubmissions.length === 0 && filteredMessages.length === 0) ? (
                        <InboxEmptyState type="trash" />
                    ) : (
                        <div className="divide-y divide-zinc-800/40 w-full max-w-full min-w-0">
                            {filteredMessages.map((msg) => {
                                const isFromMe = msg.from_user_id === currentUserId;
                                const other = isFromMe ? msg.to_user : msg.from_user;
                                return (
                                    <InboxMessageRow
                                        key={msg.id}
                                        id={msg.id}
                                        name={other?.name || other?.email || "Unknown"}
                                        email={other?.email || ""}
                                        subject={msg.subject}
                                        body={msg.body}
                                        createdAt={msg.createdAt}
                                        isRead={true}
                                        isImportant={false}
                                        isSelected={selectedMessageId === msg.id}
                                        isFromMe={isFromMe}
                                        onClick={() => onSelectMessage(msg.id)}
                                    />
                                );
                            })}
                            {trashedSubmissions.map((sub) => {
                                const name = sub.data?.name || sub.data?.email?.split("@")[0] || "Anonymous";
                                return (
                                    <InboxMessageRow
                                        key={sub.id}
                                        id={sub.id}
                                        name={name}
                                        subject={sub.form.name}
                                        body="Form submission"
                                        createdAt={sub.createdAt}
                                        isRead={true}
                                        isImportant={false}
                                        isSelected={selectedSubmissionId === sub.id}
                                        isFromMe={false}
                                        onClick={() => onSelectSubmission(sub.id)}
                                    />
                                );
                            })}
                        </div>
                    )
                ) : (filteredMessages.length === 0 && (activeNav !== "archive" || archivedSubmissions.length === 0)) ? (
                    <InboxEmptyState type={activeNav} />
                ) : (
                    /* ─── Standard message list with date groups ─── */
                    <div>
                        {/* Archived submissions in archive view */}
                        {activeNav === "archive" && archivedSubmissions.length > 0 && (
                            <>
                                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] bg-zinc-900/60 border-b border-zinc-800/40">
                                    Form Submissions
                                </div>
                                {archivedSubmissions.map((sub) => (
                                    <InboxMessageRow
                                        key={sub.id}
                                        id={sub.id}
                                        name={sub.data?.name || "Anonymous"}
                                        subject={sub.form.name}
                                        body="Archived submission"
                                        createdAt={sub.createdAt}
                                        isRead={true}
                                        isImportant={false}
                                        isSelected={selectedSubmissionId === sub.id}
                                        isFromMe={false}
                                        onClick={() => onSelectSubmission(sub.id)}
                                    />
                                ))}
                                {filteredMessages.length > 0 && (
                                    <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] bg-zinc-900/60 border-b border-zinc-800/40">
                                        Messages
                                    </div>
                                )}
                            </>
                        )}

                        {/* Date-grouped messages */}
                        {groupByDate(filteredMessages).map((group) => (
                            <div key={group.label}>
                                <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] bg-zinc-900/60 sticky top-0 z-10 border-b border-zinc-800/40 backdrop-blur-sm">
                                    {group.label}
                                </div>
                                <div className="divide-y divide-zinc-800/30 w-full max-w-full min-w-0">
                                    {group.messages.map((message) => {
                                        const isFromMe = message.from_user_id === currentUserId;
                                        const other = isFromMe ? message.to_user : message.from_user;
                                        return (
                                            <InboxMessageRow
                                                key={message.id}
                                                id={message.id}
                                                name={other?.name || other?.email || "Unknown"}
                                                email={other?.email || ""}
                                                subject={message.subject}
                                                body={message.body}
                                                createdAt={message.createdAt}
                                                isRead={message.is_read}
                                                isImportant={message.is_important}
                                                isSelected={selectedMessageId === message.id}
                                                isFromMe={isFromMe}
                                                threadCount={message._thread?.length}
                                                channel={message._apiMeta?.channel}
                                                hasApiMeta={!!message._apiMeta}
                                                onClick={() => {
                                                    if (activeNav === "drafts") {
                                                        onEditDraft(message);
                                                    } else {
                                                        onSelectMessage(message.id);
                                                        onMessageRead(message);
                                                    }
                                                }}
                                                onDelete={() => onDeleteMessage(message.id)}
                                                isSelectedForBatch={selectedBatchIds.includes(message.id)}
                                                onToggleBatchSelection={() => onToggleBatchSelection(message.id)}
                                                batchModeActive={selectedBatchIds.length > 0}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Bulk Action Toolbar */}
            {selectedBatchIds.length > 0 && (
                <div className="fixed bottom-[120px] md:bottom-[100px] left-1/2 md:left-[52%] -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                    <div className="bg-zinc-950/95 backdrop-blur-md rounded-full shadow-lg border border-zinc-700/60 flex items-center gap-1.5 p-1.5 pr-2">
                        <span className="text-[11px] font-semibold text-zinc-300 px-3 border-r border-zinc-800 whitespace-nowrap">
                            {selectedBatchIds.length} Selected
                        </span>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full text-[11px]"
                            onClick={onBatchMarkRead}
                            disabled={isBulkProcessing}
                        >
                            Mark Read
                        </Button>

                        {activeNav !== "archive" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full text-[11px]"
                                onClick={onBatchArchive}
                                disabled={isBulkProcessing}
                            >
                                <Archive className="h-3.5 w-3.5 mr-1.5" />
                                Archive
                            </Button>
                        )}
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full text-[11px]"
                            onClick={onBatchDelete}
                            disabled={isBulkProcessing}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                        
                        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full"
                            onClick={onClearBatchSelection}
                            disabled={isBulkProcessing}
                        >
                            ✕
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
