"use client";

import { useState } from "react";
import {
    Bell,
    Check,
    Info,
    AlertTriangle,
    CheckCircle2,
    User,
    Clock,
    Search,
    ChevronRight,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { clearNotification, markAsRead, markAllAsRead } from "@/actions/crm/notifications";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { subDays, isAfter, startOfDay } from "date-fns";
import { toast } from "sonner";

interface NotificationsClientProps {
    initialNotifications: any[];
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [searchQuery, setSearchQuery] = useState("");
    const [timeRange, setTimeRange] = useState("all");
    const router = useRouter();

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (timeRange === "all") return true;

        const date = new Date(n.createdAt);
        const now = new Date();

        if (timeRange === "today") return isAfter(date, startOfDay(now));
        if (timeRange === "week") return isAfter(date, subDays(now, 7));
        if (timeRange === "month") return isAfter(date, subDays(now, 30));

        return true;
    });

    const handleMarkAsRead = async (id: string, link?: string) => {
        const n = notifications.find(notif => notif.id === id);
        if (n?.isRead) {
            if (link) router.push(link);
            return;
        }

        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        if (link) {
            router.push(link);
        }
    };

    const handleClearNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const notification = notifications.find(n => n.id === id);
        const newClearedStatus = !notification?.isCleared;

        // Optimistic UI
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isCleared: newClearedStatus, isRead: true } : n));

        try {
            await clearNotification(id);
            toast.success(newClearedStatus ? "Marked as done" : "Marked as pending");
        } catch (error) {
            setNotifications(notifications); // Rollback
            toast.error("Failed to update status");
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case "WARNING": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case "ERROR": return <AlertTriangle className="h-5 w-5 text-rose-500" />;
            case "APPROVAL": return <Check className="h-5 w-5 text-blue-500" />;
            case "MENTION": return <User className="h-5 w-5 text-violet-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notifications..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[150px] border-border/50">
                            <Filter className="h-4 w-4 mr-2 opacity-50" />
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All (30 Days)</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2 border-border/50">
                        Mark All as Read
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                        <div className="p-4 bg-muted rounded-full">
                            <Bell className="h-8 w-8 opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-lg text-foreground">All caught up!</p>
                            <p className="text-sm">No notifications matching your search.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-6 flex gap-6 hover:bg-muted/30 transition-colors cursor-pointer group relative items-center",
                                    !n.isRead && "bg-primary/5",
                                    n.isCleared && "opacity-60"
                                )}
                                onClick={() => handleMarkAsRead(n.id, n.link)}
                            >
                                {/* Task-like Done UI on the left */}
                                <div
                                    className={cn(
                                        "h-12 w-6 rounded-full border border-border/50 flex items-center justify-center transition-colors bg-background shrink-0",
                                        n.isCleared ? "bg-emerald-500/10 border-emerald-500/50" : "group-hover:border-primary/50"
                                    )}
                                    onClick={(e) => handleClearNotification(e, n.id)}
                                >
                                    <Check className={cn(
                                        "h-4 w-4 transition-colors",
                                        n.isCleared ? "text-emerald-500 opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-40"
                                    )} />
                                </div>

                                <div className="mt-0.5 shrink-0 bg-background rounded-xl p-2.5 shadow-sm border border-border/50 h-10 w-10 flex items-center justify-center">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className={cn("text-sm font-bold truncate", n.isCleared ? "text-muted-foreground line-through" : !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                            {n.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground whitespace-nowrap opacity-60">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className={cn("text-sm leading-relaxed", n.isCleared ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                        {n.message}
                                    </p>
                                    <div className="pt-2 flex items-center gap-3">
                                        {n.link && (
                                            <Button variant="link" className="p-0 h-auto text-xs text-primary font-bold gap-1 group">
                                                View Details
                                                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        )}
                                        {n.isCleared ? (
                                            <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-emerald-500/10 text-emerald-500 border-none">DONE</Badge>
                                        ) : !n.isRead && (
                                            <Badge variant="default" className="text-[9px] px-1.5 h-4 bg-primary text-primary-foreground">NEW</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
