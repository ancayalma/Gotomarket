import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import SalesCommandDashboard from "./_components/SalesCommandDashboard";
import { SalesCommandProvider } from "./_components/SalesCommandProvider";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { getUnifiedSalesData } from "@/actions/crm/get-unified-sales-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getBoards } from "@/actions/projects/get-boards";
import { getTasks } from "@/actions/projects/get-tasks";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export default async function SalesCommandPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const view = typeof searchParams.view === 'string' ? searchParams.view : undefined;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) return null;

    // Fetch permissions
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_role: true, team_id: true, department_id: true, assigned_modules: true }
    });

    let permissions: string[] = [];
    const isSuperAdmin = user?.team_role === 'SUPER_ADMIN' || user?.team_role === 'OWNER' || user?.team_role === 'PLATFORM_ADMIN';

    if (isSuperAdmin) {
        permissions = ['*'];
    } else if (user) {
        if (user.assigned_modules && user.assigned_modules.length > 0) {
            permissions = user.assigned_modules;
        } else {
            const contextId = user.department_id || user.team_id;
            const scope = user.department_id ? 'DEPARTMENT' : 'ORGANIZATION';
            if (contextId && user.team_role) {
                permissions = await getEffectiveRoleModules(contextId, user.team_role, scope);
            }
        }
    }

    const hasAccess = (perm: string) => isSuperAdmin || permissions.includes('*') || permissions.includes(perm);

    // Basic Module Access Check
    if (!hasAccess('sales_command') && !hasAccess('sales_command.my_command') && !hasAccess('sales_command.team_command')) {
        return (
            <UpgradeGate
                featureId="sales_command"
                title="Sales Command Locked"
                description="Advanced Pipeline Management and Command Centers require a Scale plan or higher."
            >
                <div />
            </UpgradeGate>
        );
    }

    // Data Fetching for Sales Command Provider
    const [unifiedData, leads, crmData, boards, tasks] = await Promise.all([
        getUnifiedSalesData(),
        getLeads(),
        getAllCrmData(),
        getBoards(userId),
        getTasks()
    ]);

    if (!unifiedData) return <div>Failed to load sales data</div>;

    return (
        <PermissionsProvider permissions={permissions} isSuperAdmin={isSuperAdmin}>
            <LearnLink
                tab="sales-command"
                overviewTitle="Sales Command Terminal"
                overviewWhat="A high-velocity mission control center combining lead outreach, pipeline health, and real-time sales performance metrics."
                overviewWhy="Traditional CRM layouts can be fragmented. Sales Command unifies your entire workflow into a single pane of glass, allowing for faster decision making and outreach execution."
                overviewHow="Monitor your daily KPIs, execute lead engagement sequences, and track your active opportunities from the Command Canvas. Use the filters to toggle between Personal and Team-wide performance."
            />
            <SalesCommandProvider
                initialData={unifiedData}
                initialLeads={leads}
                initialCrmData={crmData}
                initialBoards={boards}
                initialTasks={tasks || []}
                isMember={!isSuperAdmin && user?.team_role === 'MEMBER'}
                defaultViewMode={view as any}
            >
                <SalesCommandDashboard />
            </SalesCommandProvider>

        </PermissionsProvider>
    );
}
