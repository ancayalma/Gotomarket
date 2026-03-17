import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/crm/opportunities/[id]/competitors
 * List all competitors for an opportunity.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const competitors = await prismadb.crm_Opportunity_Competitors.findMany({
            where: { opportunity_id: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(competitors);
    } catch (error) {
        console.error("[COMPETITORS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * POST /api/crm/opportunities/[id]/competitors
 * Add a competitor to an opportunity.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const competitor = await prismadb.crm_Opportunity_Competitors.create({
            data: {
                opportunity_id: id,
                name: body.name,
                website: body.website || null,
                contact_name: body.contact_name || null,
                product: body.product || null,
                strengths: body.strengths || null,
                weaknesses: body.weaknesses || null,
                strategy: body.strategy || null,
                threat_level: body.threat_level || "MEDIUM",
                outcome: body.outcome || "ACTIVE",
                price_position: body.price_position || null,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json(competitor);
    } catch (error) {
        console.error("[COMPETITORS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * DELETE /api/crm/opportunities/[id]/competitors
 * Remove a competitor. Expects { competitorId } in body.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { competitorId } = body;

        if (!competitorId) {
            return new NextResponse("competitorId required", { status: 400 });
        }

        await prismadb.crm_Opportunity_Competitors.delete({
            where: { id: competitorId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COMPETITORS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
