"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// @ts-ignore
import { SubscriptionPlan } from "@prisma/client";
import { systemLogger } from "@/lib/logger";

export const updateTeam = async (teamId: string, data: { name?: string; slug?: string; owner_id?: string; subscription_plan?: SubscriptionPlan; plan_id?: string; }) => {
    try {
        const currentUser = await getCurrentUserTeamId();
        if (!currentUser?.userId) return { error: "Unauthorized" };

        // Global admins can modify any team; regular admins can only modify their own
        const isGlobalAdmin = currentUser.isGlobalAdmin;
        if (!isGlobalAdmin && (currentUser.teamId !== teamId || !currentUser.isAdmin)) {
            return { error: "Unauthorized: You do not have permission to modify this team." };
        }

        // Check slug uniqueness if changing
        if (data.slug) {
            const existing = await (prismadb as any).team.findFirst({
                where: {
                    slug: data.slug,
                    id: { not: teamId }
                }
            });
            if (existing) {
                return { error: "Slug already exists" };
            }
        }

        const team = await (prismadb as any).team.update({
            where: {
                id: teamId,
            },
            data: {
                ...data
            }
        });

        revalidatePath(`/partners/${teamId}`);
        revalidatePath("/partners");
        return { success: true, team };
    } catch (error) {
        systemLogger.error("[UPDATE_TEAM]", error);
        return { error: "Failed to update team" };
    }
};
