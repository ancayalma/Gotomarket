"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

type NavId = "inbox" | "dms" | "emails" | "sms" | "internal" | "sent" | "drafts" | "archive" | "trash" | "submissions" | "notifications";

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

type UnifiedItem = 
    | { type: "message", data: Message, createdAt: Date }
    | { type: "submission", data: FormSubmission, createdAt: Date };

function groupUnifiedByDate(items: UnifiedItem[]): { label: string; items: UnifiedItem[] }[] {
    const groups: Map<string, UnifiedItem[]> = new Map();

    for (const item of items) {
        const d = item.createdAt;
        let label: string;
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";
        else if (isThisWeek(d, { weekStartsOn: 1 })) label = "This Week";
        else label = format(d, "MMMM yyyy");

        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(item);
    }

    return Array.from(groups.entries()).map(([label, groupItems]) => {
        groupItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return { label, items: groupItems };
    });
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
        dms: "DMs",
        emails: "Emails",
        sms: "SMS",
        internal: "Internal",
        sent: "Sent",
        drafts: "Drafts",
        archive: "Archive",
        trash: "Trash",
        submissions: "Submissions",
        notifications: "Notifications",
    };

    const [filterTag, setFilterTag] = React.useState<string>("ALL");

    const localFilteredMessages = React.useMemo(() => {
        if (filterTag === "ALL") return filteredMessages;
        return filteredMessages.filter(m => {
            const isInternal = !m._apiMeta;
            const channel = isInternal ? "INTERNAL" : (m._apiMeta?.channel?.toUpperCase() === "NOTE" ? "DM" : m._apiMeta?.channel?.toUpperCase());
            return channel === filterTag;
        });
    }, [filteredMessages, filterTag]);

    const localActiveSubmissions = React.useMemo(() => {
        if (filterTag === "ALL") return activeSubmissions;
        return filterTag === "FORM" ? activeSubmissions : [];
    }, [activeSubmissions, filterTag]);

    const localArchivedSubmissions = React.useMemo(() => {
        if (filterTag === "ALL") return archivedSubmissions;
        return filterTag === "FORM" ? archivedSubmissions : [];
    }, [archivedSubmissions, filterTag]);

    const localTrashedSubmissions = React.useMemo(() => {
        if (filterTag === "ALL") return trashedSubmissions;
        return filterTag === "FORM" ? trashedSubmissions : [];
    }, [trashedSubmissions, filterTag]);

    const unifiedItems = React.useMemo(() => {
        const items: UnifiedItem[] = [];
        
        localFilteredMessages.forEach(m => {
            items.push({ type: "message", data: m, createdAt: new Date(m.createdAt) });
        });

        if (activeNav === "inbox") {
            localActiveSubmissions.forEach(sub => {
                items.push({ type: "submission", data: sub, createdAt: new Date(sub.createdAt) });
            });
        } else if (activeNav === "archive") {
            localArchivedSubmissions.forEach(sub => {
                items.push({ type: "submission", data: sub, createdAt: new Date(sub.createdAt) });
            });
        } else if (activeNav === "trash") {
            localTrashedSubmissions.forEach(sub => {
                items.push({ type: "submission", data: sub, createdAt: new Date(sub.createdAt) });
            });
        }
        
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return items;
    }, [localFilteredMessages, localActiveSubmissions, localArchivedSubmissions, localTrashedSubmissions, activeNav]);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center px-4 py-2.5 border-b border-border/60 bg-muted/20">
                <h2 className="text-[15px] font-bold text-foreground tracking-tight">
                    {folderLabels[activeNav] || "Inbox"}
                </h2>
                <div className="ml-auto flex items-center gap-2">
                    <Tabs value={filterReadStatus} onValueChange={onFilterChange} className="w-auto">
                        <TabsList className="h-7 bg-muted/50 border border-border/60 p-0.5">
                            <TabsTrigger value="all" className="text-[11px] h-6 px-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground shadow-sm">All</TabsTrigger>
                            <TabsTrigger value="unread" className="text-[11px] h-6 px-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground shadow-sm">Unread</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2 border-b border-border/60 bg-muted/10 backdrop-blur-sm flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-8 h-8 text-[12.5px] bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 focus-visible:border-primary/40 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                {activeNav !== "notifications" && (
                    <Select value={filterTag} onValueChange={setFilterTag}>
                        <SelectTrigger className="h-8 w-[110px] text-[11px] bg-background border-border">
                            <SelectValue placeholder="All Channels" />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="end" className="text-[11px]">
                            <SelectItem value="ALL">All Channels</SelectItem>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="SMS">SMS</SelectItem>
                            <SelectItem value="DM">DM</SelectItem>
                            <SelectItem value="FORM">Form</SelectItem>
                            <SelectItem value="INTERNAL">Internal</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Message List */}
            <ScrollArea className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
                {activeNav === "submissions" ? (
                    /* ─── Submissions List ─── */
                    localActiveSubmissions.length === 0 ? (
                        <InboxEmptyState type="submissions" />
                    ) : (
                        <div className="divide-y divide-border/40 w-full max-w-full min-w-0">
                            {localActiveSubmissions.map((sub) => {
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
                                        channel="FORM"
                                        hasApiMeta={true}
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
                        <div className="divide-y divide-border/40 w-full max-w-full min-w-0">
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
                                    hasApiMeta={false}
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
                    (localTrashedSubmissions.length === 0 && localFilteredMessages.length === 0) ? (
                        <InboxEmptyState type="trash" />
                    ) : (
                        <div className="divide-y divide-border/40 w-full max-w-full min-w-0">
                            {localFilteredMessages.map((msg) => {
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
                                        channel={msg._apiMeta?.channel}
                                        hasApiMeta={!!msg._apiMeta}
                                        onClick={() => onSelectMessage(msg.id)}
                                    />
                                );
                            })}
                            {localTrashedSubmissions.map((sub) => {
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
                                        channel="FORM"
                                        hasApiMeta={true}
                                        onClick={() => onSelectSubmission(sub.id)}
                                    />
                                );
                            })}
                        </div>
                    )
                ) : (unifiedItems.length === 0) ? (
                    <InboxEmptyState type={activeNav} />
                ) : (
                    /* ─── Standard message list with date groups ─── */
                    <div>
                        {/* Date-grouped messages and submissions */}
                        {groupUnifiedByDate(unifiedItems).map((group) => (
                            <div key={group.label}>
                                <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] bg-muted sticky top-0 z-10 border-b border-border/40 backdrop-blur-md">
                                    {group.label}
                                </div>
                                <div className="divide-y divide-border/30 w-full max-w-full min-w-0">
                                    {group.items.map((item) => {
                                        if (item.type === "submission") {
                                            const sub = item.data;
                                            const email = sub.data?.email || sub.data?.Email || "";
                                            const name = sub.data?.name || sub.data?.full_name ||
                                                `${sub.data?.first_name || ""} ${sub.data?.last_name || ""}`.trim() ||
                                                sub.data?.firstName || email.split("@")[0] || "Anonymous";
                                            return (
                                                <InboxMessageRow
                                                    key={`sub-${sub.id}`}
                                                    id={sub.id}
                                                    name={name}
                                                    email={email}
                                                    subject={sub.form.name}
                                                    body={activeNav === "archive" ? "Archived submission" : (email || sub.source_url || "Form submission")}
                                                    createdAt={sub.createdAt}
                                                    isRead={sub.status !== "NEW"}
                                                    isImportant={false}
                                                    isSelected={selectedSubmissionId === sub.id}
                                                    isFromMe={false}
                                                    channel="FORM"
                                                    hasApiMeta={true}
                                                    onClick={() => {
                                                        onSelectSubmission(sub.id);
                                                        if (activeNav === "inbox") onSubmissionViewed(sub.id, sub.status);
                                                    }}
                                                />
                                            );
                                        } else {
                                            const message = item.data;
                                            const isFromMe = message.from_user_id === currentUserId;
                                            const other = isFromMe ? message.to_user : message.from_user;
                                            return (
                                                <InboxMessageRow
                                                    key={`msg-${message.id}`}
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
                                        }
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
                    <div className="bg-background/95 backdrop-blur-md rounded-full shadow-lg border border-border flex items-center gap-1.5 p-1.5 pr-2">
                        <span className="text-[11px] font-semibold text-foreground px-3 border-r border-border whitespace-nowrap">
                            {selectedBatchIds.length} Selected
                        </span>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full text-[11px]"
                            onClick={onBatchMarkRead}
                            disabled={isBulkProcessing}
                        >
                            Mark Read
                        </Button>

                        {activeNav !== "archive" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full text-[11px]"
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
                            className="h-7 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full text-[11px]"
                            onClick={onBatchDelete}
                            disabled={isBulkProcessing}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                        
                        <div className="w-[1px] h-4 bg-border mx-1" />
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
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
