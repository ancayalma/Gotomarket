import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * POST /api/platform/assign-plan
 * Assigns a subscription plan to a team (platform admin only)
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify platform admin
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { is_admin: true, assigned_team: { select: { slug: true } } },
    });

    const INTERNAL_SLUGS = ["basalt", "basalthq", "ledger1"];
    const isAdmin = user?.is_admin || INTERNAL_SLUGS.includes(user?.assigned_team?.slug?.toLowerCase() || "");

    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { teamId, planSlug } = await req.json();

    if (!teamId || !planSlug) {
        return NextResponse.json({ error: "teamId and planSlug required" }, { status: 400 });
    }

    // Update the team's subscription plan
    await prismadb.team.update({
        where: { id: teamId },
        data: { subscription_plan: planSlug },
    });

    return NextResponse.json({ success: true });
}
