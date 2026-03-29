"use client";

/**
 * ProductTour — One-time, first-login guided spotlight tour.
 *
 * Pattern:
 *   1. Check localStorage for completion flag.
 *   2. If unseen, wait for DOM to settle, then find target elements by their
 *      `data-tour-id` attribute (or a custom id).
 *   3. Render a full-screen overlay with a "spotlight" cutout over the target.
 *   4. Show a positioned tooltip with an arrow + blurb + Next / Skip controls.
 *   5. User clicks through all steps (or skips) — mark complete in localStorage.
 *
 * To target an element from any component, give it the attribute:
 *   data-tour-id="tour-campaigns"
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Megaphone,
    Wand2,
    ClipboardList,
    X,
    ChevronRight,
    Sparkles,
} from "lucide-react";

// ─── Config ─────────────────────────────────────────────────────────────────

const TOUR_KEY = "crm_product_tour_v2";
const PADDING = 12; // px of glow padding around the spotlight target

interface TourStep {
    id: string;
    /** matches data-tour-id attribute on the target DOM element */
    targetId: string;
    /** fallback selector if data-tour-id not found */
    fallbackSelector?: string;
    title: string;
    body: string;
    icon: React.ElementType;
    iconGradient: string;
    /** Preferred tooltip position relative to the spotlight */
    prefer: "bottom" | "top" | "right" | "left";
}

const STEPS: TourStep[] = [
    {
        id: "step-checklist",
        targetId: "tour-checklist",
        title: "Your Quick Launch Checklist",
        body: "This guided checklist walks you through activating your first outreach campaign. Click any step to expand it and navigate there. It auto-dismisses once complete.",
        icon: ClipboardList,
        iconGradient: "from-violet-500 to-cyan-500",
        prefer: "bottom",
    },
    {
        id: "step-campaigns",
        targetId: "tour-campaigns",
        title: "Campaigns",
        body: "Find your Campaigns here in the Marketing Hub. A Campaign is your strategic container — it groups Lists, outreach sequences, and team assignments under one goal.",
        icon: Megaphone,
        iconGradient: "from-orange-500 to-red-500",
        prefer: "right",
    },
    {
        id: "step-leads",
        targetId: "tour-lead-wizard",
        title: "Leads & Lead Wizard",
        body: "Under Leads you'll find the LeadGen Wizard, your Lists, and Outreach controls. The Wizard lets you describe your ideal customer in plain English and auto-discovers matching companies.",
        icon: Wand2,
        iconGradient: "from-cyan-500 to-blue-500",
        prefer: "right",
    },
    {
        id: "step-learn",
        targetId: "tour-learn-nav",
        title: "CRM University",
        body: "The Learn tab is always here in the sidebar. When you're ready to go deeper — Mastery Paths, Compliance Academy, and more are waiting for you.",
        icon: GraduationCap,
        iconGradient: "from-amber-500 to-orange-500",
        prefer: "right",
    },
];


// ─── Types ───────────────────────────────────────────────────────────────────

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

// ─── Sub-component: Spotlight overlay (4 rects that frame the target) ────────

function Spotlight({ rect }: { rect: Rect }) {
    const t = rect.top - PADDING;
    const l = rect.left - PADDING;
    const w = rect.width + PADDING * 2;
    const h = rect.height + PADDING * 2;

    const baseStyle = "fixed bg-black/70 backdrop-blur-[1px] transition-colors duration-500 z-[9998]";

    return (
        <>
            {/* Top */}
            <div className={baseStyle} style={{ top: 0, left: 0, right: 0, height: Math.max(0, t) }} />
            {/* Bottom */}
            <div className={baseStyle} style={{ top: t + h, left: 0, right: 0, bottom: 0 }} />
            {/* Left */}
            <div className={baseStyle} style={{ top: t, left: 0, width: Math.max(0, l), height: h }} />
            {/* Right */}
            <div className={baseStyle} style={{ top: t, left: l + w, right: 0, height: h }} />
            {/* Pulsing glow ring around target */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    boxShadow: [
                        "0 0 0 2px rgba(139,92,246,0.6), 0 0 20px 2px rgba(139,92,246,0.3)",
                        "0 0 0 4px rgba(139,92,246,0.9), 0 0 40px 8px rgba(139,92,246,0.5)",
                        "0 0 0 2px rgba(139,92,246,0.6), 0 0 20px 2px rgba(139,92,246,0.3)"
                    ]
                }}
                transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                    boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }}
                className="fixed z-[9999] pointer-events-none"
                style={{
                    top: t,
                    left: l,
                    width: w,
                    height: h,
                    borderRadius: 14,
                    border: "2px solid rgba(139,92,246,0.6)",
                }}
            />
        </>
    );
}

// ─── Sub-component: Tooltip card ─────────────────────────────────────────────

interface TooltipCardProps {
    step: TourStep;
    stepIndex: number;
    totalSteps: number;
    rect: Rect;
    onNext: () => void;
    onSkip: () => void;
}

function TooltipCard({ step, stepIndex, totalSteps, rect, onNext, onSkip }: TooltipCardProps) {
    const CARD_W = 320;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;

    const t = rect.top - PADDING;
    const l = rect.left - PADDING;
    const w = rect.width + PADDING * 2;
    const h = rect.height + PADDING * 2;

    // Determine card position
    let cardTop: number;
    let cardLeft: number;

    // Safety margins
    const MARGIN = 12;

    if (step.prefer === "bottom" && t + h + 20 + 220 < vh) {
        // Below the spotlight
        cardTop = t + h + 20;
        cardLeft = Math.min(Math.max(l + w / 2 - CARD_W / 2, MARGIN), vw - CARD_W - MARGIN);
    } else if (step.prefer === "top" && t - 20 - 220 > 0) {
        // Above
        cardTop = t - 240;
        cardLeft = Math.min(Math.max(l + w / 2 - CARD_W / 2, MARGIN), vw - CARD_W - MARGIN);
    } else if (step.prefer === "right" && l + w + 20 + CARD_W < vw) {
        // Right side
        cardTop = Math.min(Math.max(t + h / 2 - 110, MARGIN), vh - 240);
        cardLeft = l + w + 20;
    } else if (l - CARD_W - 20 > MARGIN) {
        // Left side
        cardTop = Math.min(Math.max(t + h / 2 - 110, MARGIN), vh - 240);
        cardLeft = l - CARD_W - 20;
    } else {
        // Fallback: Center of viewport if everything else fails
        cardTop = vh / 2 - 110;
        cardLeft = vw / 2 - CARD_W / 2;
    }

    const Icon = step.icon;
    const isLast = stepIndex === totalSteps - 1;

    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-[10000] rounded-2xl border border-border bg-popover/95 backdrop-blur-2xl shadow-2xl shadow-foreground/20 overflow-hidden"
            style={{ top: cardTop, left: cardLeft, width: CARD_W }}
        >
            {/* Gradient top line */}
            <div className={`h-[2px] w-full bg-gradient-to-r ${step.iconGradient}`} />

            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                            <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-0.5">
                                Step {stepIndex + 1} of {totalSteps}
                            </p>
                            <h3 className="text-sm font-bold text-foreground leading-tight">{step.title}</h3>
                        </div>
                    </div>
                    <button
                        onClick={onSkip}
                        className="text-muted-foreground/40 hover:text-foreground transition-colors flex-shrink-0 p-0.5"
                        title="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={[
                                "h-1.5 rounded-full transition-colors duration-300",
                                i === stepIndex
                                    ? `flex-1 bg-gradient-to-r ${step.iconGradient}`
                                    : i < stepIndex
                                        ? "w-3 bg-muted"
                                        : "w-3 bg-muted/40",
                            ].join(" ")}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSkip}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-muted-foreground/60 hover:text-foreground border border-border hover:bg-muted transition-colors"
                    >
                        Skip tour
                    </button>
                    <button
                        onClick={onNext}
                        className={`flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-gradient-to-r ${step.iconGradient} hover:opacity-90 transition-opacity shadow-lg`}
                    >
                        {isLast ? (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Let's go!
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ProductTour({ dismissed = false }: { dismissed?: boolean }) {
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);
    const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Hydration / Mount check
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. One-time check for tour eligibility
    useEffect(() => {
        if (!mounted) return;

        try {
            const seen = localStorage.getItem(TOUR_KEY);
            const sessionDismissed = sessionStorage.getItem("crm_onboarding_session_dismissed") === "true";
            const brandSetupActive = sessionStorage.getItem("crm_brand_setup_active") === "true";

            // If shown once, explicitly dismissed on server, or dismissed for this session, don't show
            if (!seen && !dismissed && !sessionDismissed && !brandSetupActive) {
                // Small delay to let the dashboard fully render before measuring
                const t = setTimeout(() => setActive(true), 1400);
                return () => clearTimeout(t);
            }
        } catch { /* ignore */ }
    }, [mounted, dismissed]);

    // 2b. If tour was deferred because brand setup was active, start it when brand setup closes
    useEffect(() => {
        if (!mounted) return;
        const handler = () => {
            try {
                const seen = localStorage.getItem(TOUR_KEY);
                const sessionDismissed = sessionStorage.getItem("crm_onboarding_session_dismissed") === "true";
                if (!seen && !dismissed && !sessionDismissed) {
                    const t = setTimeout(() => setActive(true), 800);
                    return () => clearTimeout(t);
                }
            } catch { /* ignore */ }
        };
        window.addEventListener("crm_brand_setup_closed", handler);
        return () => window.removeEventListener("crm_brand_setup_closed", handler);
    }, [mounted, dismissed]);

    // 3. Listen for session dismissal events (e.g. from the checklist 'X' button)
    useEffect(() => {
        const handler = () => {
            setActive(false);
        };
        window.addEventListener("crm_session_dismiss_onboarding", handler);
        return () => window.removeEventListener("crm_session_dismiss_onboarding", handler);
    }, []);

    // Measure the target element whenever step changes
    const measureStep = useCallback(function measure(idx: number) {
        const step = STEPS[idx];
        if (!step) return;

        const el =
            document.querySelector(`[data-tour-id="${step.targetId}"]`) ||
            (step.fallbackSelector ? document.querySelector(step.fallbackSelector) : null);

        if (el) {
            // Priority: Scroll element into view first
            el.scrollIntoView({ behavior: "smooth", block: "center" });

            // Small delay for scroll to settle before measuring rect
            setTimeout(() => {
                const r = el.getBoundingClientRect();
                setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
            }, 350);

            if (retryRef.current) clearTimeout(retryRef.current);
        } else {
            // Element not yet rendered — retry up to 10 times × 200ms
            retryRef.current = setTimeout(() => measure(idx), 200);
        }
    }, []);

    useEffect(() => {
        if (!active) return;
        measureStep(stepIndex);
        return () => {
            if (retryRef.current) clearTimeout(retryRef.current);
        };
    }, [active, stepIndex, measureStep]);

    // Re-measure on window resize
    useEffect(() => {
        if (!active) return;
        const handler = () => measureStep(stepIndex);
        window.addEventListener("resize", handler, { passive: true });
        return () => window.removeEventListener("resize", handler);
    }, [active, stepIndex, measureStep]);

    const complete = useCallback(() => {
        setActive(false);
        try { localStorage.setItem(TOUR_KEY, "true"); } catch { /* ignore */ }
    }, []);

    const handleNext = useCallback(() => {
        if (stepIndex < STEPS.length - 1) {
            setRect(null); // clear so spotlight can animate to next
            setStepIndex((i) => i + 1);
        } else {
            complete();
        }
    }, [stepIndex, complete]);

    if (!mounted || !active || !rect) return null;

    const step = STEPS[stepIndex];

    const portalContent = (
        <AnimatePresence>
            <Spotlight key={`spotlight-${stepIndex}`} rect={rect} />
            <TooltipCard
                key={`card-${stepIndex}`}
                step={step}
                stepIndex={stepIndex}
                totalSteps={STEPS.length}
                rect={rect}
                onNext={handleNext}
                onSkip={complete}
            />
        </AnimatePresence>
    );

    return createPortal(portalContent, document.body);
}
