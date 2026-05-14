"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
    MessageSquare, Users, Headphones, Send, CheckCircle2,
    Clock, Loader2, Star, FileText, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
    sender: string;
    text: string;
    timestamp: string;
    type: string;
}

interface ChatSession {
    id: string;
    visitor_name: string | null;
    visitor_email: string | null;
    visitor_page: string | null;
    status: string;
    messages: ChatMessage[] | null;
    agent: { name: string; avatar: string | null } | null;
    satisfaction_rating: number | null;
    startedAt: string;
    endedAt: string | null;
}

export default function LiveChatConsole() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [queueStats, setQueueStats] = useState<Record<string, number>>({});
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/crm/chat/sessions");
            setSessions(data.sessions);
            setQueueStats(data.queueStats);
        } catch { /* skip */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [fetchSessions]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const handleAssign = async (sessionId: string) => {
        await axios.put(`/api/crm/chat/sessions/${sessionId}`, { action: "assign" });
        setActiveSessionId(sessionId);
        fetchSessions();
    };

    const handleEnd = async (sessionId: string) => {
        await axios.put(`/api/crm/chat/sessions/${sessionId}`, { action: "end" });
        setActiveSessionId(null);
        fetchSessions();
    };

    const handleCreateCase = async (sessionId: string) => {
        await axios.put(`/api/crm/chat/sessions/${sessionId}`, { action: "create_case" });
        fetchSessions();
    };

    const handleSendMessage = async (sessionId: string, text: string) => {
        await axios.patch(`/api/crm/chat/sessions/${sessionId}`, { sender: "agent", text });
        fetchSessions();
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="flex h-[600px] rounded-lg border border-white/10 overflow-hidden">
            {/* Sidebar — Session List */}
            <div className="w-72 border-r border-white/10 flex flex-col">
                {/* Queue Stats */}
                <div className="p-3 border-b border-white/10 flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Live Chat</span>
                    <div className="flex-1" />
                    {(queueStats.waiting || 0) > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px] animate-pulse">
                            {queueStats.waiting} waiting
                        </Badge>
                    )}
                </div>

                <ScrollArea className="flex-1">
                    {sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">No active chats</div>
                    ) : (
                        <div className="space-y-0.5 p-1">
                            {sessions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => s.status === "waiting" ? handleAssign(s.id) : setActiveSessionId(s.id)}
                                    className={`w-full text-left p-2.5 rounded-lg transition text-xs ${activeSessionId === s.id ? "bg-white/10" : "hover:bg-white/5"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-white">{s.visitor_name || "Visitor"}</span>
                                        <Badge className={`text-[8px] border-0 ${s.status === "waiting" ? "bg-amber-500/10 text-amber-400" : s.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                                            {s.status}
                                        </Badge>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                        {s.visitor_email || s.visitor_page || "No info"}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Main — Chat Area */}
            <div className="flex-1 flex flex-col">
                {!activeSession ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">Select a chat to start responding</p>
                        <p className="text-xs mt-1">Waiting chats will be assigned to you on click</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-sm text-white">{activeSession.visitor_name || "Visitor"}</div>
                                <div className="text-[10px] text-muted-foreground">{activeSession.visitor_email} · {activeSession.visitor_page}</div>
                            </div>
                            <div className="flex gap-1.5">
                                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleCreateCase(activeSession.id)}>
                                    <FileText className="w-2.5 h-2.5" /> Create Case
                                </Button>
                                <Button size="sm" variant="destructive" className="h-6 text-[10px] gap-1" onClick={() => handleEnd(activeSession.id)}>
                                    <X className="w-2.5 h-2.5" /> End Chat
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-2">
                                {((activeSession.messages as ChatMessage[]) || []).map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-xs ${msg.sender === "agent" ? "bg-blue-600 text-white" : "bg-white/10 text-white"}`}>
                                            {msg.text}
                                            <div className="text-[9px] opacity-60 mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Message Input */}
                        {activeSession.status === "active" && (
                            <ChatInput onSend={(text) => handleSendMessage(activeSession.id, text)} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
        inputRef.current?.focus();
    };

    return (
        <div className="p-3 border-t border-white/10 flex gap-2">
            <Input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Type a message..."
                className="flex-1 text-xs"
            />
            <Button size="sm" onClick={handleSubmit} className="gap-1">
                <Send className="w-3 h-3" /> Send
            </Button>
        </div>
    );
}
