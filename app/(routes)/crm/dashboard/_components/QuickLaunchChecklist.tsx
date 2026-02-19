"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    X,
    Megaphone,
    Wand2,
    List,
    Users,
    Rocket,
    Sparkles,
    ChevronDown,
    ChevronUp,
    GraduationCap,
    Medal,
    ArrowRight,
    Loader2
} from "lucide-react";
import { dismissQuickLaunch } from "../_actions/dismiss-quick-launch";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ChecklistCounts {
    /** Number of campaigns created */
    campaigns: number;
    /** Number of lists (lead pools) created */
    lists: number;
    /** Number of active users/members on the team */
    teamMembers: number;
    /** Whether any outreach has been launched */
    outreachStarted: boolean;
}

interface Step {
    id: string;
    label: string;
    description: string;
    tip: string;
    href: string;
    icon: React.ElementType;
    iconColor: string;
    done: boolean;
}

interface QuickLaunchChecklistProps {
    counts: ChecklistCounts;
    initiallyDismissed?: boolean;
}

const DISMISS_KEY = "crm_quick_launch_dismissed_v1";

// ─── Component ─────────────────────────────────────────────────────────────

export function QuickLaunchChecklist({ counts, initiallyDismissed = false }: QuickLaunchChecklistProps) {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(initiallyDismissed);
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const steps: Step[] = [
        {
            id: "campaign",
            label: "Create your first Campaign",
            description: "A Campaign is the top-level container for your outreach strategy.",
            tip: "Think of a Campaign as a mission: name it after the market segment or goal you're targeting.",
            href: "/campaigns",
            icon: Megaphone,
            iconColor: "text-orange-400",
            done: counts.campaigns > 0,
        },
        {
            id: "wizard",
            label: "Run the LeadGen Wizard",
            description: "Use the AI-powered wizard on the Accounts page to discover target companies.",
            tip: "Describe your Ideal Customer Profile (ICP) once — the wizard does the rest.",
            href: "/crm/accounts",
            icon: Wand2,
            iconColor: "text-cyan-400",
            done: counts.lists > 0, // Wizard completion results in a list
        },
        {
            id: "list",
            label: "Build your first List",
            description: "A List is a curated segment of accounts ready for outreach.",
            tip: "Group accounts by campaign, region, or ICP. Each List can be assigned to a different team member.",
            href: "/lists",
            icon: List,
            iconColor: "text-violet-400",
            done: counts.lists > 0,
        },
        {
            id: "assign",
            label: "Assign the List to a Team Member",
            description: "Assign your List so a member can begin outreach on those accounts.",
            tip: "Members only see and work on the Lists assigned to them — this keeps work focused.",
            href: "/lists",
            icon: Users,
            iconColor: "text-emerald-400",
            done: counts.teamMembers > 1 && counts.lists > 0,
        },
        {
            id: "outreach",
            label: "Launch your first Outreach",
            description: "Kick off an email or call sequence from your Lists.",
            tip: "Your member launches outreach directly from their assigned List.",
            href: "/lists",
            icon: Rocket,
            iconColor: "text-pink-400",
            done: counts.outreachStarted,
        },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const allDone = completedCount === steps.length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    // Tier 5: When all done, show Mastery Paths promotion for 5s then dismiss
    const [showMasteryPromo, setShowMasteryPromo] = useState(false);

    const handleDismiss = useCallback(async () => {
        if (isDismissing) return;
        setIsDismissing(true);

        try {
            const res = await dismissQuickLaunch();
            if (res.success) {
                setDismissed(true);
                // Also update localStorage for immediate fallback on other pages if needed
                localStorage.setItem(DISMISS_KEY, "true");
            } else {
                toast.error("Failed to save dismissal preference");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDismissing(false);
        }
    }, [isDismissing]);

    useEffect(() => {
        if (allDone && mounted) {
            // Phase 1: switch to promo view after 1s
            const t1 = setTimeout(() => setShowMasteryPromo(true), 1000);
            // Phase 2: auto-dismiss after 7s total
            const t2 = setTimeout(() => handleDismiss(), 7000);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [allDone, mounted, handleDismiss]);

    // Don't render until hydrated (avoids SSR mismatch with localStorage)
    if (!mounted || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="quick-launch-checklist"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
            >
                {/* Decorative top gradient line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />

                {/* Ambient glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Progress ring */}
                        <div className="relative flex-shrink-0 w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                <circle
                                    cx="24" cy="24" r="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="24" cy="24" r="20"
                                    fill="none"
                                    stroke="url(#checklist-grad)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPct / 100)}`}
                                    className="transition-all duration-700"
                                />
                                <defs>
                                    <linearGradient id="checklist-grad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {completedCount}/{steps.length}
                            </span>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                <h2 className="text-sm font-bold text-white/90 tracking-tight">
                                    {allDone ? "You're all set! 🎉" : "Quick Launch — Get Started"}
                                </h2>
                            </div>
                            <p className="text-xs text-white/40 mt-0.5 truncate">
                                {allDone
                                    ? "Your CRM is ready. This checklist will close shortly."
                                    : `${steps.length - completedCount} step${steps.length - completedCount !== 1 ? "s" : ""} remaining to activate your first outreach campaign.`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setCollapsed((c) => !c)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleDismiss}
                            disabled={isDismissing}
                            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
                            title="Dismiss checklist"
                        >
                            {isDismissing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="px-6 pb-2">
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Steps List OR Mastery Promo */}
                <AnimatePresence mode="wait" initial={false}>
                    {!collapsed && showMasteryPromo && allDone ? (
                        // ── Tier 5: Mastery Paths promotion ──────────────────
                        <motion.div
                            key="mastery-promo"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-2">
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-transparent to-pink-500/8">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                                        <Medal className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white/90">Ready to level up?</p>
                                        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                                            You've completed the Quick Launch. Advance your skills with Mastery Paths in CRM University.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { router.push("/crm/university"); handleDismiss(); }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg shadow-violet-500/20"
                                    >
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        Mastery Paths
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : !collapsed && (

                        <motion.div
                            key="steps"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-5 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isNext = !step.done && steps.slice(0, index).every((s) => s.done);

                                    return (
                                        <motion.button
                                            key={step.id}
                                            onClick={() => router.push(step.href)}
                                            whileHover={step.done ? {} : { scale: 1.02 }}
                                            whileTap={step.done ? {} : { scale: 0.98 }}
                                            className={[
                                                "group relative flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-all duration-200",
                                                "border backdrop-blur-sm",
                                                step.done
                                                    ? "border-emerald-500/20 bg-emerald-500/5 cursor-default"
                                                    : isNext
                                                        ? "border-violet-500/40 bg-violet-500/8 hover:bg-violet-500/12 hover:border-violet-500/60 cursor-pointer ring-1 ring-violet-500/20"
                                                        : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15 cursor-pointer",
                                            ].join(" ")}
                                        >
                                            {/* Step number + check */}
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className={[
                                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                                        step.done
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : isNext
                                                                ? "bg-violet-500/20 text-violet-400"
                                                                : "bg-white/8 text-white/40"
                                                    ].join(" ")}>
                                                        {index + 1}
                                                    </div>
                                                    <Icon className={["w-4 h-4 flex-shrink-0", step.done ? "text-emerald-400" : step.iconColor].join(" ")} />
                                                </div>

                                                {step.done ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                ) : isNext ? (
                                                    <ChevronRight className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-white/15 flex-shrink-0" />
                                                )}
                                            </div>

                                            {/* Label */}
                                            <div className="space-y-0.5">
                                                <p className={[
                                                    "text-xs font-semibold leading-tight",
                                                    step.done ? "text-emerald-400/80 line-through" : "text-white/80",
                                                ].join(" ")}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[10px] text-white/35 leading-snug">
                                                    {step.description}
                                                </p>
                                            </div>

                                            {/* Next step indicator pill */}
                                            {isNext && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full border border-violet-500/20">
                                                    Next step
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer hint */}
                            <div className="px-6 pb-4 flex items-center justify-between">
                                <p className="text-[10px] text-white/25">
                                    Click any step to navigate there. The checklist disappears once everything is set up.
                                </p>
                                <button
                                    onClick={handleDismiss}
                                    disabled={isDismissing}
                                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors underline underline-offset-2 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isDismissing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                    Dismiss forever
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
