
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

import ProjectsView from "../projects/_components/ProjectsView";

const CampaignsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) return null;

    return (
        <div className="h-full w-full p-4 md:px-6 lg:px-8">
            <ProjectsView view="campaigns" />

            <div className="mt-12">
                <LearnLink
                    tab="campaigns"
                    overviewTitle="Strategic Outreach Campaigns"
                    overviewWhat="The top-level container for your go-to-market strategies. Campaigns group together specific lead lists, messaging themes, and performance goals."
                    overviewWhy="Random outreach is inefficient. Campaigns provide the structural guardrails to ensure that your sales efforts are aligned with specific business objectives and can be measured for ROI."
                    overviewHow="Click 'New Campaign' to initialize a project. Once created, you can attach lead lists and begin the 'Outreach Campaign Wizard' to synthesize personalized AI messaging."
                />
            </div>
        </div>
    );
};

export default CampaignsPage;
