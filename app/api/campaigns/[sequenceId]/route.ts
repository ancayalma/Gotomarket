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
