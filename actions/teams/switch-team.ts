"use server";

import { cookies } from "next/headers";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";
import { signImpersonatedTeamId } from "@/lib/cookie-utils";
import { logActivityInternal } from "@/actions/audit";

export async function switchTeam(teamId: string | null) {
    try {
        const currentUser = await getCurrentUserTeamId();

        const user = await prismadb.users.findUnique({
            where: { id: currentUser?.userId },
            include: { assigned_team: true }
        });

        if (!user) {
            return { error: "Unauthorized" };
        }

        const isPlatformAdminRole = user.is_admin || user.is_account_admin || ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'OWNER', 'SYSADM', 'PLATFORM ADMIN'].includes(user.team_role?.toUpperCase() || '');
        const isTeamAdminRole = ['ADMIN', 'OWNER'].includes(user.team_role?.toUpperCase() || '');

        let isAuthorized = isPlatformAdminRole;

        if (teamId && !isAuthorized && isTeamAdminRole) {
            if (user.team_id === teamId) {
                isAuthorized = true;
            } else {
                // DOWNWARD traversal: A regular company owner/admin switching to a child department
                const targetTeam = await prismadb.team.findUnique({ where: { id: teamId } });
                if (targetTeam?.parent_id && targetTeam.parent_id === user.team_id) {
                    isAuthorized = true;
                }
            }
        }

        if (teamId && !isAuthorized) {
            return { error: "Unauthorized: You do not have permission to switch to this team." };
        }

        const cookieStore = await cookies();

        if (teamId) {
            const team = await prismadb.team.findUnique({
                where: { id: teamId },
                select: { id: true, name: true }
            });

            if (!team) return { error: "Team not found" };

            const signedToken = await signImpersonatedTeamId(teamId);

            cookieStore.set("impersonated_team_id", signedToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 24
            });
            
            if (currentUser?.userId) {
                await logActivityInternal(currentUser.userId, "UPDATE", "System", `Context switched to team ${team.name} (${teamId})`);
            }

            return { success: true, message: `Switched to ${team.name}` };
        } else {
            // Clear impersonation
            cookieStore.delete("impersonated_team_id");
            
            if (currentUser?.userId) {
                await logActivityInternal(currentUser.userId, "UPDATE", "System", `Exited context switch`);
            }

            return { success: true, message: "Returned to home team" };
        }
    } catch (error) {
        systemLogger.error("[SWITCH_TEAM]", error);
        return { error: "Failed to switch team" };
    }
}

export async function getAvailableContexts() {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { success: false, options: [], currentTeamId: null, isImpersonating: false };

        const user = await prismadb.users.findUnique({
            where: { id: currentUser.userId },
            include: { 
                assigned_team: {
                    select: { id: true, name: true, parent_id: true }
                }
            }
        });

        if (!user || (!user.is_admin && !user.is_account_admin && !['SUPER_ADMIN', 'PLATFORM_ADMIN', 'OWNER', 'SYSADM', 'PLATFORM ADMIN', 'ADMIN'].includes(user.team_role?.toUpperCase() || ''))) {
            return { success: false, options: [], currentTeamId: currentUser.teamId, isImpersonating: false };
        }

        const options: any[] = [];
        const isPlatformAdminOrAccountAdmin = user.is_admin || user.is_account_admin || ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'OWNER', 'SYSADM', 'PLATFORM ADMIN'].includes(user.team_role?.toUpperCase() || '');

        // Always push their home team if it exists
        if (user.assigned_team) {
            options.push({ id: user.assigned_team.id, name: user.assigned_team.name, type: "HOME", isDepartment: !!user.assigned_team.parent_id });

            if (user.assigned_team.parent_id) {
                // They belong to a department. Only allow UPWARD traversal to Company if they have Platform/Account Admin rights.
                if (isPlatformAdminOrAccountAdmin) {
                    const parent = await prismadb.team.findUnique({ where: { id: user.assigned_team.parent_id }, select: { id: true, name: true } });
                    if (parent) {
                        options.push({ id: parent.id, name: parent.name, type: "COMPANY" });
                    }
                }
            } else {
                // They belong to a company. Let them fetch all departments (DOWNWARD traversal) since they are an admin of the parent company.
                const depts = await prismadb.team.findMany({ where: { parent_id: user.assigned_team.id }, select: { id: true, name: true } });
                depts.forEach((d: any) => {
                    options.push({ id: d.id, name: d.name, type: "DEPARTMENT" });
                });
            }
        }

        return { 
            success: true, 
            options, 
            currentTeamId: currentUser.teamId,
            isImpersonating: currentUser.isImpersonating
        };
    } catch {
        return { success: false, options: [], currentTeamId: null, isImpersonating: false };
    }
}
