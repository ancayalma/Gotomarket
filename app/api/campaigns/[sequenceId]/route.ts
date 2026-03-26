import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm as prisma } from "@/lib/prisma-crm";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/campaigns/[sequenceId]
 * Fetches a single campaign by ID with full details
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ sequenceId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { sequenceId } = await params;

        const campaign = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id: sequenceId },
            include: {
                assigned_user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                assigned_pool: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assigned_project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                outreach_items: {
                    select: {
                        id: true,
                        status: true,
                        channel: true,
                        auto_reply_count: true,
                        lead: true,
                        account_id: true,
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json(
                { message: "Campaign not found" },
                { status: 404 }
            );
        }

        // ── Self-correcting progress reconciliation ─────────────────────────
        let items = campaign.outreach_items || [];

        // Step 1: Delete duplicate empty shells from campaign wizard creation.
        // The wizard pre-creates PENDING items with only lead+channel,
        // then the send route creates NEW fully-populated items with candidate_email.
        // The empty shells are duplicates that show as "Unknown".
        const emptyShells = items.filter((i: any) =>
            !i.candidate_email && !i.sentAt && (i.status === "PENDING" || i.status === "SKIPPED")
        );
        if (emptyShells.length > 0) {
            const emptyIds = emptyShells.map((i: any) => i.id);
            await prisma.crm_Outreach_Items.deleteMany({
                where: { id: { in: emptyIds } },
            }).catch(() => {});
            // Remove from local list
            items = items.filter((i: any) => !emptyIds.includes(i.id));
            (campaign as any).outreach_items = items;
        }

        // Step 2: Count actual statuses
        const sentStatuses = new Set(["SENT", "OPENED", "CLICKED", "REPLIED", "BOUNCED", "DELIVERED"]);
        const nonPendingStatuses = new Set(["SENT", "OPENED", "CLICKED", "REPLIED", "BOUNCED", "DELIVERED", "FAILED", "SKIPPED"]);
        const actualSent = items.filter((i: any) => sentStatuses.has(i.status)).length;
        const actualReplied = items.filter((i: any) => i.status === "REPLIED").length;
        const actualPending = items.filter((i: any) => i.status === "PENDING" || i.status === "RESEARCHING" || i.status === "READY").length;
        const actualProcessed = items.filter((i: any) => nonPendingStatuses.has(i.status)).length;

        // Step 3: Reconcile campaign counters
        const patchData: any = {};
        if (items.length > 0 && campaign.total_leads !== items.length) {
            patchData.total_leads = items.length;
        }
        if (actualSent > campaign.emails_sent) patchData.emails_sent = actualSent;
        if (actualReplied > campaign.emails_replied) patchData.emails_replied = actualReplied;

        if (Object.keys(patchData).length > 0) {
            await prisma.crm_Outreach_Campaigns.update({
                where: { id: sequenceId },
                data: patchData,
            }).catch(() => {});

            if (patchData.total_leads) (campaign as any).total_leads = patchData.total_leads;
            if (patchData.emails_sent) (campaign as any).emails_sent = patchData.emails_sent;
            if (patchData.emails_replied) (campaign as any).emails_replied = patchData.emails_replied;
        }

        // Step 4: Mark remaining legitimate PENDING items as SKIPPED when campaign is done
        const campaignIsDone = campaign.status === "COMPLETED" || campaign.status === "PAUSED";
        const sendingIsStale = actualPending > 0 && actualProcessed > 0 && actualSent >= (items.length - actualPending);
        if (actualPending > 0 && (campaignIsDone || sendingIsStale)) {
            const pendingIds = items
                .filter((i: any) => i.status === "PENDING" || i.status === "RESEARCHING" || i.status === "READY")
                .map((i: any) => i.id);
            if (pendingIds.length > 0) {
                await prisma.crm_Outreach_Items.updateMany({
                    where: { id: { in: pendingIds } },
                    data: {
                        status: "SKIPPED" as any,
                        error_message: "Skipped — campaign send completed or stopped before this item was processed.",
                    },
                }).catch(() => {});
                for (const item of items) {
                    if (pendingIds.includes((item as any).id)) {
                        (item as any).status = "SKIPPED";
                    }
                }
            }
        }

        // Step 5: Auto-complete ACTIVE campaign when all items are processed
        if (campaign.status === "ACTIVE" && items.length > 0 && actualProcessed >= items.length) {
            await prisma.crm_Outreach_Campaigns.update({
                where: { id: sequenceId },
                data: { status: "COMPLETED" as any },
            }).catch(() => {});
            (campaign as any).status = "COMPLETED";
        }

        return NextResponse.json(campaign);
    } catch (error: any) {
        systemLogger.error("[CAMPAIGN_GET_BY_ID]", error);
        return NextResponse.json(
            { message: error.message || "Failed to fetch campaign" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/campaigns/[sequenceId]
 * Updates campaign status (stop, pause, resume).
 * Body: { status: "PAUSED" | "ACTIVE" | "COMPLETED" }
 */
export async function PATCH(
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
        const { status } = body;

        const validStatuses = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const campaign = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id: sequenceId },
            select: { id: true, status: true, user: true },
        });

        if (!campaign) {
            return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
        }

        const updated = await prisma.crm_Outreach_Campaigns.update({
            where: { id: sequenceId },
            data: { status: status as any },
        });

        systemLogger.info(`[CAMPAIGN_STATUS] Campaign ${sequenceId} status changed: ${campaign.status} → ${status} by user ${session.user.id}`);

        // If pausing, also cancel any pending CRON jobs
        if (status === "PAUSED") {
            const cronResult = await prisma.crm_Cron_Jobs.updateMany({
                where: {
                    campaign_id: sequenceId,
                    status: { not: "COMPLETED" as any },
                },
                data: { status: "PAUSED" as any },
            });
            systemLogger.info(`[CAMPAIGN_STATUS] Paused ${cronResult.count} cron jobs for campaign ${sequenceId}`);
        }

        return NextResponse.json({
            status: "ok",
            campaign_status: status,
            previous_status: campaign.status,
        });
    } catch (error: any) {
        systemLogger.error("[CAMPAIGN_STATUS_UPDATE]", error);
        return NextResponse.json(
            { message: error.message || "Failed to update campaign status" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/campaigns/[sequenceId]
 * Deletes a campaign, resets associated leads, removes outreach items, cancels CRON jobs
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ sequenceId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { sequenceId } = await params;

        // Verify campaign exists and belongs to user
        const campaign = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id: sequenceId },
            select: { id: true, user: true, team_id: true },
        });

        if (!campaign) {
            return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
        }

        // Only the campaign owner or team admin can delete
        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { id: true, team_id: true, is_admin: true, is_account_admin: true },
        });

        if (campaign.user !== session.user.id && !user?.is_admin && !user?.is_account_admin) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // 1. Get all outreach items to find affected leads
        const outreachItems = await prisma.crm_Outreach_Items.findMany({
            where: { campaign: sequenceId },
            select: { id: true, lead: true },
        });

        const leadIds = Array.from(new Set(outreachItems.map((i: any) => i.lead).filter(Boolean))) as string[];

        // 2. Delete all outreach items for this campaign
        await prisma.crm_Outreach_Items.deleteMany({
            where: { campaign: sequenceId },
        });

        systemLogger.info(`[CAMPAIGN_DELETE] Deleted ${outreachItems.length} outreach items for campaign ${sequenceId}`);

        // 3. Reset leads that were part of this campaign
        if (leadIds.length > 0) {
            await prisma.crm_Leads.updateMany({
                where: { id: { in: leadIds } },
                data: {
                    outreach_status: "IDLE" as any,
                    outreach_sent_at: null,
                    outreach_opened_at: null,
                    outreach_meeting_booked_at: null,
                    outreach_first_message_id: null,
                    outreach_open_token: null,
                    pipeline_stage: "Identify" as any,
                },
            });
            systemLogger.info(`[CAMPAIGN_DELETE] Reset ${leadIds.length} leads for campaign ${sequenceId}`);
        }

        // 4. Cancel all CRON jobs linked to this campaign
        const cronResult = await prisma.crm_Cron_Jobs.updateMany({
            where: { campaign_id: sequenceId, status: { not: "COMPLETED" as any } },
            data: { status: "COMPLETED" as any },
        });

        systemLogger.info(`[CAMPAIGN_DELETE] Cancelled ${cronResult.count} cron jobs for campaign ${sequenceId}`);

        // 5. Delete the campaign record
        await prisma.crm_Outreach_Campaigns.delete({
            where: { id: sequenceId },
        });

        systemLogger.info(`[CAMPAIGN_DELETE] Successfully deleted campaign ${sequenceId}`);

        return NextResponse.json({
            message: "Campaign deleted",
            cleaned: {
                outreachItems: outreachItems.length,
                leadsReset: leadIds.length,
                cronJobsCancelled: cronResult.count,
            },
        });
    } catch (error: any) {
        systemLogger.error("[CAMPAIGN_DELETE]", error);
        return NextResponse.json(
            { message: error.message || "Failed to delete campaign" },
            { status: 500 }
        );
    }
}
