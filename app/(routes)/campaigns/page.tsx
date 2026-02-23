
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getProjectStats } from "@/actions/projects/get-project-stats";

import NewProjectDialog from "../projects/dialogs/NewProject";
import CampaignsTableWrapper from "./_components/CampaignsTableWrapper";
import { Target } from "lucide-react";
import { ProjectCard, ProjectCardData } from "../projects/_components/ProjectCard";
import { LearnLink } from "@/components/ui/LearnLink";

const CampaignsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) return null;

    const users = await getActiveUsers();

    let boards: any[] = [];
    let stats: any = { activeTasks: 0, documents: 0 };

    try {
        const rawBoards = await getBoards(session.user.id);
        if (rawBoards && Array.isArray(rawBoards)) {
            boards = JSON.parse(JSON.stringify(rawBoards));
        }
    } catch (error) {
        console.error("Error fetching boards:", error);
    }

    try {
        stats = await getProjectStats();
    } catch (error) {
        console.error("Error fetching project stats:", error);
    }

    const cards: ProjectCardData[] = [
        {
            title: "New Campaign",
            description: "Launch a new strategic campaign",
            icon: Target,
            color: "from-indigo-500/20 to-purple-500/20",
            iconColor: "text-indigo-400"
        },
    ];

    return (
        <div className="h-full w-full p-4 md:px-6 lg:px-8">
            <div className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-muted-foreground">
                    Manage your strategic campaigns, branding, and scope.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 sticky top-0 z-40 pb-4 pt-2">
                <NewProjectDialog
                    entityName="Campaign"
                    apiEndpoint="/api/projects"
                    customTrigger={<ProjectCard card={cards[0]} />}
                />
            </div>

            <div className="pt-2 space-y-3">
                <CampaignsTableWrapper data={boards} stats={stats} />
            </div>

            <LearnLink
                tab="campaigns"
                overviewTitle="Strategic Outreach Campaigns"
                overviewWhat="The top-level container for your go-to-market strategies. Campaigns group together specific lead lists, messaging themes, and performance goals."
                overviewWhy="Random outreach is inefficient. Campaigns provide the structural guardrails to ensure that your sales efforts are aligned with specific business objectives and can be measured for ROI."
                overviewHow="Click 'New Campaign' to initialize a project. Once created, you can attach lead lists and begin the 'Outreach Campaign Wizard' to synthesize personalized AI messaging."
            />
        </div>
    );
};

export default CampaignsPage;
