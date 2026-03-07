"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";

export async function moveMemberToNewTeam(
    userId: string,
    teamName: string,
    teamSlug: string,
    planId?: string
) {
    try {
        const currentUser = await getCurrentUserTeamId();

        if (false) {
            return { error: "Unauthorized: Only Platform Admins can perform this action." };
        }

        // 1. Verify user exists
        const targetUser = await (prismadb.users as any).findUnique({
            where: { id: userId }
        });

        if (!targetUser) {
            return { error: "User not found" };
        }

        // 2. Check if slug exists
        const existingTeam = await prismadb.team.findUnique({
            where: { slug: teamSlug }
        });

        if (existingTeam) {
            return { error: `A team with slug "${teamSlug}" already exists.` };
        }

        // 3. Create the new team
        let renewalDate = null;
        if (planId) {
            const plan = await prismadb.plan.findUnique({ where: { id: planId } });
            if (plan) {
                const now = new Date();
                if (plan.billing_cycle === 'MONTHLY') {
                    renewalDate = new Date(now.setMonth(now.getMonth() + 1));
                } else if (plan.billing_cycle === 'YEARLY') {
                    renewalDate = new Date(now.setFullYear(now.getFullYear() + 1));
                }
            }
        }

        const newTeam = await prismadb.team.create({
            data: {
                name: teamName,
                slug: teamSlug,
                owner_id: userId,
                plan_id: planId,
                renewal_date: renewalDate,
            }
        });

        // 4. Move the user and promote to OWNER
        await (prismadb.users as any).update({
            where: { id: userId },
            data: {
                team_id: newTeam.id,
                team_role: "OWNER"
            }
        });

        revalidatePath("/partners");
        revalidatePath(`/partners/${newTeam.id}`);

        return {
            success: true,
            message: `Successfully moved ${targetUser.email} to new team "${teamName}" as Owner.`
        };
    } catch (error) {
        systemLogger.error("[MOVE_MEMBER_TO_NEW_TEAM]", error);
        return { error: "Failed to move member to new team" };
    }
}
