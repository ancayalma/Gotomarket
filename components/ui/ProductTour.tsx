"use client";

/**
 * ProductTour — One-time, first-login guided spotlight tour.
 *
 * Upgraded to use requestAnimationFrame for fluid element tracking
 * (handles smooth-scroll seamlessly) and dynamic pointer arrows for clarity.
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
    targetId: string;
    fallbackSelector?: string;
    title: string;
    body: string;
    icon: React.ElementType;
    iconGradient: string;
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

// ─── Sub-component: Spotlight overlay ────────────────────────────────────────

function Spotlight({ rect }: { rect: Rect }) {
    const t = rect.top - PADDING;
    const l = rect.left - PADDING;
    const w = rect.width + PADDING * 2;
    const h = rect.height + PADDING * 2;

    const baseStyle = "fixed bg-black/70 backdrop-blur-[1px] z-[9998]";

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
                        "0 0 0 2px rgba(139,92,246,0.6), 0 0 25px 4px rgba(139,92,246,0.3)",
                        "0 0 0 3px rgba(139,92,246,0.9), 0 0 45px 8px rgba(139,92,246,0.5)",
                        "0 0 0 2px rgba(139,92,246,0.6), 0 0 25px 4px rgba(139,92,246,0.3)"
                    ]
                }}
                transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                    boxShadow: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
                }}
                className="fixed z-[9999] pointer-events-none transition-all duration-75"
                style={{
                    top: t,
                    left: l,
                    width: w,
                    height: h,
                    borderRadius: 14,
                    border: "1.5px solid rgba(139,92,246,0.7)",
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

    const GAP = 16;
    const MARGIN = 16;
    
    let cardTop: number = t;
    let cardLeft: number = l;
    let pointerPos: "top" | "bottom" | "left" | "right" | "none" = "none";
    let pointerOffset = 0;

    let pref = step.prefer;
    
    // Auto adjust preference if it would overflow bounds
    if (pref === "bottom" && t + h + GAP + 240 > vh) pref = "top";
    if (pref === "top" && t - GAP - 240 < 0) pref = "bottom";
    if (pref === "right" && l + w + GAP + CARD_W > vw) pref = "bottom"; 
    
    // Compute positions based on adjusted preference
    if (pref === "bottom") {
        cardTop = t + h + GAP;
        cardLeft = Math.min(Math.max(l + w / 2 - CARD_W / 2, MARGIN), vw - CARD_W - MARGIN);
        pointerPos = "top";
        pointerOffset = Math.max(20, Math.min(CARD_W - 20, (l + w / 2) - cardLeft));
    } else if (pref === "top") {
        cardTop = t - 260; // rough generic height
        cardLeft = Math.min(Math.max(l + w / 2 - CARD_W / 2, MARGIN), vw - CARD_W - MARGIN);
        pointerPos = "bottom";
        pointerOffset = Math.max(20, Math.min(CARD_W - 20, (l + w / 2) - cardLeft));
    } else if (pref === "right") {
        cardTop = Math.min(Math.max(t + h / 2 - 120, MARGIN), vh - 260);
        cardLeft = l + w + GAP;
        pointerPos = "left";
        pointerOffset = Math.max(20, Math.min(240, (t + h / 2) - cardTop));
    } else if (pref === "left") {
        cardTop = Math.min(Math.max(t + h / 2 - 120, MARGIN), vh - 260);
        cardLeft = l - CARD_W - GAP;
        pointerPos = "right";
        pointerOffset = Math.max(20, Math.min(240, (t + h / 2) - cardTop));
    }

    const Icon = step.icon;
    const isLast = stepIndex === totalSteps - 1;

    return (
        <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)", y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed z-[10000] rounded-2xl border border-white/10 bg-[#0f111a]/95 backdrop-blur-3xl shadow-2xl shadow-black/80 flex flex-col transition-all duration-75"
            style={{ top: cardTop, left: cardLeft, width: CARD_W }}
        >
            {/* SVG Pointer Arrow */}
            {pointerPos === "top" && (
                <div className="absolute -top-[11px] left-0 w-full flex" style={{ paddingLeft: `${pointerOffset - 12}px` }}>
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="drop-shadow-lg">
                        <path d="M12 0L24 12H0L12 0Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M12 1L23 12H1L12 1Z" fill="#0f111a" />
                    </svg>
                </div>
            )}
            {pointerPos === "bottom" && (
                <div className="absolute -bottom-[11px] left-0 w-full flex" style={{ paddingLeft: `${pointerOffset - 12}px` }}>
                    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="drop-shadow-lg">
                        <path d="M12 12L0 0H24L12 12Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M12 11L1 0H23L12 11Z" fill="#0f111a" />
                    </svg>
                </div>
            )}
            {pointerPos === "left" && (
                <div className="absolute -left-[11px] top-0 h-full flex flex-col" style={{ paddingTop: `${pointerOffset - 12}px` }}>
                    <svg width="12" height="24" viewBox="0 0 12 24" fill="none" className="drop-shadow-lg">
                        <path d="M0 12L12 0V24L0 12Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M1 12L12 1V23L1 12Z" fill="#0f111a" />
                    </svg>
                </div>
            )}
            {pointerPos === "right" && (
                <div className="absolute -right-[11px] top-0 h-full flex flex-col" style={{ paddingTop: `${pointerOffset - 12}px` }}>
                    <svg width="12" height="24" viewBox="0 0 12 24" fill="none" className="drop-shadow-lg">
                        <path d="M12 12L0 24V0L12 12Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M11 12L0 23V1L11 12Z" fill="#0f111a" />
                    </svg>
                </div>
            )}

            {/* Gradient top line - offset beautifully underneath the arrow if top */}
            <div className={`h-[2px] w-full bg-gradient-to-r ${step.iconGradient} rounded-t-2xl relative z-10`} />

            <div className="p-5 space-y-4 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.iconGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">
                                Step {stepIndex + 1} of {totalSteps}
                            </p>
                            <h3 className="text-sm font-bold text-white leading-tight">{step.title}</h3>
                        </div>
                    </div>
                    <button
                        onClick={onSkip}
                        className="text-white/40 hover:text-white transition-colors flex-shrink-0 p-1 rounded-md hover:bg-white/5"
                        title="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <p className="text-xs text-white/70 leading-relaxed font-medium">{step.body}</p>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 pt-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={[
                                "h-1.5 rounded-full transition-colors duration-300",
                                i === stepIndex
                                    ? `flex-1 bg-gradient-to-r ${step.iconGradient}`
                                    : i < stepIndex
                                        ? "w-4 bg-white/20"
                                        : "w-3 bg-white/10",
                            ].join(" ")}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    <button
                        onClick={onSkip}
                        className="flex-[0.8] py-2.5 rounded-xl text-[11px] font-bold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={onNext}
                        className={`flex-[1.2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${step.iconGradient} hover:opacity-90 transition-opacity shadow-lg`}
                    >
                        {isLast ? (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Let's launch
                            </>
                        ) : (
                            <>
                                Next step
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

    // 1. Hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. Logic checking
    useEffect(() => {
        if (!mounted) return;
        try {
            const seen = localStorage.getItem(TOUR_KEY);
            const sessionDismissed = sessionStorage.getItem("crm_onboarding_session_dismissed") === "true";
            const brandSetupActive = sessionStorage.getItem("crm_brand_setup_active") === "true";

            if (!seen && !dismissed && !sessionDismissed && !brandSetupActive) {
                const t = setTimeout(() => setActive(true), 1200);
                return () => clearTimeout(t);
            }
        } catch { /* ignore */ }
    }, [mounted, dismissed]);

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

    useEffect(() => {
        const handler = () => setActive(false);
        window.addEventListener("crm_session_dismiss_onboarding", handler);
        return () => window.removeEventListener("crm_session_dismiss_onboarding", handler);
    }, []);

    // Scroll & Track fluid bounding box
    useEffect(() => {
        if (!active || stepIndex >= STEPS.length) return;
        
        const step = STEPS[stepIndex];
        let reqId: number;
        let lastScrollCommand = 0;
        
        const ensureElement = () => document.querySelector(`[data-tour-id="${step.targetId}"]`) || 
                                    (step.fallbackSelector ? document.querySelector(step.fallbackSelector) : null);
        
        // Initial scroll
        const initialEl = ensureElement();
        if (initialEl) {
            initialEl.scrollIntoView({ behavior: "smooth", block: "center" });
            lastScrollCommand = Date.now();
        }
        
        let lastRect = { top: -9999, left: -9999, width: 0, height: 0 };
        
        const loop = () => {
            const el = ensureElement();
            if (el) {
                const r = el.getBoundingClientRect();
                // Check if significantly moved (handles smooth scroll flawlessly)
                if (
                    Math.abs(r.top - lastRect.top) > 1 ||
                    Math.abs(r.left - lastRect.left) > 1 ||
                    Math.abs(r.width - lastRect.width) > 1 ||
                    Math.abs(r.height - lastRect.height) > 1
                ) {
                    if (r.width > 0 && r.height > 0) {
                        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
                        lastRect = r;
                    }
                }
            } else if (Date.now() - lastScrollCommand > 2000 && !initialEl) {
                // Not found even after 2s waiting, it might be collapsed UI.
                // Allow fallback if needed.
            }
            reqId = requestAnimationFrame(loop);
        };
        
        reqId = requestAnimationFrame(loop);
        
        return () => cancelAnimationFrame(reqId);
    }, [active, stepIndex]);

    const complete = useCallback(() => {
        setActive(false);
        try { localStorage.setItem(TOUR_KEY, "true"); } catch { /* ignore */ }
    }, []);

    const handleNext = useCallback(() => {
        if (stepIndex < STEPS.length - 1) {
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
