import CrmSidebar from "./components/CrmSidebar";
import UtilityBar from "@/components/UtilityBar";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { systemLogger } from "@/lib/logger";

export default async function CrmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    let allowedModules: string[] = [];
    let isMember = false;
    let isSuperAdmin = false;
    let user = null;

    if (session?.user?.id) {
        user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                team_role: true,
                team_id: true,
                department_id: true,
                assigned_modules: true, // Capture override if exists
                is_admin: true,
                email: true
            }
        });

        isMember = user?.team_role === "MEMBER";

        const role = (user?.team_role || '').trim().toUpperCase();
        // PLATFORM_ADMIN and OWNER are the highest tiers in the system, superseding the basic is_admin flag.
        const isHighestTier = ['PLATFORM_ADMIN', 'OWNER', 'SUPER_ADMIN', 'PLATFORM ADMIN', 'SYSADM'].includes(role);
        
        // isSuperAdmin determines if the user gets wildcard access to all modules
        isSuperAdmin = isHighestTier || (user as any)?.is_admin === true || role === 'ADMIN';

        if (isSuperAdmin) {
            allowedModules = ['*'];
        } else if (user) {
            // Check specific assignments first
            if (user.assigned_modules && user.assigned_modules.length > 0) {
                allowedModules = user.assigned_modules;
            } else {
                // Fetch Role Permissions
                const contextId = user.department_id || user.team_id;
                const scope = user.department_id ? 'DEPARTMENT' : 'ORGANIZATION';

                if (contextId && user.team_role) {
                    allowedModules = await getEffectiveRoleModules(contextId, user.team_role, scope);
                }
            }

            // If user is in a department, intersect with department's allowed_modules
            if (user.department_id && allowedModules.length > 0 && !allowedModules.includes('*')) {
                try {
                    const dept = await prismadb.team.findUnique({
                        where: { id: user.department_id },
                        select: { allowed_modules: true }
                    });
                    if (dept?.allowed_modules && dept.allowed_modules.length > 0) {
                        allowedModules = allowedModules.filter(m => dept.allowed_modules.includes(m));
                    }
                } catch {}
            }
        }

        systemLogger.info('[CRM LAYOUT] Module resolution:', {
            userId: session.user.id,
            teamRole: user?.team_role,
            isSuperAdmin,
            allowedModulesCount: allowedModules.length,
        });
    }

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            <CrmSidebar />
            <div className="flex-1 min-h-0 min-w-0 flex flex-col relative transition-colors duration-300">
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <PermissionsProvider permissions={allowedModules} isSuperAdmin={isSuperAdmin}>
                        {children}
                    </PermissionsProvider>
                </div>
            </div>
        </div>
    );
}
