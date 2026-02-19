"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    Megaphone,
    Wand2,
    List,
    Users,
    Rocket,
    ClipboardList,
    Inbox,
    PhoneCall,
    GraduationCap,
    ArrowRight,
    Sparkles,
    RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Constants ─────────────────────────────────────────────────────────────

const ADMIN_DISMISS_KEY = "crm_gs_admin_v1";
const MEMBER_DISMISS_KEY = "crm_gs_member_v1";

// ─── Types ─────────────────────────────────────────────────────────────────

interface GuideStep {
    id: string;
    stepNumber: number;
    label: string;
    description: string;
    detail: string;
    href: string;
    icon: React.ElementType;
    iconColor: string;
    badgeText?: string;
    badgeColor?: string;
}

// ─── Admin Steps ────────────────────────────────────────────────────────────

const ADMIN_STEPS: GuideStep[] = [
    {
        id: "campaign",
        stepNumber: 1,
        label: "Create a Campaign",
        description: "Start by creating a Campaign — the strategic container for all your outreach work.",
        detail: "A Campaign groups your Lists, outreach sequences, and team assignments under one goal. Name it after a market segment or initiative (e.g. \"Q1 DACH Expansion\").",
        href: "/campaigns",
        icon: Megaphone,
        iconColor: "text-orange-400",
        badgeText: "Start here",
        badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    },
    {
        id: "wizard",
        stepNumber: 2,
        label: "Run the LeadGen Wizard",
        description: "Use the AI-powered wizard on the Accounts page to discover target companies matching your ICP.",
        detail: "Describe your Ideal Customer Profile (ICP) once in plain English — industries, company size, geography, tech stack, target roles. The wizard finds matching companies and contacts automatically.",
        href: "/crm/accounts",
        icon: Wand2,
        iconColor: "text-cyan-400",
    },
    {
        id: "list",
        stepNumber: 3,
        label: "Build your first List",
        description: "A List is a curated segment of discovered accounts, ready to be worked by your team.",
        detail: "After the wizard runs, you'll have a List populated with companies and contacts. Think of each List as a targeted outreach batch — one per segment, region, or campaign.",
        href: "/lists",
        icon: List,
        iconColor: "text-violet-400",
    },
    {
        id: "assign",
        stepNumber: 4,
        label: "Assign the List to a Team Member",
        description: "Hand off the List to the team member who will execute outreach on those accounts.",
        detail: "Members only see and work the Lists assigned to them, keeping their focus sharp. You can assign one List to multiple members or keep them separate by territory.",
        href: "/lists",
        icon: Users,
        iconColor: "text-emerald-400",
    },
    {
        id: "outreach",
        stepNumber: 5,
        label: "Launch Outreach",
        description: "Once assigned, the member launches an email or call sequence from their Campaign dashboard.",
        detail: "The member selects their List, picks a sequence template, and fires. Replies and outcomes are tracked automatically in the CRM — leads that engage convert to Opportunities.",
        href: "/campaigns",
        icon: Rocket,
        iconColor: "text-pink-400",
    },
];

// ─── Member Steps ────────────────────────────────────────────────────────────

const MEMBER_STEPS: GuideStep[] = [
    {
        id: "find-campaign",
        stepNumber: 1,
        label: "Find your assigned Campaign",
        description: "Your admin assigns you to Campaigns. Check your dashboard to see which ones are active.",
        detail: "Head to your Dashboard or the Campaigns page. You'll see the Campaign you've been added to — this is your operational container. Everything you do is scoped to your assigned campaigns.",
        href: "/campaigns",
        icon: ClipboardList,
        iconColor: "text-blue-400",
        badgeText: "Start here",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    },
    {
        id: "open-list",
        stepNumber: 2,
        label: "Open your assigned List",
        description: "Inside your Campaign, open the List assigned to you — itcontains your target accounts and contacts.",
        detail: "Each List is a set of companies and contacts discovered by the LeadGen Wizard. You can filter by pipeline stage, view contact details, and see prior engagement history.",
        href: "/lists",
        icon: Inbox,
        iconColor: "text-violet-400",
    },
    {
        id: "start-outreach",
        stepNumber: 3,
        label: "Start Outreach",
        description: "Work through your List — send emails, log calls, and move contacts through the pipeline.",
        detail: "For each contact: send intro emails from the sequence template, log calls in the dialer, and update the pipeline stage as they respond. When a contact is ready, convert them to an Opportunity.",
        href: "/campaigns",
        icon: PhoneCall,
        iconColor: "text-emerald-400",
    },
];

// ─── Shared: Step Card ───────────────────────────────────────────────────────

function StepCard({
    step,
    isCompleted,
    isNext,
    isLast,
    onToggle,
    onNavigate,
    compact = false,
}: {
    step: GuideStep;
    isCompleted: boolean;
    isNext: boolean;
    isLast: boolean;
    onToggle: () => void;
    onNavigate: () => void;
    compact?: boolean;
}) {
    const Icon = step.icon;
    const [expanded, setExpanded] = useState(isNext && !compact);

    return (
        <div className="relative flex gap-4">
            {/* Vertical connector line */}
            {!isLast && (
                <div className={["absolute left-[1.1rem] top-10 w-[2px] h-[calc(100%+0.5rem)] bg-gradient-to-b from-white/10 to-transparent", compact ? "left-[0.85rem]" : ""].join(" ")} />
            )}

            {/* Step circle */}
            <button
                onClick={onToggle}
                className={[
                    "relative z-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300",
                    compact ? "w-7 h-7 text-[10px]" : "w-11 h-11 text-sm",
                    isCompleted
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : isNext
                            ? "bg-violet-500/20 border-violet-500/60 text-violet-300 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-black"
                            : "bg-white/5 border-white/15 text-white/30",
                ].join(" ")}
                title={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
                {isCompleted
                    ? <CheckCircle2 className={compact ? "w-3 h-3" : "w-5 h-5"} />
                    : <span>{step.stepNumber}</span>
                }
            </button>

            {/* Card content */}
            <div className={compact ? "flex-1 pb-4" : "flex-1 pb-8"}>
                <button
                    onClick={() => setExpanded((e) => !e)}
                    className="w-full text-left"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Icon className={["w-3.5 h-3.5", isCompleted ? "text-emerald-400/60" : step.iconColor].join(" ")} />
                            <h3 className={[
                                compact ? "text-[13px]" : "text-sm",
                                "font-semibold leading-tight",
                                isCompleted ? "text-white/40 line-through" : isNext ? "text-white/90" : "text-white/60",
                            ].join(" ")}>
                                {step.label}
                            </h3>
                            {step.badgeText && !isCompleted && (
                                <span className={["px-2 py-0.5 rounded-full border", compact ? "text-[8px]" : "text-[10px]", step.badgeColor].join(" ")}>
                                    {step.badgeText}
                                </span>
                            )}
                        </div>
                        <ChevronRight className={[
                            "w-3 h-3 flex-shrink-0 text-white/25 transition-transform duration-200",
                            expanded ? "rotate-90" : "",
                        ].join(" ")} />
                    </div>

                    {!expanded && (
                        <p className={["text-white/40 mt-1 leading-relaxed", compact ? "text-[11px] ml-5" : "text-xs ml-6"].join(" ")}>
                            {step.description}
                        </p>
                    )}
                </button>

                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className={["mt-3 p-4 rounded-xl border border-white/8 bg-white/[0.03] space-y-3", compact ? "ml-5 p-3" : "ml-6"].join(" ")}>
                                <p className={["text-white/55 leading-relaxed", compact ? "text-[11px]" : "text-xs"].join(" ")}>{step.detail}</p>
                                {!isCompleted && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={onNavigate}
                                            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white transition-all"
                                        >
                                            <ArrowRight className="w-3 h-3" />
                                            Take me there
                                        </button>
                                        <button
                                            onClick={onToggle}
                                            className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 transition-all"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Mark as done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Admin Guide ─────────────────────────────────────────────────────────────

function AdminGuide({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const [completed, setCompleted] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(ADMIN_DISMISS_KEY);
            if (saved) setCompleted(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const toggle = (id: string) => {
        setCompleted((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            try { localStorage.setItem(ADMIN_DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const reset = () => {
        setCompleted({});
        try { localStorage.removeItem(ADMIN_DISMISS_KEY); } catch { /* ignore */ }
    };

    const completedCount = ADMIN_STEPS.filter((s) => completed[s.id]).length;
    const progressPct = Math.round((completedCount / ADMIN_STEPS.length) * 100);
    const allDone = completedCount === ADMIN_STEPS.length;

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <Card className={["border-white/10 bg-gradient-to-br from-orange-500/8 via-transparent to-violet-500/8 overflow-hidden", compact ? "rounded-xl" : ""].join(" ")}>
                {!compact && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 via-violet-500 to-pink-500" />}
                <CardHeader className={compact ? "p-4" : "pb-3"}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className={["font-bold flex items-center gap-2", compact ? "text-sm" : "text-lg"].join(" ")}>
                                <Sparkles className={compact ? "w-4 h-4 text-violet-400" : "w-5 h-5 text-violet-400"} />
                                Admin Launch Guide
                            </CardTitle>
                            {!compact && (
                                <CardDescription className="mt-1">
                                    From zero to your first active outreach campaign — follow these steps in order.
                                </CardDescription>
                            )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <div className={compact ? "text-lg font-black text-white/90" : "text-2xl font-black text-white/90"}>{progressPct}%</div>
                            <div className="text-[10px] text-white/35">complete</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className={["w-full rounded-full bg-white/8 overflow-hidden", compact ? "mt-2 h-1" : "mt-4 h-1.5"].join(" ")}>
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-violet-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                </CardHeader>
            </Card>

            {/* Completion state */}
            {allDone && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-400">You're all set! 🎉</p>
                        <p className="text-xs text-white/40 mt-0.5">Your first outreach campaign is live. Now level up with Mastery Paths.</p>
                    </div>
                    {!compact && (
                        <button
                            onClick={() => router.push("/crm/university")}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-all flex-shrink-0"
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Mastery Paths
                        </button>
                    )}
                </motion.div>
            )}

            {/* Steps */}
            <div className={compact ? "pl-1" : "pl-2"}>
                {ADMIN_STEPS.map((step, index) => {
                    const prevDone = index === 0 || ADMIN_STEPS.slice(0, index).every((s) => completed[s.id]);
                    const isNext = !completed[step.id] && prevDone;
                    return (
                        <StepCard
                            key={step.id}
                            step={step}
                            isCompleted={!!completed[step.id]}
                            isNext={isNext}
                            isLast={index === ADMIN_STEPS.length - 1}
                            onToggle={() => toggle(step.id)}
                            onNavigate={() => router.push(step.href)}
                            compact={compact}
                        />
                    );
                })}
            </div>

            {/* Context cards - only in full view */}
            {!compact && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/8">
                    {[
                        {
                            title: "Campaign",
                            color: "text-orange-400",
                            bg: "bg-orange-500/8 border-orange-500/20",
                            body: "The strategic container. Groups your Lists, outreach, and team assignments under a single goal.",
                        },
                        {
                            title: "List",
                            color: "text-violet-400",
                            bg: "bg-violet-500/8 border-violet-500/20",
                            body: "A batch of AI-discovered accounts and contacts matched to your ICP, ready to be worked.",
                        },
                        {
                            title: "Outreach",
                            color: "text-pink-400",
                            bg: "bg-pink-500/8 border-pink-500/20",
                            body: "Email or call sequences executed by your team against the List. Replies auto-move contacts through the pipeline.",
                        },
                    ].map((card) => (
                        <div key={card.title} className={`p-4 rounded-xl border ${card.bg} space-y-1.5`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${card.color}`}>{card.title}</p>
                            <p className="text-xs text-white/45 leading-relaxed">{card.body}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Reset */}
            {completedCount > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/40 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset progress
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Member Guide ─────────────────────────────────────────────────────────────

function MemberGuide({ isPreview = false }: { isPreview?: boolean }) {
    const router = useRouter();
    const [completed, setCompleted] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(MEMBER_DISMISS_KEY);
            if (saved) setCompleted(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const toggle = (id: string) => {
        if (isPreview) return; // Don't allow marking done in preview
        setCompleted((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            try { localStorage.setItem(MEMBER_DISMISS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    const reset = () => {
        setCompleted({});
        try { localStorage.removeItem(MEMBER_DISMISS_KEY); } catch { /* ignore */ }
    };

    const completedCount = MEMBER_STEPS.filter((s) => completed[s.id]).length;
    const progressPct = Math.round((completedCount / MEMBER_STEPS.length) * 100);
    const allDone = completedCount === MEMBER_STEPS.length;

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <Card className={["border-white/10 bg-gradient-to-br from-blue-500/8 via-transparent to-violet-500/8 overflow-hidden", isPreview ? "rounded-xl border-dashed" : ""].join(" ")}>
                {!isPreview && <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />}
                <CardHeader className={isPreview ? "p-5" : "pb-3"}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className={["font-bold flex items-center gap-2", isPreview ? "text-base" : "text-lg"].join(" ")}>
                                <Sparkles className={isPreview ? "w-4 h-4 text-blue-400" : "w-5 h-5 text-blue-400"} />
                                Member Playbook
                                {isPreview && (
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-blue-500/10 border-blue-500/20 text-blue-400">Team Preview</Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Once your admin assigns you to a Campaign, follow these 3 steps to start producing.
                            </CardDescription>
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <div className={isPreview ? "text-xl font-black text-white/90" : "text-2xl font-black text-white/90"}>{progressPct}%</div>
                            <div className="text-[10px] text-white/35">complete</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className={["w-full rounded-full bg-white/8 overflow-hidden", isPreview ? "mt-3 h-1" : "mt-4 h-1.5"].join(" ")}>
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                </CardHeader>
            </Card>

            {/* Waiting banner (shown if no campaigns yet) - only for actual members */}
            {!isPreview && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                    <Inbox className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50 leading-relaxed">
                        <span className="font-semibold text-white/70">Waiting for assignment?</span>{" "}
                        Your admin needs to assign you to a Campaign and a List first. Once they do, it'll appear on your dashboard and here.
                    </p>
                </div>
            )}

            {/* Completion */}
            {allDone && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-400">You're on your way! 🎉</p>
                        <p className="text-xs text-white/40 mt-0.5">Keep working your List and converting contacts. Check Mastery Paths to level up your skills.</p>
                    </div>
                </motion.div>
            )}

            {/* Steps */}
            <div className="pl-2">
                {MEMBER_STEPS.map((step, index) => {
                    const prevDone = index === 0 || MEMBER_STEPS.slice(0, index).every((s) => completed[s.id]);
                    const isNext = !completed[step.id] && prevDone;
                    return (
                        <StepCard
                            key={step.id}
                            step={step}
                            isCompleted={!!completed[step.id]}
                            isNext={isNext}
                            isLast={index === MEMBER_STEPS.length - 1}
                            onToggle={() => toggle(step.id)}
                            onNavigate={() => router.push(step.href)}
                            compact={isPreview}
                        />
                    );
                })}
            </div>

            {/* Reset */}
            {completedCount > 0 && !isPreview && (
                <div className="flex justify-end">
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/40 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset progress
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function GettingStarted() {
    const { data: session } = useSession();
    const [viewMode, setViewMode] = useState<"admin" | "member">("admin");

    // Robust role detection for Client Component
    const user = session?.user as any;
    const teamRole = (user?.team_role || user?.role || "").trim().toUpperCase();
    const isAdmin =
        user?.isAdmin === true ||
        user?.is_admin === true ||
        user?.role === "Platform Admin" ||
        ["PLATFORM_ADMIN", "ADMIN", "SUPER_ADMIN", "PLATFORM ADMIN", "SYSADM", "OWNER"].includes(teamRole);

    // If they aren't admin, force member view
    useEffect(() => {
        if (!isAdmin) {
            setViewMode("member");
        }
    }, [isAdmin]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
        >
            {/* Admin View Toggle */}
            {isAdmin && (
                <div className="flex justify-center mb-4">
                    <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => setViewMode("admin")}
                            className={[
                                "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                viewMode === "admin"
                                    ? "bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/10 border border-orange-500/20"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            ].join(" ")}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Admin Course
                        </button>
                        <button
                            onClick={() => setViewMode("member")}
                            className={[
                                "px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                viewMode === "member"
                                    ? "bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-500/20"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            ].join(" ")}
                        >
                            <Users className="w-3.5 h-3.5" />
                            Member Playbook
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                {viewMode === "admin" ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-1">
                            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 uppercase tracking-widest text-[9px] px-2 py-0.5">
                                Admin Launch Guide
                            </Badge>
                        </div>
                        <AdminGuide />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-1">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest text-[9px] px-2 py-0.5">
                                {isAdmin ? "Member Playbook (Preview)" : "Team Member Experience"}
                            </Badge>
                        </div>
                        <MemberGuide isPreview={isAdmin} />
                        {isAdmin && (
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] mt-4">
                                <p className="text-[11px] text-white/30 leading-relaxed italic">
                                    💡 <span className="font-semibold text-white/50 underline decoration-white/20 underline-offset-2">Admin Note:</span> This is exactly what your team members see. Use this to understand their workflow so you can guide them.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
