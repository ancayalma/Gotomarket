"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { UniversityTab } from "../ui/LearnLink";

interface LearnContextType {
    activeTab: UniversityTab | null;
    tooltipLabel: string | null;
    dismissKey: string | null;
    overviewTitle: string | null;
    overviewWhat: string | null;
    overviewWhy: string | null;
    overviewHow: string | null;
    setActiveLearn: (
        tab: UniversityTab | null,
        label?: string,
        dismissKey?: string,
        oTitle?: string,
        oWhat?: string,
        oWhy?: string,
        oHow?: string
    ) => void;
}

const LearnContext = createContext<LearnContextType | undefined>(undefined);

export function LearnProvider({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState<UniversityTab | null>(null);
    const [tooltipLabel, setTooltipLabel] = useState<string | null>(null);
    const [dismissKey, setDismissKey] = useState<string | null>(null);
    const [overviewTitle, setOverviewTitle] = useState<string | null>(null);
    const [overviewWhat, setOverviewWhat] = useState<string | null>(null);
    const [overviewWhy, setOverviewWhy] = useState<string | null>(null);
    const [overviewHow, setOverviewHow] = useState<string | null>(null);

    const setActiveLearn = useCallback((
        tab: UniversityTab | null,
        label?: string,
        dKey?: string,
        oTitle?: string,
        oWhat?: string,
        oWhy?: string,
        oHow?: string
    ) => {
        setActiveTab(tab);
        setTooltipLabel(label || null);
        setDismissKey(dKey || null);
        setOverviewTitle(oTitle || null);
        setOverviewWhat(oWhat || null);
        setOverviewWhy(oWhy || null);
        setOverviewHow(oHow || null);
    }, []);

    return (
        <LearnContext.Provider value={{
            activeTab, tooltipLabel, dismissKey,
            overviewTitle, overviewWhat, overviewWhy, overviewHow,
            setActiveLearn
        }}>
            {children}
        </LearnContext.Provider>
    );
}

export function useLearn() {
    const context = useContext(LearnContext);
    if (context === undefined) {
        throw new Error("useLearn must be used within a LearnProvider");
    }
    return context;
}
