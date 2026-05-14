
"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSalesAnalytics() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    // 1. Get all active and closed opportunities
    const opportunities = await prismadb.crm_Opportunities.findMany({
        where: { team_id: session.user.id }, // Note: Adjust team_id logic based on how team scope works
        include: {
            assigned_sales_stage: true,
            assigned_to_user: true
        }
    });

    // Note: If team_id in model relates to the team record, we should use session.user.team_id
    // Correcting for the fact that session usually has team context.
    // Fetch user again to get team_id if not in session.
    const user = await prismadb.users.findUnique({ where: { id: session.user.id } });
    const teamId = user?.team_id;

    if (!teamId) return null;

    const allTeamOpps = await prismadb.crm_Opportunities.findMany({
        where: { team_id: teamId },
        include: {
            assigned_sales_stage: true,
            assigned_to_user: true
        }
    });

    // 2. Core Metrics Calculations
    const totalPipelineValue = allTeamOpps
        .filter((o: any) => !["CLOSED WON", "CLOSED LOST"].includes(o.status?.toUpperCase() || ""))
        .reduce((sum: number, o: any) => sum + (o.expected_revenue || 0), 0);

    const weightedPipelineValue = allTeamOpps
        .filter((o: any) => !["CLOSED WON", "CLOSED LOST"].includes(o.status?.toUpperCase() || ""))
        .reduce((sum: number, o: any) => sum + ((o.expected_revenue || 0) * ((o.probability || 0) / 100)), 0);

    const wonOpps = allTeamOpps.filter((o: any) => o.status?.toUpperCase() === "CLOSED WON");
    const lostOpps = allTeamOpps.filter((o: any) => o.status?.toUpperCase() === "CLOSED LOST");

    const winRate = (wonOpps.length + lostOpps.length) > 0
        ? (wonOpps.length / (wonOpps.length + lostOpps.length)) * 100
        : 0;

    const totalWonValue = wonOpps.reduce((sum: number, o: any) => sum + (o.expected_revenue || 0), 0);

    // 3. Sales Velocity (Average days to close)
    const wonWithDates = wonOpps.filter((o: any) => o.createdAt && o.updatedAt);
    const avgCyclesDays = wonWithDates.length > 0
        ? wonWithDates.reduce((sum: number, o: any) => {
            const start = new Date(o.createdAt).getTime();
            const end = new Date(o.updatedAt).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / wonWithDates.length
        : 0;

    // 4. Grouping by Stage for Funnel
    const stageBreakdown = allTeamOpps.reduce((acc: any, o: any) => {
        const stageName = o.assigned_sales_stage?.name || "Unknown";
        if (!acc[stageName]) acc[stageName] = { count: 0, value: 0 };
        acc[stageName].count++;
        acc[stageName].value += (o.expected_revenue || 0);
        return acc;
    }, {});

    return {
        totalPipelineValue,
        weightedPipelineValue,
        winRate,
        totalWonValue,
        avgCyclesDays: Math.round(avgCyclesDays),
        stageBreakdown: Object.entries(stageBreakdown).map(([name, data]: [string, any]) => ({
            stage: name,
            count: data.count,
            value: data.value
        })),
        counts: {
            won: wonOpps.length,
            lost: lostOpps.length,
            active: allTeamOpps.length - (wonOpps.length + lostOpps.length)
        }
    };
}
