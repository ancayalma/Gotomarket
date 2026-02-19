"use client";

import { useEffect } from "react";
import { useLearn } from "../providers/learn-provider";

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

// Tab → human-readable label map
export const TAB_LABELS: Record<UniversityTab, string> = {
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
export const TAB_COLORS: Record<UniversityTab, string> = {
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

interface LearnLinkProps {
    /** Which University tab to deep-link to */
    tab: UniversityTab;
    /** Optional label shown in the expanded tooltip */
    tooltipLabel?: string;
    /** Optional: suppress after user dismisses once (persisted per-page in localStorage) */
    dismissKey?: string;
}

/**
 * Headless LearnLink component.
 * Registers the 'Learn' intent for the current page into the global LearnContext.
 * The actual UI is rendered by the UtilityBar.
 */
export function LearnLink({ tab, tooltipLabel, dismissKey }: LearnLinkProps) {
    const { setActiveLearn } = useLearn();

    useEffect(() => {
        setActiveLearn(tab, tooltipLabel, dismissKey);
        // Clear on unmount
        return () => setActiveLearn(null);
    }, [tab, tooltipLabel, dismissKey, setActiveLearn]);

    return null;
}

