"use server";

import { prismadb } from "@/lib/prisma";
import { ROLE_CONFIGS, TeamRole } from "@/lib/role-permissions";

export async function getEffectiveRoleModules(teamId: string, role: string, scope: string) {
    try {
        // Check if rolePermission exists (bypassing TS type check which might be stale)
        if (!(prismadb as any).rolePermission) {
            console.error("FATAL: prismadb.rolePermission is undefined!");
            console.error("Prisma Keys:", Object.keys(prismadb));
            return [];
        }

        const permission = await (prismadb as any).rolePermission.findUnique({
            where: {
                team_id_role_scope: {
                    team_id: teamId,
                    role,
                    scope
                }
            }
        });

        let modules: string[] = [];

        if (permission) {
            modules = permission.modules;
        } else {
            // Fallback to defaults
            if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM ADMIN') return ['*'];

            const config = ROLE_CONFIGS[role as Exclude<TeamRole, 'SUPER_ADMIN' | 'PLATFORM_ADMIN'>];
            modules = config ? config.defaultModules : [];
        }

        // If user is in a department, intersect with department's allowed_modules
        if (scope === 'DEPARTMENT' && teamId) {
            try {
                const department = await prismadb.team.findUnique({
                    where: { id: teamId },
                    select: { allowed_modules: true }
                });

                if (department?.allowed_modules && department.allowed_modules.length > 0) {
                    // Intersect: only allow modules that the department has whitelisted
                    modules = modules.filter(m => department.allowed_modules.includes(m));
                }
            } catch (err) {
                console.error("Failed to fetch department allowed_modules:", err);
            }
        }

        return modules;

    } catch (error) {
        console.error("Failed to fetch effective permissions:", error);
        if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM ADMIN') return ['*'];
        const config = ROLE_CONFIGS[role as Exclude<TeamRole, 'SUPER_ADMIN' | 'PLATFORM_ADMIN'>];
        return config ? config.defaultModules : [];
    }
}
