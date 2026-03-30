"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useRouter } from "next/navigation";
import { useGreeting } from "@/app/hooks/use-greeting";
import DashboardCard from "../DashboardCard";
import { DollarSign, TrendingUp, Users2, Activity, UserPlus, FolderPlus, ClipboardList, MessageSquare } from "lucide-react";
import { EntityBreakdown } from "../../../../dashboard/components/EntityBreakdown";
import JumpBackIn from "../JumpBackIn";
import { DashboardLayoutProvider } from "../../_context/DashboardLayoutContext";
import { useDashboardData } from "../../_context/DashboardDataContext";
import { EditDashboardButton } from "../EditDashboardButton";
import { QuickLaunchChecklist, type ChecklistCounts } from "../QuickLaunchChecklist";
import { ProductTour } from "@/components/ui/ProductTour";

/**
 * Dynamic import: EditableWidgetGrid is 580+ lines importing DnD Kit, Framer Motion,
 * and all 18 widget components. Loading it dynamically reduces the initial JS bundle
 * sent to the client. ssr: false is safe since this is already a "use client" component.
 */
const EditableWidgetGrid = dynamic(
    () => import("../widgets/EditableWidgetGrid").then(mod => mod.EditableWidgetGrid),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[400px] rounded-xl bg-muted/40 border border-border/50" />
                ))}
            </div>
        ),
    }
);

/**
 * AdminDashboard — Composition Pattern: Context Consumer
 *
 * Previously received 30+ forwarded props from DashboardRoleManager.
 * Now reads all widget data from DashboardDataContext, keeping only
 * UI-specific props (initialLayout, quickLaunchDismissed).
 */
interface AdminDashboardProps {
    initialLayout?: any[];
    quickLaunchDismissed?: boolean;
    hasCampaigns?: boolean;
}

const AdminDashboard = ({
    initialLayout,
    quickLaunchDismissed = false,
    hasCampaigns = true
}: AdminDashboardProps) => {
    const router = useRouter();
    const greeting = useGreeting();

    // All widget data comes from context — zero prop drilling
    const {
        userId,
        userName,
        newProjects,
        leadPools,
        activeUsersCount,
        outreachStats,
        crmEntities,
        customWidgets = []
    } = useDashboardData();

    // Ensure all custom forged widgets are at least "known" to the layout provider
    const enhancedLayout = React.useMemo(() => {
        const layout = [...(initialLayout || [])];
        customWidgets.forEach((cw: any) => {
            const customId = `custom_${cw.id || cw._id}`;
            if (!layout.find(w => w.id === customId)) {
                layout.push({ id: customId, isVisible: false });
            }
        });
        return layout;
    }, [initialLayout, customWidgets]);

    // ─── Quick Launch Checklist logic ───────────────────────────────────
    const [isLocallyDismissed, setIsLocallyDismissed] = React.useState(false);

    React.useEffect(() => {
        const locallyDismissed = localStorage.getItem("crm_quick_launch_dismissed_v1") === "true";
        if (locallyDismissed) {
            setIsLocallyDismissed(true);
        }
    }, []);

    // Derive completion signals from context data.
    const checklistCounts: ChecklistCounts = {
        campaigns: Array.isArray(newProjects) ? newProjects.length : 0,
        lists: Array.isArray(leadPools) ? leadPools.length : 0,
        teamMembers: activeUsersCount,
        outreachStarted: (outreachStats?.aggregate?.emails_sent ?? 0) > 0
            || (Array.isArray(outreachStats?.campaigns) && outreachStats.campaigns.length > 0),
        accounts: crmEntities.find(e => e.id === "entity:accounts")?.value || 0,
        contacts: crmEntities.find(e => e.id === "entity:contacts")?.value || 0,
        opportunities: crmEntities.find(e => e.id === "entity:opportunities")?.value || 0,
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
            <DashboardLayoutProvider initialLayout={enhancedLayout}>
                <div className="flex flex-col p-6 min-h-screen">
                    {/* 1. Header & Intelligence Section */}
                    <div className="max-w-[1600px] mx-auto w-full space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent tracking-tight uppercase leading-relaxed py-4 px-4">
                                    {greeting}{userName ? `, ${userName}` : ""}
                                </h2>
                                <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                                    This is your Command Center.
                                </p>
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
                                    hasCampaigns={hasCampaigns}
                                />
                            </div>
                        )}

                        {/* Intelligence & Operations Widgets — reads from DashboardDataContext */}
                        <EditableWidgetGrid />
                    </div>
                </div>
            </DashboardLayoutProvider>

            {/* First-login product tour — portal-style, outside layout so z-index is clean */}
            <ProductTour dismissed={quickLaunchDismissed} hasCampaigns={hasCampaigns} />
        </>
    );
};

export default AdminDashboard;
