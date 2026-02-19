"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { UniversityTab } from "../ui/LearnLink";

interface LearnContextType {
    activeTab: UniversityTab | null;
    tooltipLabel: string | null;
    dismissKey: string | null;
    setActiveLearn: (tab: UniversityTab | null, label?: string, dismissKey?: string) => void;
}

const LearnContext = createContext<LearnContextType | undefined>(undefined);

export function LearnProvider({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState<UniversityTab | null>(null);
    const [tooltipLabel, setTooltipLabel] = useState<string | null>(null);
    const [dismissKey, setDismissKey] = useState<string | null>(null);

    const setActiveLearn = useCallback((tab: UniversityTab | null, label?: string, dKey?: string) => {
        setActiveTab(tab);
        setTooltipLabel(label || null);
        setDismissKey(dKey || null);
    }, []);

    return (
        <LearnContext.Provider value={{ activeTab, tooltipLabel, dismissKey, setActiveLearn }}>
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
