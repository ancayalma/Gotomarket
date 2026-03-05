import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { LearnLink } from "@/components/ui/LearnLink";

import { Users, ShieldCheck, UserCheck, Eye, Building2, LayoutDashboard } from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { InviteForm } from "@/app/cms/(dashboard)/users/components/IviteForm";
// import { AdminUserDataTable } from "@/app/cms/(dashboard)/users/table-components/data-table";
// import { columns } from "@/app/cms/(dashboard)/users/table-components/columns";
import { getUsers } from "@/actions/get-users";
import TeamMembersTable from "@/app/(routes)/partners/[teamId]/_components/TeamMembersTable";
import DepartmentsView from "@/app/(routes)/partners/[teamId]/_components/DepartmentsView";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  const activeTab = resolvedSearchParams?.tab === 'departments' ? 'departments' : 'overview';

  if (!teamInfo?.teamId) {
    return (
      <Container title="Administration" description="No organization found.">
        <div className="p-4">You are not assigned to a team.</div>
      </Container>
    );
  }

  const teamId = teamInfo.teamId;

  // Fetch team-specific stats, departments, and team details
  const [rolesData, users, departments, team] = await Promise.all([
    prismadb.users.groupBy({
      by: ['team_role'],
      where: { team_id: teamId },
      _count: true,
    }),
    getUsers(),
    prismadb.team.findMany({
      where: {
        parent_id: teamId,
        team_type: "DEPARTMENT",
      } as any,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            team_role: true,
            avatar: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prismadb.team.findUnique({
      where: { id: teamId },
      select: { slug: true, owner_id: true }
    })
  ]);

  const usersCount = users.length;
  const adminCount = (rolesData as any[]).find(r => r.team_role === 'ADMIN')?._count ?? 0;
  const memberCount = (rolesData as any[]).find(r => r.team_role === 'MEMBER' || r.team_role === null)?._count ?? 0;
  const viewerCount = (rolesData as any[]).find(r => r.team_role === 'VIEWER')?._count ?? 0;

  const role = (teamInfo.teamRole || '').toUpperCase();
  const isSuperAdmin = teamInfo.isGlobalAdmin || ['SUPER_ADMIN', 'OWNER', 'PLATFORM_ADMIN', 'SYSADM', 'PLATFORM ADMIN'].includes(role);

  return (
    <Container
      title="Administration"
      description="Manage your Organization, invite new members, configure user access, and organize your team into departments."
      // action={<SendMailToAll />}
      fluid
    >
      <LearnLink
        tab="admin"
        overviewTitle="System Administration"
        overviewWhat="The core governance panel for your organization. This is where you manage user identities, team permissions, and departmental hierarchies."
        overviewWhy="Centralized control is vital for security and operational clarity. By managing users and departments here, you ensure that every team member has exactly the access they need to perform their role without over-exposing sensitive data."
        overviewHow="Invite new members via the Invite Form, audit your existing user base in the data table, or organize your team structure by creating and managing Departments."
      />
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
            {departments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {departments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={usersCount} icon={Users} />
            <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
            <StatCard label="Members" value={memberCount} icon={UserCheck} />
            <StatCard label="Viewers" value={viewerCount} icon={Eye} />
          </div>

          {/* Users Table */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold uppercase tracking-tight text-primary/80 ml-1">Team Directory</h4>
            <TeamMembersTable
              teamId={teamId}
              teamSlug={team?.slug || ""}
              members={users as any}
              isSuperAdmin={isSuperAdmin}
              isGlobalAdmin={teamInfo.isGlobalAdmin}
              ownerId={team?.owner_id}
            />
          </div>
        </TabsContent>

        <TabsContent value="departments" className="outline-none">
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <DepartmentsView
              teamId={teamId}
              departments={departments as any}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Container>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="p-4 bg-card/50 border border-border rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

