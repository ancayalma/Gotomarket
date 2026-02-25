"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { saveDashboardLayout } from "../_actions/save-dashboard-layout";

export type WidgetItem = {
    id: string;
    isVisible: boolean;
};

interface DashboardLayoutContextType {
    widgets: WidgetItem[];
    isEditMode: boolean;
    setEditMode: (mode: boolean) => void;
    updateLayout: (widgets: WidgetItem[]) => void;
    toggleWidgetVisibility: (id: string, isVisible: boolean) => void;
    saveLayout: () => Promise<void>;
    isLoading: boolean;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const useDashboardLayout = () => {
    const context = useContext(DashboardLayoutContext);
    if (!context) {
        throw new Error("useDashboardLayout must be used within a DashboardLayoutProvider");
    }
    return context;
};

export const defaultWidgets: WidgetItem[] = [
    // --- SEGMENT 1: THE 9 KEY METRICS (IMAGE 1) ---
    { id: "active_users", isVisible: true },
    { id: "avg_deal_size", isVisible: true },
    { id: "revenue", isVisible: true },
    { id: "system_uptime", isVisible: true },
    { id: "active_pipeline", isVisible: true },
    { id: "conversion_rate", isVisible: true },
    { id: "system_health", isVisible: true },
    { id: "my_schedule", isVisible: true },
    { id: "response_time", isVisible: true },

    { id: "divider-1", isVisible: true },

    // --- SEGMENT 2: OPERATIONAL VIEWS (Initially Hidden to match Image 1 focus) ---
    { id: "leads", isVisible: false },
    { id: "tasks", isVisible: false },
    { id: "projects", isVisible: false },
    { id: "messages", isVisible: false },

    { id: "divider-2", isVisible: true },

    { id: "personal_pipeline", isVisible: true },
    { id: "team_pipeline", isVisible: true },

    // --- SEGMENT 3: HUB GRID & EXTENDED ---
    { id: "crm_entities_grid", isVisible: true },

    // --- SEGMENT 4: INTELLIGENCE & ANALYTICS ---
    { id: "win_rate", isVisible: false },
    { id: "lead_velocity", isVisible: false },
    { id: "invoice_aging", isVisible: false },
    { id: "meeting_efficiency", isVisible: false },
    { id: "ai_savings", isVisible: false },
    { id: "leaderboard", isVisible: false },
    { id: "lead_sources", isVisible: false },
    { id: "deal_forecast", isVisible: false },
    { id: "activity_heatmap", isVisible: false },
    { id: "customer_churn", isVisible: false },
    { id: "ticket_volume", isVisible: false },
    { id: "sales_cycle_length", isVisible: false },
    { id: "high_priority_tasks", isVisible: false },
    { id: "pending_approvals", isVisible: false },
    { id: "unread_messages", isVisible: false },

    // Hidden/Optional Operations & Analytics
    { id: "team_activity", isVisible: false },
    { id: "recent_files", isVisible: false },
    { id: "revenue_pacing", isVisible: false },
    { id: "outreach_roi", isVisible: false },
    { id: "lead_pools", isVisible: false },
    { id: "lead_wizard", isVisible: false },
    { id: "ai_insights", isVisible: false },
];

interface DashboardLayoutProviderProps {
    children: React.ReactNode;
    initialLayout?: WidgetItem[]; // From DB
}

export const DashboardLayoutProvider = ({
    children,
    initialLayout,
}: DashboardLayoutProviderProps) => {
    const [widgets, setWidgets] = useState<WidgetItem[]>(defaultWidgets);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when initialLayout changes (if it comes from a server action/fetch)
    useEffect(() => {
        const userLayout = (initialLayout || []) as WidgetItem[];

        // 1. Clean user layout of deprecated items
        const cleanedUser = userLayout.filter(w =>
            w.id !== "divider" &&
            w.id !== "divider-2" &&
            w.id !== "divider-3" &&
            w.id !== "system_uptime_old" // any old IDs
        );

        // 2. Prepare the merge list
        // We start with DEFAULT widgets to ensure the 9 metrics have their default visibility (TRUE)
        // unless overridden. Actually, let's merge carefully to avoid duplicates.
        const workList: WidgetItem[] = [];

        // First pass: Add all default widgets in order
        defaultWidgets.forEach(dw => {
            const userVersion = cleanedUser.find(uw => uw.id === dw.id);
            if (userVersion) {
                // If user has it, but it's one of the 9 metrics, and it's hidden, 
                // FORCE it to be visible if the user hasn't saved a specific "HIDE" preference?
                // For now, let's just respect userVersion but if it's missing, add default.
                workList.push(userVersion);
            } else {
                workList.push(dw);
            }
        });

        // Second pass: Add any extra widgets from user layout that aren't in defaults
        cleanedUser.forEach(uw => {
            if (!workList.find(w => w.id === uw.id)) {
                workList.push(uw);
            }
        });

        // 3. Final Deduplication (Secondary Guard)
        const finalLayout = workList.reduce((acc: WidgetItem[], current) => {
            if (!acc.find(item => item.id === current.id)) {
                acc.push(current);
            }
            return acc;
        }, []);

        // 4. Sort to match defaultWidgets order for the top part
        finalLayout.sort((a, b) => {
            const aIdx = defaultWidgets.findIndex(dw => dw.id === a.id);
            const bIdx = defaultWidgets.findIndex(dw => dw.id === b.id);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return 0;
        });

        setWidgets(finalLayout);
    }, [initialLayout]);

    const updateLayout = (newWidgets: WidgetItem[]) => {
        setWidgets(newWidgets);
    };

    const toggleWidgetVisibility = (id: string, isVisible: boolean) => {
        setWidgets((prev) => {
            const exists = prev.find(w => w.id === id);
            if (exists) {
                return prev.map((w) => (w.id === id ? { ...w, isVisible } : w));
            } else {
                return [...prev, { id, isVisible }];
            }
        });
    };

    const saveLayout = async () => {
        setIsLoading(true);
        try {
            await saveDashboardLayout(widgets);
            toast.success("Dashboard layout saved");
            setIsEditMode(false);
        } catch (error) {
            toast.error("Failed to save layout");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayoutContext.Provider
            value={{
                widgets,
                isEditMode,
                setEditMode: setIsEditMode,
                updateLayout,
                toggleWidgetVisibility,
                saveLayout,
                isLoading,
            }}
        >
            {children}
        </DashboardLayoutContext.Provider>
    );
};
