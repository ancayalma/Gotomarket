import React from "react";
import { getServerSession } from "next-auth";

import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getProjectStats } from "@/actions/projects/get-project-stats";
import { Button } from "@/components/ui/button";

import { authOptions } from "@/lib/auth";

import NewTaskDialog from "../dialogs/NewTask";
import NewProjectDialog from "../dialogs/NewProject";

import { ProjectsDataTable } from "../table-components/data-table";
import { columns } from "../table-components/columns";
import { FolderPlus, CheckSquare, LayoutGrid, List as ListIcon } from "lucide-react";
import { ProjectCard, ProjectCardData } from "./ProjectCard";
import AiAssistantCardWrapper from "./AiAssistantCardWrapper";
import { ProjectsGrid } from "../components/ProjectsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectsViewProps {
    view?: "overview" | "campaigns";
}

const ProjectsView = async ({ view = "overview" }: ProjectsViewProps) => {
    const session = await getServerSession(authOptions);

    if (!session) return null;

    const users = await getActiveUsers();
    // Fetch ALL boards for now to ensure no data loss
    const boards: any = await getBoards(session.user.id!);
    const stats = await getProjectStats();

    const isCampaignsView = view === "campaigns";
    const displayData = boards; // Show everything to prevent "losing" data
    const title = isCampaignsView ? "Strategic Campaigns" : "Delivery Boards";
    const description = isCampaignsView
        ? "Manage your strategic outreach, branding, and go-to-market initiatives."
        : "Manage your internal initiatives and service delivery projects.";
    const entityLabel = isCampaignsView ? "Campaign" : "Project";

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

    if (isCampaignsView) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent tracking-tight uppercase leading-[1.2] py-2">
                            {title}
                        </h2>
                        <p className="text-muted-foreground/80 mt-1 text-base font-medium tracking-wide">
                            {description}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NewProjectDialog
                            entityName={entityLabel}
                            customTrigger={
                                <Button className="gap-2 bg-primary shadow-lg shadow-primary/20">
                                    <FolderPlus className="w-4 h-4" />
                                    New {entityLabel}
                                </Button>
                            }
                        />
                    </div>
                </div>

                <Tabs defaultValue="grid" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="bg-background/50 border border-primary/10 rounded-xl p-1">
                            <TabsTrigger value="grid" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors">
                                <LayoutGrid className="w-4 h-4" />
                                Grid
                            </TabsTrigger>
                            <TabsTrigger value="list" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors">
                                <ListIcon className="w-4 h-4" />
                                List
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="grid" className="mt-0 outline-none">
                        <ProjectsGrid data={displayData} />
                    </TabsContent>
                    <TabsContent value="list" className="mt-0 outline-none">
                        <div className="rounded-3xl border border-primary/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                            <ProjectsDataTable data={displayData} columns={columns} stats={stats} entityName="Campaigns" />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

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
