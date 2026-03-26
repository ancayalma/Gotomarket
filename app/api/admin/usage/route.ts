import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { resolveSlug, SUBSCRIPTION_PLANS } from "@/config/subscriptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
        return NextResponse.json({ error: "teamId required" }, { status: 400 });
    }

    // Verify the requesting user belongs to this team AND is admin
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_id: true, is_admin: true, is_account_admin: true },
    });

    if (!user || (user.team_id !== teamId && !user.is_admin)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the team's subscription plan for limits
    const team = await prismadb.team.findUnique({
        where: { id: teamId },
        select: { subscription_plan: true },
    });

    const slug = resolveSlug(team?.subscription_plan);
    const planLimits = SUBSCRIPTION_PLANS[slug].limits;

    // Get current month's quota record
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const quota = await (prismadb as any).teamUsageQuota.findFirst({
        where: {
            team_id: teamId,
            period_start: { gte: monthStart },
        },
        orderBy: { period_start: "desc" },
    });

    // Get AI token usage for this month from AiUsageLog
    const aiLogs = await prismadb.crm_AiUsageLog.aggregate({
        where: {
            team_id: teamId,
            created_at: { gte: monthStart },
        },
        _sum: {
            total_tokens: true,
        },
    });

    return NextResponse.json({
        email: {
            used: quota?.emails_sent ?? 0,
            limit: planLimits.emails_per_month,
        },
        sms: {
            used: quota?.sms_sent ?? 0,
            limit: planLimits.sms_per_month,
        },
        voice: {
            used: quota?.voice_minutes_used ?? 0,
            limit: planLimits.voice_minutes_per_month,
        },
        ai_tokens: {
            used: aiLogs._sum.total_tokens ?? 0,
            limit: planLimits.ai_tokens,
        },
    });
}
