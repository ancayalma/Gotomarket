
import { prismadb } from "@/lib/prisma";
import { resolveBillingTeamId } from "@/lib/team-billing";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType, resolveSlug } from "@/config/subscriptions";

/**
 * AI Token Balance Service
 * 
 * Manages per-team AI token balances with monthly auto-refill and top-up support.
 * Follows the same pattern as lib/scraper/credits.ts (leadgen credits).
 * 
 * Balance rules:
 * - Tokens refill from plan allowance at the start of each month (use-it-or-lose-it)
 * - Top-ups add to the current balance (don't carry over after monthly reset)
 * - A balance of -1 means UNLIMITED (Enterprise / Exempt tiers)
 */

// ---------------------------------------------------------------------------
// Get Balance (with auto-reset)
// ---------------------------------------------------------------------------

export async function getTeamAiTokenBalance(teamId: string): Promise<number> {
    teamId = await resolveBillingTeamId(teamId);
    const config = await (prismadb as any).teamAiConfig.findUnique({
        where: { team_id: teamId },
        select: {
            ai_token_balance: true,
            ai_tokens_last_reset: true,
        },
    });

    if (!config) {
        return await resetAiTokenBalance(teamId);
    }

    // -1 means unlimited — no reset needed
    if (config.ai_token_balance < 0) return -1;

    // Check if monthly reset is needed
    const now = new Date();
    const lastReset = config.ai_tokens_last_reset || new Date(0);

    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        return await resetAiTokenBalance(teamId);
    }

    return config.ai_token_balance;
}

// ---------------------------------------------------------------------------
// Monthly Reset
// ---------------------------------------------------------------------------

export async function resetAiTokenBalance(teamId: string): Promise<number> {
    teamId = await resolveBillingTeamId(teamId);
    // 1. Determine monthly allowance from plan
    const team = await prismadb.team.findUnique({
        where: { id: teamId },
        include: { assigned_plan: true },
    });

    let monthlyAllowance = 0;

    if (team?.assigned_plan) {
        // Use the Plan model's ai_tokens_included field
        monthlyAllowance = (team.assigned_plan as any).ai_tokens_included || 0;
        // Fallback to config if DB record is 0 or missing
        if (monthlyAllowance === 0) {
            const planSlugKey = resolveSlug(team.assigned_plan.slug);
            const plan = SUBSCRIPTION_PLANS[planSlugKey];
            if (plan?.limits) {
                monthlyAllowance = (plan.limits as any).ai_tokens || 0;
            }
        }
    } else if (team?.subscription_plan) {
        // Fallback to config constants
        const plan = SUBSCRIPTION_PLANS[team.subscription_plan as SubscriptionPlanType];
        monthlyAllowance = (plan as any)?.limits?.ai_tokens || 0;
    }

    // -1 = unlimited
    if (monthlyAllowance < 0) {
        await (prismadb as any).teamAiConfig.upsert({
            where: { team_id: teamId },
            update: {
                ai_token_balance: -1,
                ai_tokens_last_reset: new Date(),
            },
            create: {
                team_id: teamId,
                ai_token_balance: -1,
                ai_tokens_last_reset: new Date(),
            },
        });
        return -1;
    }

    // 2. Reset balance to plan allowance
    const updated = await (prismadb as any).teamAiConfig.upsert({
        where: { team_id: teamId },
        update: {
            ai_token_balance: monthlyAllowance,
            ai_tokens_last_reset: new Date(),
        },
        create: {
            team_id: teamId,
            ai_token_balance: monthlyAllowance,
            ai_tokens_last_reset: new Date(),
        },
    });

    return updated.ai_token_balance;
}

// ---------------------------------------------------------------------------
// Consume Tokens
// ---------------------------------------------------------------------------

export async function consumeAiTokens(teamId: string, amount: number): Promise<number> {
    if (amount <= 0) return 0;
    teamId = await resolveBillingTeamId(teamId);
    const current = await getTeamAiTokenBalance(teamId);

    // -1 = unlimited (superadmin / enterprise) — log but don't decrement
    if (current < 0) {
        return -1;
    }

    if (current < amount) {
        throw new Error(`Insufficient AI tokens. Required ${amount}, available ${current}.`);
    }

    await (prismadb as any).teamAiConfig.update({
        where: { team_id: teamId },
        data: {
            ai_token_balance: {
                decrement: amount,
            },
        },
    });

    return current - amount;
}

// ---------------------------------------------------------------------------
// Top-Up
// ---------------------------------------------------------------------------

export async function topUpAiTokens(teamId: string, amount: number): Promise<void> {
    await (prismadb as any).teamAiConfig.upsert({
        where: { team_id: teamId },
        update: {
            ai_token_balance: {
                increment: amount,
            },
        },
        create: {
            team_id: teamId,
            ai_token_balance: amount,
            ai_tokens_last_reset: new Date(),
        },
    });
}
