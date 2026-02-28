"use client";

import React, { useState, useTransition } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { MessageSquare, CalendarIcon, ArrowRight, User, FileText, SendHorizontal, Check } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markNotificationRead } from "@/actions/dashboard/mark-notification-read";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { NewMessageModal } from "@/app/(routes)/messages/components/modals/NewMessageModal";

interface NotificationItem {
    id: string;
    type: 'message' | 'form';
    createdAt: Date;
    title: string;
    body: string;
    sender: {
        name: string;
        email?: string | null;
        avatar?: string | null;
    };
    url: string;
}

interface MessagesWidgetProps {
    messages: NotificationItem[];
}

const MessagePulseIndicator = ({ createdAt }: { createdAt: Date }) => {
    const isVeryRecent = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600) < 1; // within last hour

    return (
        <div className="relative h-2 w-2">
            {isVeryRecent && (
                <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
            )}
            <div className={`absolute inset-0 rounded-full bg-cyan-500/60 ${isVeryRecent ? 'shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'opacity-40'}`} />
        </div>
    );
};

export const MessagesWidget = ({ messages: initialMessages }: MessagesWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [messages, setMessages] = useState<NotificationItem[]>(initialMessages);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    React.useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const handleMarkRead = async (id: string, type: 'message' | 'form') => {
        const previousMessages = [...messages];
        setMessages(prev => prev.filter(m => m.id !== id));

        startTransition(async () => {
            try {
                const result = await markNotificationRead(id, type);
                if (result.success) {
                    toast.success("Intelligence cleared");
                    router.refresh();
                } else {
                    setMessages(previousMessages);
                    toast.error("Failed to update status");
                }
            } catch (error) {
                setMessages(previousMessages);
                toast.error("Network synchronization error");
            }
        });
    };

    const filteredMessages = messages.filter(m => {
        return (
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const rightAction = (
        <NewMessageModal
            customTrigger={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10 text-primary"
                >
                    <SendHorizontal size={12} className="mr-1" />
                    INTEL
                </Button>
            }
        />
    );

    return (
        <WidgetWrapper
            title="Inbox Stream"
            icon={MessageSquare}
            iconColor="text-cyan-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/messages"
            footerLabel="Review Full Intelligence Stream"
            count={messages.length}
            rightAction={rightAction}
        >
            <div className="space-y-1.5 pb-4 mt-3">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No unread intelligence</p>
                    </div>
                ) : (
                    filteredMessages.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.04] transition-colors duration-300 relative overflow-hidden"
                        >
                            <div className="space-y-1.5 overflow-hidden flex-1 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Avatar className="h-7 w-7 border border-white/10 group-hover:border-primary/50 transition-colors duration-300">
                                            <AvatarImage src={item.sender.avatar || undefined} className="object-cover" />
                                            <AvatarFallback className="text-[9px] bg-white/5 text-muted-foreground uppercase font-bold">
                                                {item.sender.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 z-20">
                                            <MessagePulseIndicator createdAt={item.createdAt} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold text-white/90 truncate group-hover:text-primary transition-colors">
                                            {item.sender.name}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-medium opacity-50">
                                            {format(new Date(item.createdAt), "h:mm a")}
                                        </span>
                                    </div>

                                    <div className="ml-auto">
                                        {item.type === 'form' && (
                                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-white/10 bg-white/5 text-muted-foreground font-black uppercase tracking-tighter">Form Entry</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-0.5 px-0.5" onClick={() => handleMarkRead(item.id, item.type)}>
                                    <div className="font-bold text-[11px] truncate flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors cursor-pointer">
                                        {item.title}
                                    </div>
                                    {item.body && (
                                        <p className="text-[10px] text-muted-foreground/60 line-clamp-1 font-medium italic cursor-pointer group-hover:text-muted-foreground/80 transition-colors">
                                            {item.body}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5 pt-0.5 self-center relative z-10">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkRead(item.id, item.type);
                                    }}
                                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 transition-[color,background-color,border-color,opacity] duration-300"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Link href={item.url} onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 transition-[color,background-color,border-color,opacity] duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
