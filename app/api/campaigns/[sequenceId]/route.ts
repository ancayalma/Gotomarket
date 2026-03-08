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
