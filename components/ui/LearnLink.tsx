"use client";

import { useEffect } from "react";
import { useLearn } from "../providers/learn-provider";

// ─── Types ─────────────────────────────────────────────────────────────────

// Add any new tab keys here as we roll out across all pages
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
    | "reference"
    | "dashboard"
    | "accounts"
    | "account-detail"
    | "contacts"
    | "contact-detail"
    | "leads"
    | "lead-detail"
    | "opportunities"
    | "opportunity-detail"
    | "projects"
    | "contracts"
    | "quotes"
    | "cases"
    | "tasks"
    | "approvals"
    | "workflows"
    | "dialer"
    | "settings"
    | "calendar"
    | "notifications"
    | "products"
    | "sales-command"
    | "prompt"
    | "validation-rules"
    | "lists"
    | "forms"
    | "reports"
    | "invoice"
    | "employees"
    | "admin"
    | "partners"
    | "profile"
    | "documents"
    | "campaigns"
    | "messages"
    | "emails"
    | "search"
    | "databox"
    | "insights";

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
    "dashboard": "Overview Dashboard",
    "accounts": "Accounts Management",
    "account-detail": "Account Explorer",
    "contacts": "Contacts Management",
    "contact-detail": "Contact Explorer",
    "leads": "Lead Management",
    "lead-detail": "Lead Intelligence",
    "opportunities": "Pipeline Opportunities",
    "opportunity-detail": "Deal Workspace",
    "projects": "Project Management",
    "contracts": "Contracts & Legal",
    "quotes": "Quote Builder",
    "cases": "Service Console",
    "tasks": "Task Management",
    "approvals": "Approval Workflows",
    "workflows": "FlowState Automation",
    "dialer": "Communication Terminal",
    "settings": "System Settings",
    "calendar": "Global Calendar",
    "notifications": "Activity Center",
    "products": "Product Catalog",
    "sales-command": "Sales Command",
    "prompt": "AI Engineering",
    "validation-rules": "Guard Rules",
    "lists": "Lead Segmenting",
    "forms": "LeadGen Forms",
    "reports": "Performance Analytics",
    "invoice": "Financial Operations",
    "employees": "Human Resources",
    "admin": "System Administration",
    "partners": "Platform Management",
    "profile": "User Account",
    "documents": "Asset Library",
    "campaigns": "Outreach Campaigns",
    "messages": "Internal Messaging",
    "emails": "Email Communications",
    "search": "Global Search",
    "databox": "Databox Integration",
    "insights": "Sales Intelligence"
};

// Tab → accent color
export const TAB_COLORS: Record<UniversityTab, string> = {
    // University colors (existing)
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

    // CRM Module colors
    "dashboard": "from-indigo-500 to-blue-500",
    "accounts": "from-blue-500 to-cyan-500",
    "account-detail": "from-blue-500 to-cyan-500",
    "contacts": "from-emerald-500 to-teal-500",
    "contact-detail": "from-emerald-500 to-teal-500",
    "leads": "from-amber-500 to-orange-500",
    "lead-detail": "from-amber-500 to-orange-500",
    "opportunities": "from-violet-500 to-purple-500",
    "opportunity-detail": "from-violet-500 to-purple-500",
    "projects": "from-rose-500 to-pink-500",
    "contracts": "from-stone-500 to-neutral-500",
    "quotes": "from-stone-500 to-neutral-500",
    "cases": "from-sky-500 to-indigo-500",
    "tasks": "from-emerald-500 to-teal-500",
    "approvals": "from-teal-500 to-emerald-500",
    "workflows": "from-fuchsia-500 to-pink-500",
    "dialer": "from-emerald-500 to-teal-500",
    "settings": "from-slate-500 to-gray-500",
    "calendar": "from-blue-500 to-indigo-500",
    "notifications": "from-rose-500 to-pink-500",
    "products": "from-amber-500 to-orange-500",
    "sales-command": "from-violet-500 to-purple-500",
    "prompt": "from-emerald-500 to-cyan-500",
    "validation-rules": "from-red-500 to-rose-500",
    "lists": "from-blue-500 to-cyan-500",
    "forms": "from-emerald-500 to-teal-500",
    "reports": "from-violet-500 to-purple-500",
    "invoice": "from-orange-500 to-red-500",
    "employees": "from-slate-500 to-gray-500",
    "admin": "from-red-500 to-orange-500",
    "partners": "from-indigo-500 to-blue-500",
    "profile": "from-slate-500 to-gray-500",
    "documents": "from-stone-500 to-neutral-500",
    "campaigns": "from-amber-500 to-orange-500",
    "messages": "from-blue-500 to-indigo-500",
    "emails": "from-blue-500 to-sky-500",
    "search": "from-violet-500 to-purple-500",
    "databox": "from-cyan-500 to-blue-500",
    "insights": "from-indigo-600 to-violet-600"
};

interface LearnLinkProps {
    /** Which University tab or module to deep-link or style for */
    tab: UniversityTab;
    /** Optional label shown in the expanded tooltip */
    tooltipLabel?: string;
    /** Title of the specific overview card to be shown */
    overviewTitle?: string;
    /** 'What' section content */
    overviewWhat?: string;
    /** 'Why' section content */
    overviewWhy?: string;
    /** 'How' section content */
    overviewHow?: string;
    /** Optional: suppress after user dismisses once (persisted per-page in localStorage) */
    dismissKey?: string;
}

/**
 * Headless LearnLink component.
 * Registers the 'Learn' intent and localized overview details for the current page into the global LearnContext.
 * The actual UI is rendered by the UtilityBar anywhere in the CRM layout.
 */
export function LearnLink({
    tab,
    tooltipLabel,
    overviewTitle,
    overviewWhat,
    overviewWhy,
    overviewHow,
    dismissKey
}: LearnLinkProps) {
    const { setActiveLearn } = useLearn();

    useEffect(() => {
        // Mount page details into context
        setActiveLearn(
            tab,
            tooltipLabel,
            dismissKey,
            overviewTitle,
            overviewWhat,
            overviewWhy,
            overviewHow
        );
        // Clear on unmount to prevent bleeding into other pages that lack a LearnLink
        return () => setActiveLearn(null);
    }, [tab, tooltipLabel, overviewTitle, overviewWhat, overviewWhy, overviewHow, dismissKey, setActiveLearn]);

    return null;
}

