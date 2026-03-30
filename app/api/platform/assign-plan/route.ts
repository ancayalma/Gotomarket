import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { resetLeadGenCredits } from "@/lib/scraper/credits";
import { resetAiTokenBalance } from "@/lib/ai-tokens";

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

    // Try to find the matching Plan record if it exists in the database
    const dbPlan = await prismadb.plan.findUnique({ 
        where: { slug: planSlug.toLowerCase() } 
    }).catch(() => null);

    // Update the team's subscription plan and assigned_plan_id relation
    await prismadb.team.update({
        where: { id: teamId },
        data: { 
            subscription_plan: planSlug,
            ...(dbPlan?.id ? { assigned_plan_id: dbPlan.id } : {})
        },
    });

    // Reset AI Credits & Tokens to match the new plan's limits
    try {
        await resetLeadGenCredits(teamId);
        await resetAiTokenBalance(teamId);
    } catch (e) {
        console.error("Failed to reset AI credits during plan assignment:", e);
    }

    return NextResponse.json({ success: true });
}
