import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/campaigns/[sequenceId]/auto-reply
 * Toggles auto-reply on the campaign. When enabling, scans existing threads
 * for unanswered inbound replies and triggers AI auto-replies for them.
 * 
 * Body: { enabled: boolean, max_count?: number, prompt?: string }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ sequenceId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { sequenceId } = await params;
        const body = await req.json();
        const { enabled, max_count, prompt, backfill_only } = body;

        // Verify campaign exists
        const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
            where: { id: sequenceId },
            select: { id: true, team_id: true, auto_reply_enabled: true },
        });

        if (!campaign) {
            return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
        }

        // If backfill_only, skip toggle — just run the scan
        const shouldBackfill = backfill_only
            ? !!campaign.auto_reply_enabled
            : (enabled && !campaign.auto_reply_enabled);

        if (!backfill_only) {
            // Update auto-reply settings
            const updateData: any = {};
            if (typeof enabled === "boolean") updateData.auto_reply_enabled = enabled;
            if (typeof max_count === "number") updateData.auto_reply_max_count = max_count;
            if (typeof prompt === "string") updateData.auto_reply_prompt = prompt || null;

            if (Object.keys(updateData).length > 0) {
                await prismadb.crm_Outreach_Campaigns.update({
                    where: { id: sequenceId },
                    data: updateData,
                });
            }
        }

        let backfillCount = 0;

        // Scan for existing unanswered inbound threads and trigger auto-replies
        if (shouldBackfill) {
            try {
                // Find outreach items that have been replied to but never auto-replied
                // Use NOT > 0 to catch both null and 0 values
                const repliedItems = await prismadb.crm_Outreach_Items.findMany({
                    where: {
                        campaign: sequenceId,
                        status: "REPLIED" as any,
                        NOT: {
                            auto_reply_count: { gt: 0 },
                        },
                    },
                    select: { id: true },
                });

                systemLogger.info(`[AUTO_REPLY_BACKFILL] Found ${repliedItems.length} unreplied items for campaign ${sequenceId}`);

                if (repliedItems.length > 0) {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crm.basalthq.com";

                    // For each unreplied item, find the latest inbound thread and trigger auto-reply
                    for (const item of repliedItems) {
                        const latestInbound = await prismadb.crm_Email_Thread.findFirst({
                            where: {
                                outreach_item: item.id,
                                direction: "INBOUND",
                            },
                            orderBy: { createdAt: "desc" },
                            select: { id: true },
                        });

                        if (latestInbound) {
                            // Fire auto-reply (fire-and-forget)
                            fetch(`${appUrl}/api/outreach/reply`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    outreachItemId: item.id,
                                    inboundThreadId: latestInbound.id,
                                    campaignId: sequenceId,
                                }),
                            }).catch((err) => {
                                systemLogger.error(`[AUTO_REPLY_BACKFILL] Failed for item ${item.id}:`, err);
                            });

                            backfillCount++;
                        }
                    }
                }
            } catch (backfillErr: any) {
                systemLogger.error(`[AUTO_REPLY_BACKFILL] Scan failed for campaign ${sequenceId}:`, backfillErr);
                // Don't fail the whole request — the toggle itself succeeded
            }
        }

        return NextResponse.json({
            status: "ok",
            auto_reply_enabled: enabled ?? campaign.auto_reply_enabled,
            backfill_triggered: backfillCount,
        });
    } catch (error: any) {
        systemLogger.error("[CAMPAIGN_AUTO_REPLY_TOGGLE]", error);
        return NextResponse.json(
            { message: error.message || "Failed to update auto-reply settings" },
            { status: 500 }
        );
    }
}
