"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { addLeadGenCredits } from "@/lib/scraper/credits";
import { systemLogger } from "@/lib/logger";

const ONBOARDING_BONUS_CREDITS = 25;
const BONUS_KEY = "onboarding_bonus_claimed";

/**
 * Awards bonus LeadGen credits when a FREE user completes onboarding milestones.
 * 
 * Milestones that trigger the bonus:
 * - Completing the Quick Launch checklist (all 5 steps)
 * - Logging their first call
 * 
 * Rules:
 * - Only awarded ONCE per team (idempotent)
 * - Only for FREE plan users (paid plans already have generous allocations)
 * - Awards 25 bonus credits
 */
export async function claimOnboardingBonus(milestone: string) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;

        if (!user?.id || !user?.team_id) {
            return { success: false, error: "Not authenticated" };
        }

        const teamId = user.team_id;

        // 1. Fetch team to check plan
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            select: { subscription_plan: true, slug: true }
        });

        if (!team) {
            return { success: false, error: "Team not found" };
        }

        // 2. Only award to FREE plan users (paid already have enough)
        // BasaltHQ is exempt/unlimited anyway, skip bonus noise
        if (team.slug === "BasaltHQ" || (team.subscription_plan && team.subscription_plan !== "FREE")) {
            return { success: false, error: "Bonus only available for Free plan users", alreadyPaid: true };
        }

        // 3. Check if bonus was already claimed (idempotent)
        // We store this in TeamAiConfig metadata to avoid schema changes
        const config = await (prismadb as any).teamAiConfig.findUnique({
            where: { team_id: teamId },
            select: { metadata: true }
        });

        const metadata = (config?.metadata as Record<string, any>) || {};
        const bonusKey = `${BONUS_KEY}_${milestone}`;

        if (metadata[bonusKey]) {
            return { success: false, error: "Bonus already claimed for this milestone", alreadyClaimed: true };
        }

        // 4. Award the credits
        await addLeadGenCredits(teamId, ONBOARDING_BONUS_CREDITS);

        // 5. Mark as claimed
        await (prismadb as any).teamAiConfig.update({
            where: { team_id: teamId },
            data: {
                metadata: {
                    ...metadata,
                    [bonusKey]: new Date().toISOString()
                }
            }
        });

        systemLogger.error(`[ONBOARDING_BONUS] Awarded ${ONBOARDING_BONUS_CREDITS} credits to team ${teamId} for milestone: ${milestone}`);

        return {
            success: true,
            creditsAwarded: ONBOARDING_BONUS_CREDITS,
            milestone,
            message: `🎉 You earned ${ONBOARDING_BONUS_CREDITS} bonus LeadGen credits!`
        };
    } catch (error) {
        systemLogger.error("[ONBOARDING_BONUS] Error:", error);
        return { success: false, error: "Failed to claim bonus credits" };
    }
}
