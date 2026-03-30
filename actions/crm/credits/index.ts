"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getTeamLeadGenCredits } from "@/lib/scraper/credits";
import { getTeamAiTokenBalance } from "@/lib/ai-tokens";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, resolveSlug } from "@/config/subscriptions";
import { resolveBillingTeamId } from "@/lib/team-billing";

export async function getTeamCreditsInfo() {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        let teamId = user?.team_id;

        if (!teamId) {
            return {
                currentBalance: 0,
                monthlyLimit: 0,
                isUnlimited: false,
                aiTokensBalance: 0,
                aiTokensLimit: 0,
            };
        }

        teamId = await resolveBillingTeamId(teamId);

        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });

        if (!team) {
            return {
                currentBalance: 0,
                monthlyLimit: 0,
                isUnlimited: false,
                aiTokensBalance: 0,
                aiTokensLimit: 0,
            };
        }

        // 1. Get current balances (this handles resets automatically)
        const currentBalance = await getTeamLeadGenCredits(teamId);
        const aiTokensBalance = await getTeamAiTokenBalance(teamId);

        // 2. Get the assigned limit
        let monthlyLimit = 0;
        let aiTokensLimit = 0;
        let isUnlimited = false;

        // If BasaltHQ slug or system exempt, infinite limits
        if (team.slug === "BasaltHQ" || team.subscription_plan === "EXEMPT") {
            isUnlimited = true;
            monthlyLimit = 999999;
            aiTokensLimit = 999999999;
        } else if (team.assigned_plan) {
            monthlyLimit = team.assigned_plan.leadgen_credits_monthly || 0;
            aiTokensLimit = (team.assigned_plan as any).ai_tokens_included || 0;
            
            // Fallback to config constants if DB limits are missing or 0
            if (monthlyLimit === 0 || aiTokensLimit === 0) {
                const configPlan = SUBSCRIPTION_PLANS[resolveSlug(team.assigned_plan.slug)];
                if (configPlan?.limits) {
                    if (monthlyLimit === 0) monthlyLimit = configPlan.limits.leadgen_credits || 100;
                    if (aiTokensLimit === 0) aiTokensLimit = (configPlan.limits as any).ai_tokens || 0;
                }
            }
            if (monthlyLimit === -1 || aiTokensLimit === -1) isUnlimited = true;
        } else if (team.subscription_plan) {
            const plan = SUBSCRIPTION_PLANS[resolveSlug(team.subscription_plan)];
            monthlyLimit = plan?.limits?.leadgen_credits || 100;
            aiTokensLimit = (plan?.limits as any)?.ai_tokens || 0;
            if (monthlyLimit === -1 || aiTokensLimit === -1) isUnlimited = true;
        }

        let used = 0;
        let remaining = 0;

        if (isUnlimited) {
            used = currentBalance < 0 ? Math.abs(currentBalance + 1) : 0;
            remaining = -1; // unlimited
        } else {
            remaining = currentBalance;
            used = monthlyLimit - currentBalance;
            if (used < 0) used = 0; 
        }

        return {
            teamSlug: team.slug,
            currentBalance,
            monthlyLimit,
            isUnlimited,
            used,
            remaining,
            displayString: isUnlimited ? `${used} / Unlimited` : `${remaining} / ${monthlyLimit}`,
            aiTokensBalance,
            aiTokensLimit,
        };
    } catch (error) {
        console.error("Failed to fetch credits info:", error);
        return {
            currentBalance: 0,
            monthlyLimit: 0,
            isUnlimited: false,
            aiTokensBalance: 0,
            aiTokensLimit: 0,
        };
    }
}
