"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Inbox,
    Send,
    File,
    Archive,
    Trash2,
    FormInput,
    Bell,
    PenBox,
    FileText,
} from "lucide-react";
import Link from "next/link";

type NavId = "inbox" | "sent" | "drafts" | "archive" | "trash" | "submissions" | "notifications";

interface NavItem {
    id: NavId;
    title: string;
    icon: React.ElementType;
    count: number;
}

interface InboxSidebarProps {
    activeNav: NavId;
    onNavChange: (nav: NavId) => void;
    onCompose: () => void;
    isCollapsed: boolean;
    currentUserName: string;
    currentUserEmail: string;
    navItems: NavItem[];
}

function getInitials(name: string | null | undefined) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function InboxSidebar({
    activeNav,
    onNavChange,
    onCompose,
    isCollapsed,
    currentUserName,
    currentUserEmail,
    navItems,
}: InboxSidebarProps) {
    return (
        <div className="flex flex-col h-full bg-zinc-950/50">
            {/* User Identity Card */}
            <div className="p-3 border-b border-zinc-800/60">
                {isCollapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 mx-auto ring-1 ring-zinc-700/50 cursor-default">
                                <AvatarFallback className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400">
                                    {getInitials(currentUserName)}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-zinc-800 border-zinc-700 text-zinc-200">
                            <p className="font-medium text-xs">{currentUserName}</p>
                            <p className="text-[10px] text-zinc-400">{currentUserEmail}</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 ring-1 ring-zinc-700/50">
                            <AvatarFallback className="text-[11px] font-bold bg-indigo-500/15 text-indigo-400">
                                {getInitials(currentUserName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-zinc-200 truncate">{currentUserName}</p>
                            <p className="text-[10.5px] text-zinc-500 truncate">{currentUserEmail}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Button */}
            <div className="p-2">
                {isCollapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200"
                                onClick={onCompose}
                            >
                                <PenBox className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-zinc-800 border-zinc-700 text-zinc-200">Compose</TooltipContent>
                    </Tooltip>
                ) : (
                    <Button
                        className="w-full gap-2 h-9 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 font-semibold text-[13px]"
                        onClick={onCompose}
                    >
                        <PenBox className="h-3.5 w-3.5" />
                        Compose
                    </Button>
                )}
            </div>

            <Separator className="bg-zinc-800/60" />

            {/* Navigation Items */}
            <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = activeNav === item.id;
                    const Icon = item.icon;
                    return (
                        <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onNavChange(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 relative",
                                        isActive
                                            ? "bg-white/[0.07] text-white font-semibold"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-indigo-500" />
                                    )}
                                    <Icon className={cn(
                                        "h-4 w-4 flex-shrink-0 transition-colors",
                                        isActive ? "text-indigo-400" : ""
                                    )} />
                                    {!isCollapsed && (
                                        <>
                                            <span className="flex-1 text-left truncate">{item.title}</span>
                                            {item.count > 0 && (
                                                <Badge
                                                    className={cn(
                                                        "ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-bold border-0 tabular-nums",
                                                        isActive
                                                            ? "bg-indigo-500/25 text-indigo-300"
                                                            : "bg-zinc-800 text-zinc-400"
                                                    )}
                                                >
                                                    {item.count > 99 ? "99+" : item.count}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right" className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                    {item.title} {item.count > 0 && `(${item.count})`}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    );
                })}
            </nav>

            {/* Forms Builder Link */}
            {!isCollapsed && (
                <div className="p-2 border-t border-zinc-800/60">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-300 text-[12px] h-8" asChild>
                        <Link href="/messages/forms">
                            <FileText className="h-3.5 w-3.5" />
                            Form Builder
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
