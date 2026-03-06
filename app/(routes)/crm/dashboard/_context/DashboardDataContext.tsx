"use client";

import React, { createContext, useContext } from "react";

/**
 * DashboardDataContext — Composition Pattern: Context Provider
 *
 * Eliminates prop drilling of widget data through 3 component layers:
 *   DashboardRoleManager → AdminDashboard → EditableWidgetGrid
 *
 * Previously, 22+ props were passed through AdminDashboard purely
 * to forward them to EditableWidgetGrid. Now, DashboardRoleManager
 * wraps the tree with this provider, and EditableWidgetGrid reads
 * directly from context — zero forwarding props needed.
 */

export interface DashboardData {
    // Identity
    userId: string;
    userName: string;

    // Revenue
    revenue: number;
    actualRevenue: number;
    unrealizedRevenue: number;
    forecastRevenue: number;

    // Pipeline
    activePipelineCount: number;
    totalLeads: number;
    totalOpportunities: number;
    activeUsersCount: number;
    userLevel: number;
    prestigeGrade: number;
    masteryLevel: number;

    // Entities
    crmEntities: any[];
    projectEntities: any[];

    // Widget Data
    newLeads: any[];
    newProjects: any[];
    dailyTasks: any[];
    messages: any[];
    teamActivity: any[];
    recentFiles: any[];
    revenuePacing: any;
    outreachStats: any;
    leadPools: any[];
    leadGenStats: any;
    intelligenceStats: any;
    aiInsights: any[];
    engagementPulse: any[];
    synthesisAnalytics: any;

    // Pipelines (React nodes)
    myPipeline?: React.ReactNode;
    teamPipeline?: React.ReactNode;

    // Team / Misc
    teamData?: any;

    // Quick Action Counts
    newLeadsCount: number;
    newProjectsCount: number;
    allTasksCount: number;
    // Custom Metrics
    customWidgets: any[];
}

const DashboardDataContext = createContext<DashboardData | undefined>(undefined);

/**
 * Hook to access dashboard data from any child component.
 * Throws if used outside of DashboardDataProvider.
 */
export const useDashboardData = () => {
    const context = useContext(DashboardDataContext);
    if (!context) {
        throw new Error("useDashboardData must be used within a DashboardDataProvider");
    }
    return context;
};

interface DashboardDataProviderProps {
    data: DashboardData;
    children: React.ReactNode;
}

export const DashboardDataProvider = ({ data, children }: DashboardDataProviderProps) => {
    return (
        <DashboardDataContext.Provider value={data}>
            {children}
        </DashboardDataContext.Provider>
    );
};
