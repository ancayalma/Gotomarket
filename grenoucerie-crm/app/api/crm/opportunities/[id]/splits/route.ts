import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/crm/opportunities/[id]/splits
 * List all revenue splits for an opportunity.
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

        const splits = await prismadb.crm_Opportunity_Splits.findMany({
            where: { opportunity_id: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
            orderBy: { split_pct: "desc" },
        });

        return NextResponse.json(splits);
    } catch (error) {
        console.error("[SPLITS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * POST /api/crm/opportunities/[id]/splits
 * Add or update a revenue split. Validates total doesn't exceed 100%.
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

        const { user_id, split_pct, split_type, note } = body;

        if (!user_id || split_pct === undefined) {
            return new NextResponse("user_id and split_pct are required", { status: 400 });
        }

        if (split_pct < 0 || split_pct > 100) {
            return new NextResponse("split_pct must be between 0 and 100", { status: 400 });
        }

        // Get existing splits excluding this user (for validation)
        const existingSplits = await prismadb.crm_Opportunity_Splits.findMany({
            where: {
                opportunity_id: id,
                NOT: { user_id },
            },
        });

        const existingTotal = existingSplits.reduce((sum: number, s: any) => sum + s.split_pct, 0);
        if (existingTotal + split_pct > 100) {
            return new NextResponse(
                `Total split percentage would be ${existingTotal + split_pct}%. Maximum is 100%.`,
                { status: 400 }
            );
        }

        // Get opportunity revenue for credit calculation
        const opportunity = await prismadb.crm_Opportunities.findUnique({
            where: { id },
            select: { expected_revenue: true },
        });
        const revenue_credit = opportunity
            ? (opportunity.expected_revenue * split_pct) / 100
            : 0;

        // Upsert (one user per opportunity)
        const split = await prismadb.crm_Opportunity_Splits.upsert({
            where: {
                opportunity_id_user_id: { opportunity_id: id, user_id },
            },
            create: {
                opportunity_id: id,
                user_id,
                split_pct,
                split_type: split_type || "PRIMARY",
                revenue_credit,
                note: note || null,
            },
            update: {
                split_pct,
                split_type: split_type || undefined,
                revenue_credit,
                note: note || undefined,
            },
        });

        return NextResponse.json(split);
    } catch (error) {
        console.error("[SPLITS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * DELETE /api/crm/opportunities/[id]/splits
 * Remove a split. Expects { splitId } in body.
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
        const { splitId } = body;

        if (!splitId) {
            return new NextResponse("splitId required", { status: 400 });
        }

        await prismadb.crm_Opportunity_Splits.delete({
            where: { id: splitId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SPLITS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
