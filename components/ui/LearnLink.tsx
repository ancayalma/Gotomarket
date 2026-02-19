"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, X } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type UniversityTab =
    | "getting-started"
    | "project-workflow"
    | "flow"
    | "compliance"
    | "data-health"
    | "certification"
    | "prompt-lab"
    | "roi-modeler"
    | "architecture"
    | "reference";

interface LearnLinkProps {
    /** Which University tab to deep-link to */
    tab: UniversityTab;
    /** Optional label shown in the expanded tooltip */
    tooltipLabel?: string;
    /** Optional: suppress after user dismisses once (persisted per-page in localStorage) */
    dismissKey?: string;
}

// Tab → human-readable label map
const TAB_LABELS: Record<UniversityTab, string> = {
    "getting-started": "Getting Started",
    "project-workflow": "Project Workflow",
    "flow": "Flow Architecture",
    "compliance": "Compliance Academy",
    "data-health": "Data Health",
    "certification": "Mastery Paths",
    "prompt-lab": "Persona Playbook",
    "roi-modeler": "ROI Modeler",
    "architecture": "Architecture",
    "reference": "Quick Reference",
};

// Tab → accent color
const TAB_COLORS: Record<UniversityTab, string> = {
    "getting-started": "from-amber-500 to-orange-500",
    "project-workflow": "from-indigo-500 to-blue-500",
    "flow": "from-blue-500 to-cyan-500",
    "compliance": "from-blue-500 to-sky-500",
    "data-health": "from-emerald-500 to-teal-500",
    "certification": "from-violet-500 to-purple-500",
    "prompt-lab": "from-emerald-500 to-cyan-500",
    "roi-modeler": "from-emerald-500 to-green-500",
    "architecture": "from-violet-500 to-pink-500",
    "reference": "from-emerald-500 to-teal-500",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function LearnLink({ tab, tooltipLabel, dismissKey }: LearnLinkProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const storageKey = dismissKey ?? `crm_learnlink_${tab}`;

    useEffect(() => {
        setMounted(true);
        try {
            if (localStorage.getItem(storageKey) === "true") {
                setDismissed(true);
            }
        } catch { /* ignore */ }
    }, [storageKey]);

    if (!mounted || dismissed) return null;

    const label = tooltipLabel ?? `Learn about ${TAB_LABELS[tab]}`;
    const gradient = TAB_COLORS[tab];

    const handleNavigate = () => {
        router.push(`/crm/university?tab=${tab}`);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDismissed(true);
        try { localStorage.setItem(storageKey, "true"); } catch { /* ignore */ }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Expanded tooltip card */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/40 p-4 w-64"
                    >
                        {/* Top gradient line */}
                        <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r ${gradient}`} />

                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-bold text-white/90">CRM University</p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-white/25 hover:text-white/60 transition-colors p-0.5"
                                title="Don't show again"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                            {label}. Open the{" "}
                            <span className={`font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                {TAB_LABELS[tab]}
                            </span>{" "}
                            tab in CRM University.
                        </p>
                        <button
                            onClick={handleNavigate}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity`}
                        >
                            Open University →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB pill */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
                onClick={() => setExpanded((e) => !e)}
                className={[
                    "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg",
                    "border border-white/10 bg-slate-900/80 backdrop-blur-lg",
                    "text-white/60 hover:text-white/90 transition-all duration-200",
                    "hover:shadow-xl hover:scale-105 hover:border-white/20",
                    expanded ? "ring-1 ring-white/20" : "",
                ].join(" ")}
                title="Learn about this page"
            >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                    <GraduationCap className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">Learn about this page</span>
            </motion.button>
        </div>
    );
}
