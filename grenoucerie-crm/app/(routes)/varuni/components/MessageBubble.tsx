"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, Edit2, ChevronLeft, ChevronRight, X, Send, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageBubbleProps {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: string;
    // Branching
    siblingCount?: number;
    currentSiblingIndex?: number;
    onNavigateSibling?: (id: string, direction: "prev" | "next") => void;
    onBranchSubmit?: (id: string, content: string) => void;
    attachments?: { url: string, contentType?: string, name?: string }[];
}

export function MessageBubble({
    id,
    role,
    content,
    createdAt,
    siblingCount = 0,
    currentSiblingIndex = 0,
    onNavigateSibling,
    onBranchSubmit,
    attachments
}: MessageBubbleProps) {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    const onCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEditSubmit = () => {
        if (editContent.trim() !== content && editContent.trim() !== "" && onBranchSubmit) {
            onBranchSubmit(id, editContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(content);
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col mb-4 gap-1 group">
            <div
                className={cn(
                    "flex w-full gap-4 px-4",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}
            >
            {/* Avatar */}
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0 border">
                {isUser ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                ) : (
                    <AvatarFallback className="bg-cyan-600 text-white">
                        <Bot className="h-4 w-4" />
                    </AvatarFallback>
                )}
            </Avatar>

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col max-w-[95%] md:max-w-[90%] rounded-2xl px-5 py-3 shadow-sm",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/50 rounded-tl-sm"
                )}
            >
                {/* Name, Time, Actions */}
                <div className={cn("flex items-center gap-2 mb-1 opacity-70 text-xs", isUser && "justify-end")}>
                    <span className="font-semibold">
                        {isUser ? "You" : "Varuni"}
                    </span>
                    {createdAt && (
                        <span>
                            {new Date(createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}

                </div>

                {/* Staged Visual Attachments */}
                {attachments && attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {attachments.map((att, i) => {
                            const publicUrl = att.url ? att.url.replace('https://basaltcrm.s3.us-west-or.io.cloud.ovh.us/', '/api/media/') : '';
                            return (
                            <div key={i} className="flex gap-2 items-center bg-black/10 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-lg pr-3 overflow-hidden text-sm shadow-sm transition-transform hover:scale-[1.02]">
                                {att.contentType?.startsWith('image/') ? (
                                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="h-14 w-14 shrink-0 bg-black/20 block">
                                        <img src={publicUrl} alt={att.name || "Image"} className="h-full w-full object-cover" />
                                    </a>
                                ) : (
                                    <div className="h-14 w-14 shrink-0 bg-black/10 dark:bg-white/10 flex items-center justify-center text-current border-r border-black/5 dark:border-white/5">
                                        <FileIcon className="h-5 w-5 opacity-80" />
                                    </div>
                                )}
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] font-medium hover:underline opacity-90">
                                    {att.name || "Document"}
                                </a>
                            </div>
                        )})}
                    </div>
                )}

                {/* Content */}
                {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[250px] w-full">
                        <Textarea 
                            value={editContent}
                            onChange={(e) => {
                                setEditContent(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`;
                            }}
                            className="bg-black/20 border-black/10 text-primary-foreground min-h-[80px] p-2 focus-visible:ring-1 focus-visible:ring-primary-foreground/50 transition-all custom-scrollbar"
                        />
                        <div className="flex justify-end gap-2 mt-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-primary-foreground/80 hover:bg-black/20 hover:text-white" onClick={handleCancelEdit}>
                                Cancel
                            </Button>
                            <Button size="sm" className="h-7 px-3 bg-primary-foreground text-primary hover:bg-white border hover:border-black/20" onClick={handleEditSubmit}>
                                Send
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={cn("prose dark:prose-invert max-w-none text-sm leading-relaxed break-words", isUser && "prose-p:text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground")}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeString = String(children).replace(/\n$/, "");

                                if (!inline && match) {
                                    return (
                                        <div className="relative mt-4 mb-2 rounded-md overflow-hidden border border-border/50 bg-zinc-950">
                                            <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
                                                <span className="text-xs text-zinc-400 font-mono">
                                                    {match[1]}
                                                </span>
                                                <button
                                                    onClick={() => onCopy(codeString)}
                                                    className="text-zinc-400 hover:text-white transition-colors"
                                                    title="Copy code"
                                                >
                                                    {copied ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                            <SyntaxHighlighter
                                                {...props}
                                                style={oneDark}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    padding: "1rem",
                                                    fontSize: "0.875rem",
                                                    backgroundColor: "transparent",
                                                }}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                }
                                return (
                                    <code
                                        className={cn(
                                            "bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 font-mono text-[0.9em]",
                                            className
                                        )}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                            // Custom styling for other elements if needed
                            a: ({ node, ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                                />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul {...props} className="list-disc pl-4 my-2 space-y-1" />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol {...props} className="list-decimal pl-4 my-2 space-y-1" />
                            ),
                            table: ({ node, ...props }) => (
                                <div className="w-full overflow-x-auto my-5 rounded-xl border border-border/50 bg-muted/10 backdrop-blur-sm shadow-sm not-prose custom-scrollbar">
                                    <table {...props} className="w-full text-left border-collapse text-sm" />
                                </div>
                            ),
                            thead: ({ node, ...props }) => (
                                <thead {...props} className="bg-muted/40 border-b border-border/50 uppercase tracking-wider text-[11px] text-muted-foreground" />
                            ),
                            th: ({ node, ...props }) => (
                                <th {...props} className="px-4 py-3 font-semibold whitespace-nowrap" />
                            ),
                            td: ({ node, ...props }) => (
                                <td {...props} className="px-4 py-3 border-b border-border/30 whitespace-nowrap" />
                            ),
                            tr: ({ node, ...props }) => (
                                <tr {...props} className="hover:bg-muted/30 transition-colors" />
                            ),
                            blockquote: ({ node, ...props }) => (
                                <blockquote {...props} className="border-l-4 border-primary/50 bg-primary/5 rounded-r-xl px-4 py-3 my-4 italic text-muted-foreground text-[13px] border-y border-r border-y-border/10 border-r-border/10" />
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
                )}
            </div>
            </div>

            {/* Bottom Command Bar (Navigator + Actions) */}
            <div className={cn("flex items-center mt-1 gap-2 opacity-0 group-hover:opacity-100 transition-opacity", isUser ? "justify-end pr-16" : "justify-start pl-16")}>
                
                {siblingCount > 1 && onNavigateSibling && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/80 transition-colors border border-border/50 rounded-full px-2 py-0.5">
                        <button 
                            className="p-1 hover:text-primary transition-colors disabled:opacity-30"
                            onClick={() => onNavigateSibling(id, 'prev')}
                            disabled={currentSiblingIndex === 0}
                        >
                            <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="font-medium whitespace-nowrap min-w-[30px] text-center">
                            {currentSiblingIndex + 1} / {siblingCount}
                        </span>
                        <button 
                            className="p-1 hover:text-primary transition-colors disabled:opacity-30" 
                            onClick={() => onNavigateSibling(id, 'next')}
                            disabled={currentSiblingIndex === siblingCount - 1}
                        >
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Actions */}
                {isUser && onBranchSubmit && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-black/10 rounded-md transition-colors text-muted-foreground hover:text-foreground" title="Edit message">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
                {!isUser && (
                    <button onClick={() => onCopy(content)} className="p-1 hover:bg-black/10 rounded-md transition-colors text-muted-foreground hover:text-foreground" title="Copy message">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}

            </div>
        </div>
    );
}
