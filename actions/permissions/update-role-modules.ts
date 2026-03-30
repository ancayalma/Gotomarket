"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getSubscriptionPlan } from "@/lib/subscription";

export async function updateRoleModules(
    teamId: string,
    role: string,
    scope: string, // 'ORGANIZATION' | 'DEPARTMENT'
    modules: string[]
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        // Verify Actor is Admin
        const currentUser = await prismadb.users.findUnique({
            where: { email: session.user.email },
            include: {
                assigned_team: {
                    include: { assigned_plan: true }
                }
            }
        });

        const isSuper = currentUser?.team_role === 'SUPER_ADMIN' || currentUser?.team_role === 'OWNER' || session.user.isAdmin;

        if (!isSuper) {
            return { error: "Permission Denied: Only Super Admins can manage roles." };
        }

        // Validate parentLimits so that they can't force-feed modules they don't pay for
        // Calculate Parent Limits for the organization
        const orgTeam = currentUser?.assigned_team as any;
        const planSlug = orgTeam?.assigned_plan?.slug || orgTeam?.subscription_plan || "FREE";
        let parentLimits = getSubscriptionPlan(planSlug)?.features || [];
        
        if (orgTeam?.assigned_plan?.features) {
            parentLimits = Array.from(new Set([...orgTeam.assigned_plan.features, ...parentLimits]));
        }
        if (orgTeam?.module_overrides) {
            parentLimits = Array.from(new Set([...parentLimits, ...(orgTeam.module_overrides as any[] || [])]));
        }

        const isPlatformSuperAdmin = parentLimits.includes('all');
        let finalModules = modules;

        if (!isPlatformSuperAdmin) {
            finalModules = modules.filter(m => parentLimits.includes(m) || parentLimits.includes(`${m}.view`));
        }

        // Upsert permission configuration
        await prismadb.rolePermission.upsert({
            where: {
                team_id_role_scope: {
                    team_id: teamId,
                    role,
                    scope
                }
            },
            update: {
                modules: finalModules,
            },
            create: {
                team_id: teamId,
                role,
                scope,
                modules: finalModules,
            }
        });

        revalidatePath("/admin/modules");
        return { success: true };

    } catch (error) {
        console.error("Failed to update role modules:", error);
        return { error: "Internal Server Error" };
    }
}
