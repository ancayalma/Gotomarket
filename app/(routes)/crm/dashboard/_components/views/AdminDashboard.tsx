"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGreeting } from "@/app/hooks/use-greeting";
import DashboardCard from "../DashboardCard";
import { DollarSign, TrendingUp, Users2, Activity, UserPlus, FolderPlus, ClipboardList, MessageSquare } from "lucide-react";
import { EntityBreakdown } from "../../../../dashboard/components/EntityBreakdown";
import JumpBackIn from "../JumpBackIn";
import { DashboardLayoutProvider } from "../../_context/DashboardLayoutContext";
import { EditableWidgetGrid } from "../widgets/EditableWidgetGrid";
import { EditDashboardButton } from "../EditDashboardButton";
import { QuickLaunchChecklist, type ChecklistCounts } from "../QuickLaunchChecklist";
import { ProductTour } from "@/components/ui/ProductTour";

interface AdminDashboardProps {
    userId: string;
    userName: string;
    revenue: number;
    actualRevenue: number;
    activePipelineCount: number;
    totalLeads: number;
    totalOpportunities: number;
    activeUsersCount: number;
    myPipeline: React.ReactNode;
    teamPipeline: React.ReactNode;
    crmEntities: any[];
    projectEntities: any[];
    // Full Data for Widgets
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
    // Quick Action Counts
    newLeadsCount: number;
    newProjectsCount: number;
    allTasksCount: number;
    messagesCount: number;
    initialLayout?: any[];
    teamData?: any;
    quickLaunchDismissed?: boolean;
}

const AdminDashboard = ({
    userId,
    userName,
    revenue,
    actualRevenue,
    activePipelineCount,
    totalLeads,
    totalOpportunities,
    activeUsersCount,
    myPipeline,
    teamPipeline,
    crmEntities = [],
    projectEntities = [],
    newLeads = [],
    newProjects = [],
    dailyTasks = [],
    messages = [],
    teamActivity = [],
    recentFiles = [],
    revenuePacing = null,
    outreachStats = null,
    leadPools = [],
    leadGenStats = null,
    intelligenceStats = null,
    aiInsights = [],
    newLeadsCount = 0,
    newProjectsCount = 0,
    allTasksCount = 0,
    messagesCount = 0,
    initialLayout,
    teamData,
    quickLaunchDismissed = false
}: AdminDashboardProps) => {
    const router = useRouter();
    const greeting = useGreeting();

    // ─── Quick Launch Checklist logic ───────────────────────────────────
    const [isLocallyDismissed, setIsLocallyDismissed] = React.useState(false);

    React.useEffect(() => {
        const locallyDismissed = localStorage.getItem("crm_quick_launch_dismissed_v1") === "true";
        if (locallyDismissed) {
            setIsLocallyDismissed(true);
        }
    }, []);

    // Derive completion signals from existing data already passed to this component.
    // "Campaigns" are tracked as boards/projects; outreachStats.totalSent > 0 means outreach is live.
    const checklistCounts: ChecklistCounts = {
        campaigns: Array.isArray(newProjects) ? newProjects.length : 0,
        lists: Array.isArray(leadPools) ? leadPools.length : 0,
        teamMembers: activeUsersCount,
        outreachStarted: (outreachStats?.aggregate?.emails_sent ?? 0) > 0
            || (Array.isArray(outreachStats?.campaigns) && outreachStats.campaigns.length > 0),
    };

    // Only show checklist to admins who are clearly just getting started AND haven't dismissed it
    const isNewishAdmin =
        !isLocallyDismissed && !quickLaunchDismissed && (
            checklistCounts.campaigns === 0 ||
            checklistCounts.lists === 0 ||
            !checklistCounts.outreachStarted
        );


    return (
        <>
            <DashboardLayoutProvider initialLayout={initialLayout}>
                <div className="flex flex-col p-6 min-h-screen">
                    {/* 1. Header & Intelligence Section */}
                    <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white/90">{greeting}, {userName}</h1>
                                <p className="text-muted-foreground mt-1 font-medium italic opacity-80 border-l-2 border-primary/30 pl-3">This is your Command Center.</p>
                            </div>
                            {/* Jump Back In - Top Right with Global Edit */}
                            <div className="flex-shrink-0 relative">
                                <div className="absolute top-[-2.5rem] right-0 z-10 font-sans">
                                    <EditDashboardButton availableEntities={crmEntities} />
                                </div>
                                <JumpBackIn align="right" userId={userId} />
                            </div>
                        </div>

                        {/* Quick Launch Checklist — only visible for new admins */}
                        {isNewishAdmin && (
                            <div data-tour-id="tour-checklist">
                                <QuickLaunchChecklist
                                    counts={checklistCounts}
                                    initiallyDismissed={quickLaunchDismissed}
                                />
                            </div>
                        )}

                        {/* Intelligence & Operations Widgets - MOVED TO TOP */}
                        <EditableWidgetGrid
                            newLeads={newLeads}
                            dailyTasks={dailyTasks}
                            userId={userId}
                            newProjects={newProjects}
                            messages={messages}
                            teamActivity={teamActivity}
                            recentFiles={recentFiles}
                            revenuePacing={revenuePacing}
                            outreachStats={outreachStats}
                            leadPools={leadPools}
                            leadGenStats={leadGenStats}
                            intelligenceStats={intelligenceStats}
                            aiInsights={aiInsights}
                            revenue={revenue}
                            actualRevenue={actualRevenue}
                            activeUsersCount={activeUsersCount}
                            myPipeline={myPipeline}
                            teamPipeline={teamPipeline}
                            crmEntities={crmEntities}
                            teamData={teamData}
                        />
                    </div>
                </div>
            </DashboardLayoutProvider>

            {/* First-login product tour — portal-style, outside layout so z-index is clean */}
            <ProductTour />
        </>
    );
};

export default AdminDashboard;
