"use client";

import {
    Inbox,
    Send,
    File,
    Archive,
    Trash2,
    FormInput,
    Bell,
    MailPlus,
} from "lucide-react";

const EMPTY_STATES: Record<string, { icon: React.ElementType; title: string; subtitle: string; gradient: string }> = {
    inbox: {
        icon: Inbox,
        title: "Inbox Zero",
        subtitle: "All caught up — no messages waiting for you.",
        gradient: "from-indigo-500/20 to-violet-500/20",
    },
    sent: {
        icon: Send,
        title: "No sent messages",
        subtitle: "Messages you send will appear here.",
        gradient: "from-cyan-500/20 to-blue-500/20",
    },
    drafts: {
        icon: File,
        title: "No drafts",
        subtitle: "Saved drafts will appear here.",
        gradient: "from-amber-500/20 to-orange-500/20",
    },
    archive: {
        icon: Archive,
        title: "Archive is empty",
        subtitle: "Archived messages and submissions will appear here.",
        gradient: "from-emerald-500/20 to-teal-500/20",
    },
    trash: {
        icon: Trash2,
        title: "Trash is empty",
        subtitle: "Deleted items will appear here for 30 days.",
        gradient: "from-red-500/20 to-rose-500/20",
    },
    submissions: {
        icon: FormInput,
        title: "No form submissions",
        subtitle: "Inbound form submissions will appear here.",
        gradient: "from-violet-500/20 to-pink-500/20",
    },
    notifications: {
        icon: Bell,
        title: "No notifications",
        subtitle: "System alerts and updates will appear here.",
        gradient: "from-blue-500/20 to-indigo-500/20",
    },
    detail: {
        icon: MailPlus,
        title: "Select a message",
        subtitle: "Or compose a new one to your team.",
        gradient: "from-zinc-500/10 to-zinc-500/5",
    },
};

interface InboxEmptyStateProps {
    type: keyof typeof EMPTY_STATES;
}

export function InboxEmptyState({ type }: InboxEmptyStateProps) {
    const state = EMPTY_STATES[type] || EMPTY_STATES.detail;
    const Icon = state.icon;

    return (
        <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center select-none">
            <div className={`relative mb-6`}>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${state.gradient} blur-2xl scale-150 opacity-60`} />
                <div className="relative h-20 w-20 rounded-2xl bg-muted/80 border border-border/50 flex items-center justify-center shadow-xl">
                    <Icon className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
                </div>
            </div>
            <p className="text-[15px] font-semibold text-foreground tracking-tight">
                {state.title}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1.5 max-w-[240px] leading-relaxed">
                {state.subtitle}
            </p>
        </div>
    );
}
