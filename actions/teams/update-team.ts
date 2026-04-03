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

        // ── Auto-sync subscription_plan ↔ plan_id ──
        const updateData: any = { ...data };

        if (data.plan_id) {
            // plan_id changed → resolve the Plan record and sync subscription_plan
            const plan = await prismadb.plan.findUnique({ where: { id: data.plan_id } });
            if (plan) {
                updateData.subscription_plan = plan.slug as any;
            }
        } else if (data.subscription_plan && !data.plan_id) {
            // subscription_plan changed without plan_id → look up Plan by slug
            const plan = await prismadb.plan.findFirst({
                where: { slug: { equals: data.subscription_plan, mode: "insensitive" } }
            });
            if (plan) {
                updateData.plan_id = plan.id;
            }
        }

        const team = await (prismadb as any).team.update({
            where: {
                id: teamId,
            },
            data: updateData,
        });

        // ── Plan changed → top up credits to the new plan's allowances ──
        if (data.plan_id || data.subscription_plan) {
            try {
                const { resetLeadGenCredits } = await import("@/lib/scraper/credits");
                const { resetAiTokenBalance } = await import("@/lib/ai-tokens");
                await resetLeadGenCredits(teamId);
                await resetAiTokenBalance(teamId);
                systemLogger.info("[UPDATE_TEAM] Credits topped up after plan change", { teamId, newPlan: updateData.subscription_plan });
            } catch (err) {
                systemLogger.error("[UPDATE_TEAM] Failed to reset credits after plan change:", err);
                // Non-fatal — the plan was still updated successfully
            }
        }

        revalidatePath(`/partners/${teamId}`);
        revalidatePath("/partners");
        return { success: true, team };
    } catch (error) {
        systemLogger.error("[UPDATE_TEAM]", error);
        return { error: "Failed to update team" };
    }
};
