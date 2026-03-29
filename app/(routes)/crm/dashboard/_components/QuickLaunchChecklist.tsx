"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
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
    Loader2,
    Zap,
    Crown,
} from "lucide-react";
import { dismissQuickLaunch } from "../_actions/dismiss-quick-launch";
import { claimOnboardingBonus } from "@/actions/crm/onboarding-bonus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    /** Number of accounts */
    accounts?: number;
    /** Number of contacts */
    contacts?: number;
    /** Number of opportunities */
    opportunities?: number;
}

interface Step {
    id: string;
    label: string;
    description: string;
    tip: string;
    href: string;
    icon: React.ElementType;
    gradient: string;
    glowColor: string;
    ctaLabel: string;
    done: boolean;
}

interface QuickLaunchChecklistProps {
    counts: ChecklistCounts;
    initiallyDismissed?: boolean;
    hasCampaigns?: boolean;
}

const DISMISS_KEY = "crm_quick_launch_dismissed_v1";
const TOUR_KEY = "crm_product_tour_v2";

// ─── Component ─────────────────────────────────────────────────────────────

export function QuickLaunchChecklist({ counts, initiallyDismissed = false, hasCampaigns = true }: QuickLaunchChecklistProps) {
    const router = useRouter();
    const [dismissed, setDismissed] = useState(initiallyDismissed);
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [activeStep, setActiveStep] = useState<string | null>(null);

    useEffect(() => {
        const isLocallyDismissed = localStorage.getItem(DISMISS_KEY) === "true";
        if (isLocallyDismissed) {
            setDismissed(true);
        }
        setMounted(true);
    }, []);

    const premiumSteps: Step[] = [
        {
            id: "campaign",
            label: "Create a Campaign",
            description: "Your outreach mission starts here. A campaign groups your leads, sequences, and team assignments under one strategic goal.",
            tip: "Name it after the market segment you're targeting — e.g. 'Q2 SMB SaaS Push'.",
            href: "/campaigns",
            icon: Megaphone,
            gradient: "from-orange-500 to-rose-500",
            glowColor: "rgba(249,115,22,0.15)",
            ctaLabel: "Campaigns",
            done: counts.campaigns > 0,
        },
        {
            id: "wizard",
            label: "Run the LeadGen Wizard",
            description: "Describe your ideal customer in plain English. The AI discovers matching companies and contacts automatically.",
            tip: "The wizard creates a List for you — so completing this step also checks off 'Build a List'.",
            href: "/crm/accounts",
            icon: Wand2,
            gradient: "from-cyan-500 to-blue-500",
            glowColor: "rgba(6,182,212,0.15)",
            ctaLabel: "Accounts",
            done: counts.lists > 0,
        },
        {
            id: "list",
            label: "Build a List",
            description: "A List is a curated segment of target accounts ready for outreach. Group by campaign, region, or ICP.",
            tip: "Each List can be assigned to a different team member for focused execution.",
            href: "/lists",
            icon: List,
            gradient: "from-violet-500 to-indigo-500",
            glowColor: "rgba(139,92,246,0.15)",
            ctaLabel: "Lists",
            done: counts.lists > 0,
        },
        {
            id: "assign",
            label: "Assign to a Team Member",
            description: "Assign your List so a teammate can begin outreach. Members only see the Lists assigned to them.",
            tip: "This keeps work focused and prevents overlap between team members.",
            href: "/lists",
            icon: Users,
            gradient: "from-emerald-500 to-teal-500",
            glowColor: "rgba(16,185,129,0.15)",
            ctaLabel: "Lists",
            done: counts.teamMembers > 1 && counts.lists > 0,
        },
        {
            id: "outreach",
            label: "Launch Outreach",
            description: "Kick off your first email or call sequence directly from a List. Watch engagement roll in.",
            tip: "Your team member launches outreach from their assigned List — the system handles the rest.",
            href: "/campaigns",
            icon: Rocket,
            gradient: "from-pink-500 to-rose-500",
            glowColor: "rgba(236,72,153,0.15)",
            ctaLabel: "Campaigns",
            done: counts.outreachStarted,
        },
    ];

    const basicSteps: Step[] = [
        {
            id: "wizard_basic",
            label: "Run the LeadGen Wizard",
            description: "Describe your ideal customer in plain English. The AI will build a targeted list of accounts and contacts matching your criteria.",
            tip: "Save hours of manual research by letting our agentic AI build your pipeline.",
            href: "/crm/accounts",
            icon: Wand2,
            gradient: "from-cyan-500 to-blue-500",
            glowColor: "rgba(6,182,212,0.15)",
            ctaLabel: "Accounts",
            done: counts.lists > 0,
        },
        {
            id: "account",
            label: "Add an Account",
            description: "Manually track a target company or load one from your AI-generated list.",
            tip: "The LeadGen wizard automatically creates accounts for you, auto-completing this step.",
            href: "/crm/accounts",
            icon: Sparkles, // Or LandmarkIcon equivalent
            gradient: "from-orange-500 to-rose-500",
            glowColor: "rgba(249,115,22,0.15)",
            ctaLabel: "Accounts",
            done: (counts.accounts ?? 0) > 0,
        },
        {
            id: "contact",
            label: "Add a Contact",
            description: "Store individual stakeholders, decision makers, and key prospects for your accounts.",
            tip: "AI Scraped leads often bring rich contact profiles that link instantly to their accounts.",
            href: "/crm/contacts",
            icon: Users,
            gradient: "from-violet-500 to-indigo-500",
            glowColor: "rgba(139,92,246,0.15)",
            ctaLabel: "Contacts",
            done: (counts.contacts ?? 0) > 0,
        },
        {
            id: "opportunities",
            label: "Create an Opportunity",
            description: "Start tracking deals and potential revenue. Move standard contacts into an active sales process.",
            tip: "Linking an Account to an Opportunity allows for perfectly weighted revenue forecasting.",
            href: "/crm/opportunities",
            icon: Rocket,
            gradient: "from-emerald-500 to-teal-500",
            glowColor: "rgba(16,185,129,0.15)",
            ctaLabel: "Opportunities",
            done: (counts.opportunities ?? 0) > 0,
        },
    ];

    const steps = hasCampaigns ? premiumSteps : basicSteps;

    const completedCount = steps.filter((s) => s.done).length;
    const allDone = completedCount === steps.length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    // Find first incomplete step
    const nextStepIndex = steps.findIndex((s) => !s.done);

    // Tier 5: When all done, show Mastery Paths promotion
    const [showMasteryPromo, setShowMasteryPromo] = useState(false);
    const [bonusCredited, setBonusCredited] = useState(false);

    const handleSessionDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("crm_onboarding_session_dismissed", "true");
        window.dispatchEvent(new Event("crm_session_dismiss_onboarding"));
    };

    const handleForeverDismiss = useCallback(async () => {
        if (isDismissing) return;
        setIsDismissing(true);

        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, "true");
        localStorage.setItem(TOUR_KEY, "true");

        try {
            const res = await dismissQuickLaunch();
            if (!res.success) {
                console.error("Failed to dismiss on server:", res.error);
            }
        } catch (error) {
            console.error("Error in handleForeverDismiss:", error);
        } finally {
            setIsDismissing(false);
        }
    }, [isDismissing]);

    // Award bonus credits when all steps are complete
    useEffect(() => {
        if (allDone && mounted && !bonusCredited) {
            setBonusCredited(true);
            claimOnboardingBonus("quick_launch_complete").then((res) => {
                if (res.success) {
                    toast.success(res.message || "🎉 You earned 25 bonus LeadGen credits!", {
                        duration: 6000,
                        description: "Bonus credits have been added to your balance.",
                    });
                }
            }).catch(() => { });
        }
    }, [allDone, mounted, bonusCredited]);

    useEffect(() => {
        if (allDone && mounted) {
            const t1 = setTimeout(() => setShowMasteryPromo(true), 1000);
            const t2 = setTimeout(() => handleForeverDismiss(), 12000);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [allDone, mounted, handleForeverDismiss]);

    if (!mounted || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="quick-launch-checklist"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative w-full rounded-2xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-2xl shadow-foreground/5 overflow-hidden"
            >
                {/* Decorative gradient line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />

                {/* Ambient glow layers */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/6 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/3 rounded-full blur-[120px] pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 gap-4 relative z-10">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Animated Progress Ring */}
                        <div className="relative flex-shrink-0 w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle
                                    cx="28" cy="28" r="23"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-muted-foreground/8"
                                />
                                <motion.circle
                                    cx="28" cy="28" r="23"
                                    fill="none"
                                    stroke="url(#checklist-grad)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 23}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 23 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 23 * (1 - progressPct / 100) }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="checklist-grad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center">
                                {allDone ? (
                                    <Crown className="w-5 h-5 text-amber-400" />
                                ) : (
                                    <span className="text-sm font-black text-foreground tabular-nums">
                                        {completedCount}<span className="text-muted-foreground/30">/{steps.length}</span>
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-black italic uppercase tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent leading-none">
                                    {allDone ? "Mission Complete" : "Quick Launch"}
                                </h2>
                                {allDone && (
                                    <motion.span
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="text-lg"
                                    >
                                        🎉
                                    </motion.span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground/50 mt-1 truncate font-medium">
                                {allDone
                                    ? "Your CRM is ready for action. This card will auto-dismiss shortly."
                                    : `${steps.length - completedCount} step${steps.length - completedCount !== 1 ? "s" : ""} to launch your first outreach campaign`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setCollapsed((c) => !c)}
                            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 transition-all"
                            title={collapsed ? "Expand" : "Collapse"}
                        >
                            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleSessionDismiss}
                            disabled={isDismissing}
                            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-50"
                            title="Hide for now"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="px-6 pb-3 flex gap-1 relative z-10">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex-1 h-1 rounded-full overflow-hidden bg-muted/50">
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    step.done
                                        ? `bg-gradient-to-r ${step.gradient}`
                                        : "bg-transparent"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: step.done ? "100%" : "0%" }}
                                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Steps List OR Mastery Promo */}
                <AnimatePresence mode="wait" initial={false}>
                    {!collapsed && showMasteryPromo && allDone ? (
                        <motion.div
                            key="mastery-promo"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 pt-2 space-y-3">
                                {/* Bonus Credits Reward Banner */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/8"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-emerald-400">+25 Bonus Credits Earned!</p>
                                        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                                            Completing Quick Launch unlocked bonus LeadGen credits for your team.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Mastery Paths CTA */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex items-center gap-4 p-5 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-transparent to-pink-500/8"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
                                        <Medal className="w-6 h-6 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground">Ready to level up?</p>
                                        <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                                            Advance your skills with Mastery Paths in CRM University.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { router.push("/crm/university"); handleForeverDismiss(); }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 shadow-lg shadow-violet-500/20"
                                    >
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        Start
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </motion.div>
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
                            <div className="px-4 pb-4 pt-1 space-y-1.5">
                                {steps.map((step, index) => {
                                    const Icon = step.icon;
                                    const isNext = index === nextStepIndex;
                                    const isExpanded = activeStep === step.id;
                                    const isPast = step.done;

                                    return (
                                        <motion.div
                                            key={step.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.06 }}
                                        >
                                            <button
                                                onClick={() => {
                                                    if (isExpanded) {
                                                        setActiveStep(null);
                                                    } else {
                                                        setActiveStep(step.id);
                                                    }
                                                }}
                                                className={cn(
                                                    "group relative w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300",
                                                    "border backdrop-blur-sm",
                                                    isPast
                                                        ? "border-emerald-500/15 bg-emerald-500/5"
                                                        : isNext
                                                            ? "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/8 ring-1 ring-violet-500/10"
                                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                                                )}
                                            >
                                                {/* Step indicator */}
                                                <div className={cn(
                                                    "relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                                    isPast
                                                        ? "bg-emerald-500/15"
                                                        : isNext
                                                            ? `bg-gradient-to-br ${step.gradient} shadow-lg`
                                                            : "bg-muted/50"
                                                )}>
                                                    {isPast ? (
                                                        <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400" />
                                                    ) : (
                                                        <Icon className={cn(
                                                            "w-4 h-4",
                                                            isNext ? "text-primary-foreground" : "text-muted-foreground/40"
                                                        )} />
                                                    )}
                                                    {isNext && !isPast && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-xl"
                                                            animate={{
                                                                boxShadow: [
                                                                    `0 0 0 0px ${step.glowColor}`,
                                                                    `0 0 0 6px ${step.glowColor}`,
                                                                    `0 0 0 0px ${step.glowColor}`,
                                                                ]
                                                            }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs font-bold leading-tight transition-colors",
                                                            isPast
                                                                ? "text-emerald-400/70 line-through decoration-emerald-500/30"
                                                                : isNext
                                                                    ? "text-foreground"
                                                                    : "text-muted-foreground/50"
                                                        )}>
                                                            {step.label}
                                                        </span>
                                                        {isNext && !isPast && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full border border-violet-500/20 flex-shrink-0">
                                                                Next
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!isPast && (
                                                        <p className="text-[10px] text-muted-foreground/40 mt-0.5 leading-snug line-clamp-1">
                                                            {step.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {isPast ? (
                                                        <span className="text-[9px] font-bold text-emerald-400/50 uppercase tracking-widest">Done</span>
                                                    ) : (
                                                        <ChevronRight className={cn(
                                                            "w-4 h-4 transition-all",
                                                            isNext
                                                                ? "text-violet-400"
                                                                : "text-muted-foreground/20",
                                                            isExpanded && "rotate-90"
                                                        )} />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded detail panel */}
                                            <AnimatePresence>
                                                {isExpanded && !isPast && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="ml-[52px] mr-4 mt-1 mb-2 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed mb-3">
                                                                <span className="text-foreground/40 font-semibold">Tip:</span> {step.tip}
                                                            </p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(step.href);
                                                                }}
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary-foreground transition-all hover:opacity-90",
                                                                    `bg-gradient-to-r ${step.gradient} shadow-md`
                                                                )}
                                                            >
                                                                Go to {step.ctaLabel}
                                                                <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-4 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-amber-400/60" />
                                    <p className="text-[10px] text-muted-foreground/30 font-medium">
                                        Complete all steps to earn <span className="text-amber-400/60 font-bold">25 bonus credits</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleForeverDismiss}
                                    disabled={isDismissing}
                                    className="text-[10px] text-muted-foreground/25 hover:text-muted-foreground/60 transition-colors uppercase tracking-widest font-bold disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isDismissing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
