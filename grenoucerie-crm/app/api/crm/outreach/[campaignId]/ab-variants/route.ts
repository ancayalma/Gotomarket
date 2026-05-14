import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * A/B Variant CRUD for Outreach Campaigns
 * 
 * GET  /api/crm/outreach/[campaignId]/ab-variants — List variants with stats
 * POST /api/crm/outreach/[campaignId]/ab-variants — Create a new variant
 */

export async function GET(
    req: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { campaignId } = await params;

        const variants = await prismadb.crm_Outreach_AB_Variant.findMany({
            where: { campaign_id: campaignId },
            orderBy: { createdAt: "asc" },
            include: {
                _count: { select: { items: true } },
            },
        });

        // Also fetch campaign-level A/B settings
        const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
            where: { id: campaignId },
            select: {
                ab_enabled: true,
                ab_winner_metric: true,
                ab_winner_variant: true,
                ab_auto_winner_threshold: true,
                ab_decided_at: true,
            },
        });

        return NextResponse.json({ variants, settings: campaign });
    } catch (error) {
        console.error("[AB_VARIANTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { campaignId } = await params;
        const body = await req.json();

        const { name, subject, body_template, body_html, tone, cta_text, cta_url, weight, is_control } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Check existing variant count (max 5)
        const existingCount = await prismadb.crm_Outreach_AB_Variant.count({
            where: { campaign_id: campaignId },
        });
        if (existingCount >= 5) {
            return NextResponse.json({ error: "Maximum 5 variants allowed" }, { status: 400 });
        }

        // If is_control, unset other controls
        if (is_control) {
            await prismadb.crm_Outreach_AB_Variant.updateMany({
                where: { campaign_id: campaignId },
                data: { is_control: false },
            });
        }

        const variant = await prismadb.crm_Outreach_AB_Variant.create({
            data: {
                campaign_id: campaignId,
                name,
                subject,
                body_template,
                body_html,
                tone,
                cta_text,
                cta_url,
                weight: weight || Math.floor(100 / (existingCount + 1)),
                is_control: is_control || existingCount === 0, // First variant is auto-control
            },
        });

        // Auto-enable A/B testing when 2+ variants exist
        if (existingCount >= 1) {
            await prismadb.crm_Outreach_Campaigns.update({
                where: { id: campaignId },
                data: { ab_enabled: true },
            });
        }

        return NextResponse.json(variant);
    } catch (error) {
        console.error("[AB_VARIANTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
