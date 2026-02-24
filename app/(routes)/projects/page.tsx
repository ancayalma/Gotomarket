import React, { Suspense } from "react";
import Container from "../components/ui/Container";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Session } from "next-auth";

import ProjectDashboardCockpit from "./dashboard/components/ProjectDasboard";
import SuspenseLoading from "@/components/loadings/suspense";
import { prismadb } from "@/lib/prisma";
import { getTasksPastDue } from "@/actions/projects/get-tasks-past-due";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getSections } from "@/actions/projects/get-sections";
import { LearnLink } from "@/components/ui/LearnLink";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus } from "lucide-react";
import NewProjectDialog from "./dialogs/NewProject";
import { ProjectsGrid } from "./components/ProjectsGrid";

export const maxDuration = 300;

const ProjectsPage = async () => {
  const session: Session | null = await getServerSession(authOptions);

  if (!session) return redirect("/sign-in");

  // Check if user is admin (team level) or super admin (platform level)
  const userRecord = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: {
      is_admin: true,
      is_account_admin: true,
      assigned_role: { select: { name: true } },
    },
  });

  const isSuperAdmin = userRecord?.assigned_role?.name === "SuperAdmin";
  const isAdmin = userRecord?.is_admin || userRecord?.is_account_admin;

  // Only admins and super admins can access the full projects overview
  if (!isSuperAdmin && !isAdmin) {
    return redirect("/crm/my-projects");
  }

  // Fetch dashboard data
  const [dashboardData, activeUsers, boards, sections] = await Promise.all([
    getTasksPastDue(),
    getActiveUsers(),
    getBoards(session.user.id!),
    getSections(),
  ]);

  return (
    <Container
      title="Projects Cockpit"
      description={"The command center for your internal initiatives and service delivery."}
    >
      <div className="space-y-10">
        {/* Statistics & Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <ProjectDashboardCockpit
              dashboardData={dashboardData as any}
              users={activeUsers || []}
              boards={boards || []}
              sections={sections || []}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[200px]">
              <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                <FolderKanban className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider">Launch New</h3>
                <p className="text-xs text-muted-foreground">Ready to start something big?</p>
              </div>
              <NewProjectDialog
                customTrigger={
                  <Button className="w-full bg-primary shadow-lg shadow-primary/20 rounded-xl gap-2 py-6 text-lg font-bold">
                    <Plus className="w-5 h-5" />
                    New Project
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* The Sexy Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent tracking-tight uppercase leading-[1.2] py-2">
                Active Boards
              </h2>
              <p className="text-muted-foreground/80 mt-1 text-base font-medium tracking-wide">Your high-velocity delivery centers.</p>
            </div>
          </div>

          <Suspense fallback={<SuspenseLoading />}>
            <ProjectsGrid data={boards || []} />
          </Suspense>
        </div>

        <div className="pt-8">
          <LearnLink
            tab="projects"
            overviewTitle="Projects Cockpit"
            overviewWhat="The strategic command center for all long-running service delivery and internal initiatives. It aggregates individual boards into a unified health view."
            overviewWhy="Running multiple client projects requires high-level visibility into task velocity and past-due items. This cockpit ensures that no project falls behind schedule due to lack of oversight."
            overviewHow="Monitor the 'Tasks Past Due' widget for immediate risks. Use the Board navigation to jump into specific Kanban views, or create new Sections to categorize your growing project portfolio."
          />
        </div>
      </div>
    </Container>
  );
};

export default ProjectsPage;
