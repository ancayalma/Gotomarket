"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Archive, Star, Trash2, Mail, MessageSquare, Phone } from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// Deterministic color from initials
function avatarHue(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 55%)`;
}

function getInitials(name: string | null | undefined) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function smartTimestamp(date: Date | string) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = diffMs / 60000;

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${Math.floor(diffMin)}m`;
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    if (diffMs < 7 * 86400000) return format(d, "EEE");
    return format(d, "MMM d");
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
    EMAIL: Mail,
    SMS: Phone,
    NOTE: MessageSquare,
};

interface InboxMessageRowProps {
    id: string;
    name: string;
    email?: string;
    subject: string | null;
    body: string | null;
    createdAt: Date | string;
    isRead: boolean;
    isImportant: boolean;
    isSelected: boolean;
    isFromMe: boolean;
    threadCount?: number;
    channel?: string;
    hasApiMeta?: boolean;
    onClick: () => void;
    onArchive?: () => void;
    onDelete?: () => void;
    // Batch UI
    isSelectedForBatch?: boolean;
    onToggleBatchSelection?: () => void;
    batchModeActive?: boolean;
}

export function InboxMessageRow({
    id,
    name,
    email,
    subject,
    body,
    createdAt,
    isRead,
    isImportant,
    isSelected,
    isFromMe,
    threadCount,
    channel,
    hasApiMeta,
    onClick,
    onArchive,
    onDelete,
    isSelectedForBatch = false,
    onToggleBatchSelection,
    batchModeActive = false,
}: InboxMessageRowProps) {
    const initials = getInitials(name);
    const color = avatarHue(name || "?");
    const displayName = isFromMe ? `To: ${name || email || "Unknown"}` : name || email || "Unknown";
    const ChannelIcon = channel ? CHANNEL_ICON[channel.toUpperCase()] : null;

    // Swipe state
    const startX = React.useRef(0);
    const currentX = React.useRef(0);
    const rowRef = React.useRef<HTMLDivElement>(null);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        currentX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const diff = e.touches[0].clientX - startX.current;
        currentX.current = diff;
        if (rowRef.current) {
            const clamped = Math.max(-120, Math.min(120, diff));
            rowRef.current.style.transform = `translateX(${clamped}px)`;
            rowRef.current.style.transition = "none";
        }
    };

    const handleTouchEnd = () => {
        if (rowRef.current) {
            rowRef.current.style.transition = "transform 0.25s ease";
            rowRef.current.style.transform = "translateX(0)";
        }
        if (currentX.current < -threshold && onArchive) {
            onArchive();
        } else if (currentX.current > threshold && onDelete) {
            onDelete();
        }
    };

    return (
        <div className="relative w-full max-w-full min-w-0">
            {/* Swipe actions background (hidden on desktop to prevent visual double-hover bug) */}
            <div className="absolute inset-0 md:hidden flex items-center justify-end gap-4 px-4 bg-zinc-950 pointer-events-none">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Archive className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 text-red-500">
                    <Trash2 className="h-4 w-4" />
                </div>
            </div>

            <div
                ref={rowRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                    // Prevent normal click if clicking the checkbox/switch
                    if ((e.target as HTMLElement).closest('[role="checkbox"], [role="switch"]')) return;
                    onClick();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onClick();
                    }
                }}
                className={cn(
                    "bg-zinc-950 group w-full grid grid-cols-[auto_minmax(0,1fr)_54px] items-center gap-3 pl-4 pr-6 py-3.5 text-left transition-all duration-150 border-l-2 relative overflow-hidden",
                    isSelected ? "border-l-primary z-10" : "border-l-transparent hover:z-10"
                )}
            >
                {/* Overlay for hover/select highlight - structurally separates BG color from highlight */}
                <div className={cn(
                    "absolute inset-0 pointer-events-none transition-colors duration-150",
                    isSelectedForBatch 
                        ? "bg-indigo-500/10 border-l border-indigo-500" 
                        : isSelected 
                            ? "bg-white/[0.04]" 
                            : "group-hover:bg-white/[0.025]",
                    !isRead && !isSelected && !isSelectedForBatch && "bg-white/[0.02]"
                )} />

                {/* Col 1: Avatar & Checkbox Container */}
                <div className="relative flex-shrink-0 flex items-center justify-center w-9 h-9">
                    {!isRead && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        </div>
                    )}
                    
                    <div className="relative w-full h-full">
                        <Avatar 
                            className={cn(
                                "h-9 w-9 ring-1 ring-zinc-700/50 absolute inset-0 transition-opacity duration-200",
                                (batchModeActive || isSelectedForBatch) 
                                    ? "opacity-0" 
                                    : "opacity-100 group-hover:opacity-0"
                            )}
                        >
                            <AvatarFallback
                                className="text-[11px] font-bold"
                                style={{ backgroundColor: `${color}20`, color }}
                            >
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {/* Batch UI Checkbox underneath/overlay */}
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10",
                            (batchModeActive || isSelectedForBatch) 
                                ? "opacity-100" 
                                : "opacity-0 group-hover:opacity-100"
                        )}>
                            <Checkbox 
                                checked={isSelectedForBatch}
                                onCheckedChange={onToggleBatchSelection}
                                className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-white border-zinc-500/50"
                                onClick={(e) => { e.stopPropagation(); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Col 2: Center Content (Strict Text Ellipsis via Grid Minmax Constraints) */}
                <div className="flex flex-col min-w-0 overflow-hidden space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                        <span className={cn(
                            "text-[13px] overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1",
                            !isRead ? "font-semibold text-zinc-100" : "font-medium text-zinc-300"
                        )}>
                            {displayName}
                        </span>
                        {isImportant && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                        )}
                        {ChannelIcon && (
                            <ChannelIcon className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                        )}
                        {threadCount && threadCount > 1 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-zinc-700 text-zinc-400 font-mono flex-shrink-0">
                                {threadCount}
                            </Badge>
                        )}
                    </div>
                    <p className={cn(
                        "text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap w-full",
                        !isRead ? "text-zinc-200 font-medium" : "text-zinc-400"
                    )}>
                        {subject || "(No Subject)"}
                    </p>
                    <p className="text-[11.5px] text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap w-full leading-relaxed">
                        {(body || "").replace(/<[^>]*>/g, "").slice(0, 100)}
                    </p>
                </div>

                {/* Col 3: Right Action Column (Time / Hover Actions) */}
                <div className="flex flex-col items-end justify-center min-w-0 w-full relative h-[38px]">
                    {/* Time (visible when NOT hovered) */}
                    <span className={cn(
                        "text-[10.5px] tabular-nums transition-opacity duration-150 absolute top-1 right-0",
                        !isRead ? "text-indigo-400 font-medium" : "text-zinc-500",
                        "group-hover:opacity-0"
                    )}>
                        {smartTimestamp(createdAt)}
                    </span>

                    {/* Hover quick actions (visible when hovered) */}
                    <div className="hidden group-hover:flex items-center gap-0.5 absolute top-0 right-0 z-20 bg-zinc-950/95 backdrop-blur-[2px] rounded-md shadow-md border border-zinc-700/60 p-0.5">
                        {onArchive && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(); }}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Archive"
                            >
                                <Archive className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// EOF
