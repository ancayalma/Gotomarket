"use client";

import { useState, useEffect } from "react";
import {
    Bell,
    Check,
    Info,
    AlertTriangle,
    CheckCircle2,
    User,
    Clock,
    MoreVertical,
    Trash
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getNotifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } from "@/actions/crm/notifications";
import { useRouter } from "next/navigation";

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const fetchNotifications = async () => {
        const data = await getNotifications(false); // Only fetch uncleared
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
    };

    useEffect(() => {
        fetchNotifications();
        // Polling for demo purposes, in production use WebSockets
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string, link?: string) => {
        await markAsRead(id);
        setOpen(false);
        fetchNotifications();
        if (link) {
            router.push(link);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        fetchNotifications();
    };

    const handleClear = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await clearNotification(id);
        fetchNotifications();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "WARNING": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case "ERROR": return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            case "APPROVAL": return <Check className="h-4 w-4 text-blue-500" />;
            case "MENTION": return <User className="h-4 w-4 text-violet-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) fetchNotifications();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-background/50 border hover:bg-background transition-colors">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-in zoom-in">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-2xl border-border/50 glass">
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{unreadCount} New</Badge>}
                    </h4>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-1">
                            {notifications.some(n => !n.isRead) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold hover:bg-muted"
                                    onClick={handleMarkAllRead}
                                >
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-bold text-red-400 hover:text-red-400/80 hover:bg-muted"
                                onClick={async () => {
                                    if (confirm("Clear all notifications?")) {
                                        await clearAllNotifications();
                                        fetchNotifications();
                                    }
                                }}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                                        !n.isRead && "bg-primary/5 border-l-2 border-l-primary"
                                    )}
                                    onClick={() => handleMarkAsRead(n.id, n.link)}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <p className={cn("text-xs font-semibold leading-none", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                    {n.title}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 hover:text-emerald-500 transition-[color,background-color,border-color,opacity] ml-2 shrink-0"
                                                    onClick={(e) => handleClear(e, n.id)}
                                                    title="Mark as done & clear"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 pt-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t bg-muted/10 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] h-8 text-muted-foreground"
                        onClick={() => {
                            setOpen(false);
                            router.push('/crm/notifications');
                        }}
                    >
                        View All Activity
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
