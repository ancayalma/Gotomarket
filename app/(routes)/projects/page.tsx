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
      title="Projects Overview"
      description={"Welcome to your Projects cockpit. Manage boards, tasks, and deadlines in one place."}
    >
      <LearnLink
        tab="projects"
        overviewTitle="Projects Cockpit"
        overviewWhat="The strategic command center for all long-running service delivery and internal initiatives. It aggregates individual boards into a unified health view."
        overviewWhy="Running multiple client projects requires high-level visibility into task velocity and past-due items. This cockpit ensures that no project falls behind schedule due to lack of oversight."
        overviewHow="Monitor the 'Tasks Past Due' widget for immediate risks. Use the Board navigation to jump into specific Kanban views, or create new Sections to categorize your growing project portfolio."
      />
      <Suspense fallback={<SuspenseLoading />}>
        <ProjectDashboardCockpit
          dashboardData={dashboardData as any}
          users={activeUsers || []}
          boards={boards || []}
          sections={sections || []}
        />
      </Suspense>
    </Container>
  );
};

export default ProjectsPage;
