
import { prismadb } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/config/subscriptions";

/**
 * Manages Lead Generation credits for teams.
 * Credits are "Use-it-or-lose-it" and expire every month.
 * Monthly reset happens based on the team's subscription plan.
 */

export async function getTeamLeadGenCredits(teamId: string) {
    const config = await (prismadb as any).teamAiConfig.findUnique({
        where: { team_id: teamId },
        select: {
            leadgen_credits_balance: true,
            leadgen_credits_last_reset: true
        }
    });

    if (!config) return 0;

    // Check if reset is needed (monthly)
    const now = new Date();
    const lastReset = config.leadgen_credits_last_reset || new Date(0);

    // Simple check: if month or year changed since last reset
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        return await resetLeadGenCredits(teamId);
    }

    return config.leadgen_credits_balance;
}

export async function resetLeadGenCredits(teamId: string) {
    // 1. Fetch team's plan
    const team = await prismadb.team.findUnique({
        where: { id: teamId },
        include: { assigned_plan: true }
    });

    let monthlyAllowance = 100; // Default FREE

    if (team?.assigned_plan) {
        monthlyAllowance = team.assigned_plan.leadgen_credits_monthly || 0;
    } else if (team?.subscription_plan) {
        const plan = SUBSCRIPTION_PLANS[team.subscription_plan as SubscriptionPlanType];
        monthlyAllowance = (plan as any)?.limits?.leadgen_credits || 100;
    }

    // 2. Update config
    const updated = await (prismadb as any).teamAiConfig.upsert({
        where: { team_id: teamId },
        update: {
            leadgen_credits_balance: monthlyAllowance,
            leadgen_credits_last_reset: new Date()
        },
        create: {
            team_id: teamId,
            leadgen_credits_balance: monthlyAllowance,
            leadgen_credits_last_reset: new Date()
        }
    });

    return updated.leadgen_credits_balance;
}

export async function consumeLeadGenCredits(teamId: string, amount: number) {
    const current = await getTeamLeadGenCredits(teamId);

    // -1 signifies unlimited. If we have a negative balance, we are operating in unlimited tracking mode.
    if (current >= 0 && current < amount) {
        throw new Error(`Insufficient LeadGen credits. Required ${amount}, available ${current}.`);
    }

    // For tracking unlimited usage upwards, if current is < 0 (meaning unlimited config mode),
    // we can actually decrement it further (e.g., -100 used). The UI can display this as `used = Math.abs(current)`.
    await prismadb.teamAiConfig.update({
        where: { team_id: teamId },
        data: {
            leadgen_credits_balance: {
                decrement: amount
            }
        }
    });

    return current - amount;
}

export async function addLeadGenCredits(teamId: string, amount: number) {
    // Top-Up logic: Adds to current balance. 
    // Note: These will still "expire" at the end of the month as per "lose it or lose it" rule
    // unless we implement carry-over for purchased credits.
    // For now, following strict "expire every month" as requested.

    await prismadb.teamAiConfig.update({
        where: { team_id: teamId },
        data: {
            leadgen_credits_balance: {
                increment: amount
            }
        }
    });
}
