"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Inbox, GraduationCap, ArrowRight, Zap, Folder, Rocket } from "lucide-react";
import { useGreeting } from "@/app/hooks/use-greeting";
import { LeadsWidget, TasksWidget, ProjectsWidget, MessagesWidget } from "../widgets";
import DashboardCard from "../DashboardCard";
import { QuickLaunchChecklist, type ChecklistCounts } from "../QuickLaunchChecklist";
import { ProductTour } from "@/components/ui/ProductTour";

interface MemberDashboardProps {
    userId: string;
    userName?: string;
    dailyTasks: any[];
    newLeads: any[];
    newProjects: any[];
    messages: any[];
    userTasksCount: number;
    quickLaunchDismissed?: boolean;
    checklistCounts?: ChecklistCounts;
}

const MemberDashboard = ({
    userId,
    userName,
    dailyTasks,
    newLeads,
    newProjects,
    messages,
    userTasksCount,
    quickLaunchDismissed = false,
    checklistCounts,
}: MemberDashboardProps) => {
    const greeting = useGreeting();
    const router = useRouter();

    // ─── Quick Launch Checklist local state ───
    const [isLocallyDismissed, setIsLocallyDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const locallyDismissed = localStorage.getItem("crm_quick_launch_dismissed_v1") === "true";
        if (locallyDismissed) {
            setIsLocallyDismissed(locallyDismissed);
        }
    }, []);

    // Show the "waiting for assignment" banner when the member has nothing yet
    const hasNoWork = newProjects.length === 0 && newLeads.length === 0 && userTasksCount === 0;

    const isNewishMember =
        !isLocallyDismissed && !quickLaunchDismissed && hasNoWork;

    if (!mounted) return null;

    return (
        <div className="flex flex-col space-y-10 p-4">
            {/* Hero / Focus Section */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4">
                        {greeting}{userName ? `, ${userName}` : ""}
                    </h2>
                </div>
                <p className="text-muted-foreground/80 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                    Here is what's on your plate today.
                </p>

                {/* Quick Launch Checklist — only visible for new members who have no assignments yet */}
                {isNewishMember && checklistCounts && (
                    <div className="mb-8" data-tour-id="tour-checklist">
                        <QuickLaunchChecklist
                            counts={checklistCounts}
                            initiallyDismissed={quickLaunchDismissed}
                        />
                    </div>
                )}

                {/* Waiting-for-assignment banner */}
                {hasNoWork && (
                    <div className="flex items-start gap-3 mb-8 px-4 py-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                        <Inbox className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/70">Waiting for your first assignment</p>
                            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                                Your admin hasn't assigned you to a Campaign or List yet. Once they do, everything will appear here.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/crm/university")}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-all flex-shrink-0"
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Learn the platform
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* The Action Grid - Modern Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <LeadsWidget leads={newLeads} />
                    <TasksWidget tasks={dailyTasks} userId={userId} />
                    <ProjectsWidget projects={newProjects} />
                    <MessagesWidget messages={messages} />
                </div>
            </div>

            {/* Quick Stats Row (Personal Performance) */}
            <div>
                <h3 className="text-lg font-semibold px-1 py-1 mb-4 leading-normal">My Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard
                        icon={Zap}
                        label="Total Active Tasks"
                        count={userTasksCount}
                        variant="violet"
                        description="Across all campaigns"
                        className="h-32"
                    />
                    <DashboardCard
                        icon={Rocket}
                        label="Active Campaigns"
                        count={newProjects.length}
                        variant="default"
                        description="You are a member of"
                        className="h-32"
                    />
                    {/* Placeholder for future Stat */}
                    <div className="h-32 rounded-2xl border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                        More stats coming soon
                    </div>
                </div>
            </div>

            {/* First-login product tour */}
            <ProductTour dismissed={quickLaunchDismissed} />
        </div>
    );
};

export default MemberDashboard;
