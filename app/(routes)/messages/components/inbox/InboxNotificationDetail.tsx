"use client";

import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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

interface InboxNotificationDetailProps {
    notification: SystemNotification;
    onClose: () => void;
    onClear: (id: string) => void;
}

export function InboxNotificationDetail({
    notification,
    onClose,
    onClear,
}: InboxNotificationDetailProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-zinc-100 truncate">
                        {notification.title}
                    </h3>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-7 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => onClear(notification.id)}
                >
                    <Check className="h-3 w-3" />
                    Clear
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-zinc-500 hover:text-zinc-300" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl scale-150 opacity-60" />
                    <div className="relative h-16 w-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shadow-xl">
                        <Bell className="h-8 w-8 text-indigo-400" strokeWidth={1.5} />
                    </div>
                </div>
                <div className="max-w-md">
                    <h2 className="text-lg font-bold text-zinc-100 mb-2 tracking-tight">{notification.title}</h2>
                    <p className="text-[13px] text-zinc-400 leading-relaxed">
                        {notification.message}
                    </p>
                    <div className="mt-6 text-[10.5px] text-zinc-600">
                        Received {format(new Date(notification.createdAt), "PPpp")}
                    </div>
                    {notification.link && (
                        <Button className="mt-6 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white" size="sm" asChild>
                            <Link href={notification.link}>View Details</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
