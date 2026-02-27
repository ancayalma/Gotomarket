"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getTeamLeadGenCredits } from "@/lib/scraper/credits";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/config/subscriptions";

export async function getTeamCreditsInfo() {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        const teamId = user?.team_id;

        if (!teamId) {
            return {
                currentBalance: 0,
                monthlyLimit: 0,
                isUnlimited: false
            };
        }

        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });

        if (!team) {
            return {
                currentBalance: 0,
                monthlyLimit: 0,
                isUnlimited: false
            };
        }

        // 1. Get current balance (this handles resets automatically)
        const currentBalance = await getTeamLeadGenCredits(teamId);

        // 2. Get the assigned limit
        let monthlyLimit = 0;
        let isUnlimited = false;

        // If BasaltHQ slug or system exempt, infinite limits
        if (team.slug === "BasaltHQ" || team.subscription_plan === "EXEMPT") {
            isUnlimited = true;
            monthlyLimit = 999999;
        } else if (team.assigned_plan) {
            monthlyLimit = team.assigned_plan.leadgen_credits_monthly || 0;
            if (monthlyLimit === -1) isUnlimited = true;
        } else if (team.subscription_plan) {
            const plan = SUBSCRIPTION_PLANS[team.subscription_plan as SubscriptionPlanType];
            monthlyLimit = plan?.limits?.leadgen_credits || 100;
            if (monthlyLimit === -1) isUnlimited = true;
        }

        // Return current remaining and the total limit
        // Wait, if monthlyLimit = 100, and currentBalance = 100 on reset.
        // As they are used, currentBalance goes down. So usage = monthlyLimit - currentBalance.
        // It says "LeadGen Credits: X / Y". Meaning remaining / limit, or used / limit?
        // Usually, SaaS shows remaining / total or used / total. Let's send both.

        // Calculate what to display
        // If unlimited, currentBalance starts at -1 and goes down. -1 used = 0 usage. -5 = 4 usage.
        let used = 0;
        let remaining = 0;

        if (isUnlimited) {
            used = currentBalance < 0 ? Math.abs(currentBalance + 1) : 0;
            remaining = -1; // unlimited
        } else {
            // For standard plans, balance is what remains.
            remaining = currentBalance;
            used = monthlyLimit - currentBalance;
            if (used < 0) used = 0; // fallback if somehow balance > limit
        }

        return {
            teamSlug: team.slug,
            currentBalance,
            monthlyLimit,
            isUnlimited,
            used,
            remaining,
            displayString: isUnlimited ? `${used} / Unlimited` : `${remaining} / ${monthlyLimit}`
        };
    } catch (error) {
        console.error("Failed to fetch credits info:", error);
        return {
            currentBalance: 0,
            monthlyLimit: 0,
            isUnlimited: false
        };
    }
}
