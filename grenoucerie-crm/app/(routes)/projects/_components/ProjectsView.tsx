import React from "react";
import { getServerSession } from "next-auth";

import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getProjectStats } from "@/actions/projects/get-project-stats";
import { Button } from "@/components/ui/button";

import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

import NewTaskDialog from "../dialogs/NewTask";
import NewProjectDialog from "../dialogs/NewProject";
import NewCampaignDialog from "../dialogs/NewCampaign";

import { ProjectsDataTable } from "../table-components/data-table";
import { columns } from "../table-components/columns";
import { FolderPlus, CheckSquare, LayoutGrid, List as ListIcon } from "lucide-react";
import { ProjectCard, ProjectCardData } from "./ProjectCard";
import AiAssistantCardWrapper from "./AiAssistantCardWrapper";
import { ProjectsGrid } from "../components/ProjectsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectsViewProps {
    view?: "overview";
}

const ProjectsView = async ({ view = "overview" }: ProjectsViewProps) => {
    const session = await getServerSession(authOptions);

    if (!session) return null;

    const teamInfo = await getCurrentUserTeamId();
    const users = await getActiveUsers();
    const isGlobalAdmin = teamInfo?.isGlobalAdmin;

    // Fetch ALL boards for now to ensure no data loss
    const allBoards: any = await getBoards(session.user.id!);

    // Filter out internal "Private Reminders" boards from the main views
    const boards = allBoards.filter((b: any) => b.title !== "Private Reminders");

    const stats = await getProjectStats();

    const cards: ProjectCardData[] = [
        {
            title: "New Project",
            description: "Create a new project board",
            icon: FolderPlus,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400"
        },
        {
            title: "New Task",
            description: "Add a task to a project",
            icon: CheckSquare,
            color: "from-orange-500/20 to-red-500/20",
            iconColor: "text-orange-400"
        }
    ];

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 sticky top-0 z-40 pb-4 pt-4 -mt-4">
                <NewProjectDialog
                    customTrigger={<ProjectCard card={cards[0]} />}
                />
                <NewTaskDialog
                    users={users}
                    boards={boards}
                    customTrigger={<ProjectCard card={cards[1]} />}
                />
                <AiAssistantCardWrapper session={session} />
            </div>
            <div className="pt-2 space-y-3">
                <ProjectsDataTable data={boards} columns={columns} stats={stats} />
            </div>
        </>
    );
};

export default ProjectsView;
