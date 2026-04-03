"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkTeamLimit } from "@/lib/subscription";
import bcrypt from "bcryptjs";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export const updateMemberRole = async (userId: string, role: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const targetUser = await prismadb.users.findUnique({ where: { id: userId } });
        if (!targetUser) return { error: "User not found" };

        const isPlatformAdmin = currentUser.isGlobalAdmin || currentUser.teamRole === "PLATFORM_ADMIN";
        
        const targetTeam = targetUser.team_id ? await prismadb.team.findUnique({ where: { id: targetUser.team_id } }) : null;
        const isChildDepartment = targetTeam?.team_type === "DEPARTMENT" && targetTeam.parent_id === currentUser.teamId;

        if (!isPlatformAdmin && (currentUser.teamId !== targetUser.team_id && !isChildDepartment || !currentUser.isAdmin)) {
            return { error: "Unauthorized: You do not have permission to modify this user." };
        }

        // Security Check: Only existing Platform Admins / Global Admins can assign PLATFORM_ADMIN
        if (role === "PLATFORM_ADMIN") {
            if (!isPlatformAdmin) {
                return { error: "Unauthorized: Only Platform Admins can assign this role." };
            }
        }

        await (prismadb.users as any).update({
            where: { id: userId },
            data: { team_role: role },
        });
        revalidatePath(`/partners`);
        return { success: true };
    } catch (error) {
        systemLogger.error("[UPDATE_MEMBER_ROLE]", error);
        return { error: "Failed to update role" };
    }
};

export const removeMember = async (userId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const targetUser = await prismadb.users.findUnique({ where: { id: userId } });
        if (!targetUser) return { error: "User not found" };

        const isPlatformAdmin = currentUser.isGlobalAdmin || currentUser.teamRole === "PLATFORM_ADMIN";

        const targetTeam = targetUser.team_id ? await prismadb.team.findUnique({ where: { id: targetUser.team_id } }) : null;
        const isChildDepartment = targetTeam?.team_type === "DEPARTMENT" && targetTeam.parent_id === currentUser.teamId;

        if (!isPlatformAdmin && (currentUser.teamId !== targetUser.team_id && !isChildDepartment || !currentUser.isAdmin)) {
            return { error: "Unauthorized: You do not have permission to modify this user." };
        }

        await (prismadb.users as any).update({
            where: { id: userId },
            data: {
                team_id: null,
                team_role: "MEMBER" // Reset role
            },
        });
        return { success: true };
    } catch (error) {
        systemLogger.error("[REMOVE_MEMBER]", error);
        return { error: "Failed to remove member" };
    }
};

export const searchUsers = async (query: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.isAdmin) return []; // Only admins should search for users to add

        const users = await (prismadb.users as any).findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } }
                ],
                // AND: { team_id: null } // Optional: only show unassigned? Or all and let the UI handle moving?
                // For now allow stealing users from other teams (Admin power) or unassigned.
            },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team_id: true
            }
        });
        return users;
    } catch (error) {
        return [];
    }
}


export const addMember = async (teamId: string, userId: string, role: string = "MEMBER") => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const targetTeam = await (prismadb as any).team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });
        if (!targetTeam) return { error: "Team not found" };

        const isPlatformAdmin = currentUser.isGlobalAdmin || currentUser.teamRole === "PLATFORM_ADMIN";
        if (!isPlatformAdmin) {
            // Allow if admin of target team OR admin of parent organization (for departments)
            const isDirectAdmin = currentUser.teamId === teamId && currentUser.isAdmin;
            const isParentAdmin = targetTeam.parent_id === currentUser.teamId && currentUser.isAdmin;
            if (!isDirectAdmin && !isParentAdmin) {
                return { error: "Unauthorized: Admin privileges required for this team." };
            }
        }

        const memberCount = await (prismadb.users as any).count({ where: { team_id: teamId } });

        if (!checkTeamLimit(targetTeam, "max_users", memberCount)) {
            return { error: "Team member limit reached. Upgrade your plan." };
        }

        const targetUser = await (prismadb.users as any).findUnique({ where: { id: userId } });
        if (!targetUser) return { error: "User not found" };

        let updateData: any = {};
        
        const isTargetTopAdmin = targetUser.team_role === "OWNER" || targetUser.team_role === "SUPER_ADMIN" || targetUser.team_role === "ADMIN";
        const isDepartmentTarget = targetTeam.team_type === "DEPARTMENT";
        
        // When adding someone to a department, tag their department_id
        if (isDepartmentTarget) {
            updateData.department_id = teamId;
        }

        // Preserve full organization access for top-level admins assigned to a department
        if (isDepartmentTarget && isTargetTopAdmin && targetUser.team_id === targetTeam.parent_id) {
            // Do NOT overwrite team_id or team_role
        } else {
             // Normal assignment (they lose whatever previous team they had)
             updateData.team_id = teamId;
             updateData.team_role = role;
        }

        await (prismadb.users as any).update({
            where: { id: userId },
            data: updateData
        });
        revalidatePath(`/partners/${teamId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to add member" };
    }
}

export const changePassword = async (userId: string, newPassword: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        const targetUser = await (prismadb.users as any).findUnique({ where: { id: userId } });

        if (!targetUser) return { error: "User not found" };

        // Security Check:
        // 1. Super Admin (Global) can change anyone's password.
        // 2. Team Admin can change password for members of THEIR team.
        const isGlobalAdmin = currentUser?.isGlobalAdmin;
        const isTeamAdmin = currentUser?.teamRole === "ADMIN" || currentUser?.teamRole === "OWNER";
        const isSameTeam = currentUser?.teamId === targetUser.team_id;

        if (!isGlobalAdmin && (!isTeamAdmin || !isSameTeam)) {
            return { error: "Unauthorized: You do not have permission to change this user's password." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await (prismadb.users as any).update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { success: true };
    } catch (error) {
        systemLogger.error("[CHANGE_PASSWORD]", error);
        return { error: "Failed to update password" };
    }
};

export const toggleUserStatus = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const targetUser = await prismadb.users.findUnique({ where: { id: userId } });
        if (!targetUser) return { error: "User not found" };

        const isPlatformAdmin = currentUser.isGlobalAdmin || currentUser.teamRole === "PLATFORM_ADMIN";
        if (!isPlatformAdmin && (currentUser.teamId !== targetUser.team_id || !currentUser.isAdmin)) {
            return { error: "Unauthorized: You do not have permission to modify this user." };
        }

        await (prismadb.users as any).update({
            where: { id: userId },
            data: { userStatus: status },
        });
        return { success: true };
    } catch (error) {
        systemLogger.error("[TOGGLE_USER_STATUS]", error);
        return { error: "Failed to update status" };
    }
};

export const getOrganizationMembers = async (orgId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return [];
        if (currentUser.teamId !== orgId) {
            return []; // Prevent enumerating other org members
        }

        const users = await (prismadb.users as any).findMany({
            where: {
                OR: [
                    { team_id: orgId },
                    { assigned_team: { parent_id: orgId } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team_id: true,
                team_role: true,
                assigned_team: {
                    select: {
                        name: true,
                        team_type: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return users;
    } catch (error) {
        systemLogger.error("[GET_ORG_MEMBERS]", error);
        return [];
    }
};

export const setTeamOwner = async (teamId: string, newOwnerId: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        const isPlatformAdmin = currentUser.isGlobalAdmin || currentUser.teamRole === "PLATFORM_ADMIN";
        
        // Only Global/Platform Admins OR the current Owner can transfer ownership
        // In BasaltCRM, we'll allow owners and super admins to do this.
        const isAdminOrOwner = currentUser.teamRole === "OWNER" || currentUser.teamRole === "SUPER_ADMIN";
        
        if (!isPlatformAdmin && (currentUser.teamId !== teamId || !isAdminOrOwner)) {
            return { error: "Unauthorized: Only the current Owner or Platform Admin can reassign ownership." };
        }

        const team = await prismadb.team.findUnique({ where: { id: teamId } });
        if (!team) return { error: "Team not found" };

        const targetUser = await prismadb.users.findUnique({ where: { id: newOwnerId } });
        if (!targetUser) return { error: "Target user not found" };

        if (targetUser.team_id !== teamId) {
             return { error: "User must be a member of the team to become its owner." };
        }

        // 1. Update the Team's owner_id
        await prismadb.team.update({
            where: { id: teamId },
            data: { owner_id: newOwnerId }
        });

        // 2. Ensure they have the OWNER role
        await prismadb.users.update({
            where: { id: newOwnerId },
            data: { team_role: "OWNER" }
        });

        revalidatePath(`/partners/${teamId}`);
        revalidatePath(`/platform/${teamId}`);
        return { success: true };
    } catch (error) {
        systemLogger.error("[SET_TEAM_OWNER]", error);
        return { error: "Failed to set team owner" };
    }
};
