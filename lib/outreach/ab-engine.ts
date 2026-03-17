import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * A/B Testing Engine for Outreach
 * 
 * Handles:
 * - Weighted random variant assignment
 * - Performance metric tracking
 * - Auto-winner selection when threshold is met
 * - Statistical significance calculation
 */

// ── Assign a variant to an outreach item ────────────────────────────────────
export async function assignVariant(campaignId: string): Promise<string | null> {
    const variants = await prismadb.crm_Outreach_AB_Variant.findMany({
        where: { campaign_id: campaignId },
    });

    if (variants.length === 0) return null;
    if (variants.length === 1) return variants[0].id;

    // Check if a winner has already been selected → use it exclusively
    const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
        where: { id: campaignId },
        select: { ab_winner_variant: true },
    });
    if (campaign?.ab_winner_variant) return campaign.ab_winner_variant;

    // Weighted random selection
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
        random -= variant.weight;
        if (random <= 0) return variant.id;
    }

    return variants[0].id; // Fallback
}

// ── Record an event and update variant metrics ──────────────────────────────
export async function recordVariantEvent(
    variantId: string,
    event: "sent" | "opened" | "clicked" | "replied" | "bounced"
) {
    const field = `total_${event}` as const;

    const variant = await prismadb.crm_Outreach_AB_Variant.update({
        where: { id: variantId },
        data: {
            [field]: { increment: 1 },
        },
    });

    // Recompute rates
    const totalSent = field === "total_sent" ? variant.total_sent : variant.total_sent;
    if (totalSent > 0) {
        await prismadb.crm_Outreach_AB_Variant.update({
            where: { id: variantId },
            data: {
                open_rate: (variant.total_opened / totalSent) * 100,
                click_rate: (variant.total_clicked / totalSent) * 100,
                reply_rate: (variant.total_replied / totalSent) * 100,
            },
        });
    }

    // Check for auto-winner
    await checkAutoWinner(variant.campaign_id);
}

// ── Auto-winner selection ───────────────────────────────────────────────────
async function checkAutoWinner(campaignId: string) {
    const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
        where: { id: campaignId },
        select: {
            ab_winner_variant: true,
            ab_winner_metric: true,
            ab_auto_winner_threshold: true,
        },
    });

    // Already decided
    if (campaign?.ab_winner_variant) return;

    const metric = campaign?.ab_winner_metric || "open_rate";
    const threshold = campaign?.ab_auto_winner_threshold || 100;

    const variants = await prismadb.crm_Outreach_AB_Variant.findMany({
        where: { campaign_id: campaignId },
    });

    // All variants must meet the minimum send threshold
    const qualifiedVariants = variants.filter(v => v.total_sent >= threshold);
    if (qualifiedVariants.length < 2) return;

    // Find the best performer
    const sorted = [...qualifiedVariants].sort((a, b) => {
        const aVal = (a as any)[metric] || 0;
        const bVal = (b as any)[metric] || 0;
        return bVal - aVal;
    });

    const winner = sorted[0];
    const runnerUp = sorted[1];

    // Require at least 20% relative improvement over runner-up for significance
    const winnerRate = (winner as any)[metric] || 0;
    const runnerUpRate = (runnerUp as any)[metric] || 0;
    if (runnerUpRate > 0 && (winnerRate - runnerUpRate) / runnerUpRate < 0.2) return;

    // Declare winner
    await prismadb.crm_Outreach_AB_Variant.update({
        where: { id: winner.id },
        data: { is_winner: true },
    });

    await prismadb.crm_Outreach_Campaigns.update({
        where: { id: campaignId },
        data: {
            ab_winner_variant: winner.id,
            ab_decided_at: new Date(),
        },
    });

    systemLogger.info(`[AB_ENGINE] Winner declared for campaign ${campaignId}: variant "${winner.name}" with ${metric}=${winnerRate.toFixed(1)}%`);
}

// ── Get A/B test performance comparison ─────────────────────────────────────
export async function getABTestResults(campaignId: string) {
    const variants = await prismadb.crm_Outreach_AB_Variant.findMany({
        where: { campaign_id: campaignId },
        orderBy: { createdAt: "asc" },
    });

    const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
        where: { id: campaignId },
        select: {
            ab_winner_metric: true,
            ab_winner_variant: true,
            ab_decided_at: true,
            ab_auto_winner_threshold: true,
        },
    });

    const metric = campaign?.ab_winner_metric || "open_rate";

    // Calculate relative lift for each variant against control
    const control = variants.find(v => v.is_control);
    const controlRate = control ? (control as any)[metric] || 0 : 0;

    const results = variants.map(v => ({
        id: v.id,
        name: v.name,
        is_control: v.is_control,
        is_winner: v.is_winner,
        weight: v.weight,
        total_sent: v.total_sent,
        open_rate: v.open_rate,
        click_rate: v.click_rate,
        reply_rate: v.reply_rate,
        total_bounced: v.total_bounced,
        lift: controlRate > 0
            ? (((v as any)[metric] - controlRate) / controlRate * 100).toFixed(1)
            : "N/A",
    }));

    return {
        variants: results,
        winnerMetric: metric,
        winnerId: campaign?.ab_winner_variant,
        decidedAt: campaign?.ab_decided_at,
        threshold: campaign?.ab_auto_winner_threshold,
    };
}
