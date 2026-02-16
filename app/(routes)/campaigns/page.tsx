
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getProjectStats } from "@/actions/projects/get-project-stats";

import NewProjectDialog from "../projects/dialogs/NewProject";
import { ProjectsDataTable } from "../projects/table-components/data-table";
import { columns } from "../projects/table-components/columns"; // Using project columns for now
import { FolderPlus, CheckSquare, Target } from "lucide-react";
import { ProjectCard, ProjectCardData } from "../projects/_components/ProjectCard";
import AiAssistantCardWrapper from "../projects/_components/AiAssistantCardWrapper";

const CampaignsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) return null;

    const users = await getActiveUsers();
    // Fetch boards (campaigns)
    const boards: any = await getBoards(session.user.id);
    const stats = await getProjectStats();

    // Define Campaign Cards
    const cards: ProjectCardData[] = [
        {
            title: "New Campaign",
            description: "Launch a new strategic campaign",
            icon: Target, // Changed to Target icon for Campaigns
            color: "from-indigo-500/20 to-purple-500/20",
            iconColor: "text-indigo-400"
        },
        // We can keep 'New Task' or remove it. Let's keep it but label it relevantly?
        // Actually, tasks are associated with projects.
        // Let's just keep the main 'New Campaign' button prominent.
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
                    customTrigger={<ProjectCard card={cards[0]} />}
                />

                {/* <AiAssistantCardWrapper session={session} /> */}

                {/* Stats or other cards could go here */}
            </div>

            <div className="pt-2 space-y-3">
                {/* Reusing ProjectsDataTable but it handles 'boards' which are campaigns */}
                <ProjectsDataTable data={boards} columns={columns} stats={stats} />
            </div>
        </div>
    );
};

export default CampaignsPage;
