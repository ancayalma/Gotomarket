import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    createLinkedInSequence,
    advanceLinkedInStep,
    getLinkedInSequenceStatus,
    LINKEDIN_TEMPLATES,
} from "@/lib/outreach/linkedin-sequence";

/**
 * LinkedIn Sequence API
 * 
 * GET  /api/crm/outreach/[campaignId]/linkedin — Get sequence status
 * POST /api/crm/outreach/[campaignId]/linkedin — Create sequence for leads
 * PUT  /api/crm/outreach/[campaignId]/linkedin — Advance a step
 */

export async function GET(
    req: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { campaignId } = await params;
        const result = await getLinkedInSequenceStatus(campaignId);

        return NextResponse.json({
            ...result,
            templates: LINKEDIN_TEMPLATES,
        });
    } catch (error) {
        console.error("[LINKEDIN_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { campaignId } = await params;
        const { leads, steps } = await req.json();

        if (!leads?.length || !steps?.length) {
            return NextResponse.json({ error: "Leads and steps are required" }, { status: 400 });
        }

        const result = await createLinkedInSequence(campaignId, leads, steps);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[LINKEDIN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ campaignId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { itemId, outcome } = await req.json();

        if (!itemId || !outcome) {
            return NextResponse.json({ error: "itemId and outcome are required" }, { status: 400 });
        }

        const result = await advanceLinkedInStep(itemId, outcome);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[LINKEDIN_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
