import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/reports/analytics/clv
 *
 * Customer Lifetime Value (CLV) report.
 * Calculates per-account CLV metrics and provides aggregate stats.
 * 
 * Query params:
 *   limit: number of accounts to return (default: 50)
 *   sort: "clv" | "deals" | "tenure" | "avg_deal" (default: "clv")
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const sort = url.searchParams.get("sort") || "clv";

        // Fetch all accounts with their won opportunities
        const accounts = await prismadb.crm_Accounts.findMany({
            where: {
                ...(user?.team_id ? { assigned_to_team: user.team_id } : {}),
            },
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
                opportunities: {
                    select: {
                        id: true,
                        expected_revenue: true,
                        close_date: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Calculate CLV for each account
        const now = new Date();
        const accountCLVs = accounts.map((account: any) => {
            const wonDeals = account.opportunities.filter((o: any) =>
                o.status === "WON" || o.status === "CLOSED_WON"
            );
            const allDeals = account.opportunities;

            const totalRevenue = wonDeals.reduce((sum: number, o: any) => sum + (o.expected_revenue || 0), 0);
            const dealCount = wonDeals.length;
            const avgDealSize = dealCount > 0 ? totalRevenue / dealCount : 0;

            // Tenure in months
            const tenureMs = now.getTime() - new Date(account.createdAt).getTime();
            const tenureMonths = Math.max(1, Math.round(tenureMs / (30.44 * 24 * 60 * 60 * 1000)));

            // Monthly revenue rate
            const monthlyRate = totalRevenue / tenureMonths;

            // Projected annual value
            const annualValue = monthlyRate * 12;

            // Win rate
            const winRate = allDeals.length > 0 ? (dealCount / allDeals.length) * 100 : 0;

            // Days since last deal
            const lastDeal = wonDeals.sort((a: any, b: any) =>
                new Date(b.close_date || b.createdAt).getTime() - new Date(a.close_date || a.createdAt).getTime()
            )[0];
            const daysSinceLastDeal = lastDeal
                ? Math.round((now.getTime() - new Date(lastDeal.close_date || lastDeal.createdAt).getTime()) / (24 * 60 * 60 * 1000))
                : null;

            // Health score (0-100): based on recency, frequency, and monetary value
            let healthScore = 0;
            if (dealCount > 0) {
                const recencyScore = daysSinceLastDeal !== null ? Math.max(0, 100 - daysSinceLastDeal / 3) : 0;
                const frequencyScore = Math.min(100, (dealCount / tenureMonths) * 200);
                const monetaryScore = Math.min(100, (avgDealSize / 10000) * 100); // Normalize around $10k
                healthScore = Math.round((recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3));
            }

            return {
                id: account.id,
                name: account.name,
                type: account.type,
                totalRevenue,
                dealCount,
                avgDealSize: Math.round(avgDealSize),
                tenureMonths,
                monthlyRate: Math.round(monthlyRate),
                annualValue: Math.round(annualValue),
                winRate: Math.round(winRate),
                daysSinceLastDeal,
                healthScore,
                totalOpportunities: allDeals.length,
            };
        }).filter((a: any) => a.dealCount > 0); // Only show accounts with at least one won deal

        // Sort
        const sortFn: Record<string, (a: any, b: any) => number> = {
            clv: (a, b) => b.totalRevenue - a.totalRevenue,
            deals: (a, b) => b.dealCount - a.dealCount,
            tenure: (a, b) => b.tenureMonths - a.tenureMonths,
            avg_deal: (a, b) => b.avgDealSize - a.avgDealSize,
            health: (a, b) => b.healthScore - a.healthScore,
        };
        accountCLVs.sort(sortFn[sort] || sortFn.clv);

        // Aggregate stats
        const totalCustomers = accountCLVs.length;
        const totalLifetimeValue = accountCLVs.reduce((sum: number, a: any) => sum + a.totalRevenue, 0);
        const avgCLV = totalCustomers > 0 ? Math.round(totalLifetimeValue / totalCustomers) : 0;
        const medianCLV = totalCustomers > 0
            ? accountCLVs[Math.floor(totalCustomers / 2)]?.totalRevenue || 0
            : 0;
        const avgHealthScore = totalCustomers > 0
            ? Math.round(accountCLVs.reduce((sum: number, a: any) => sum + a.healthScore, 0) / totalCustomers)
            : 0;

        // CLV distribution (quartiles)
        const sorted = [...accountCLVs].sort((a, b) => a.totalRevenue - b.totalRevenue);
        const q1 = sorted[Math.floor(sorted.length * 0.25)]?.totalRevenue || 0;
        const q3 = sorted[Math.floor(sorted.length * 0.75)]?.totalRevenue || 0;

        // Top segment analysis
        const topTier = accountCLVs.slice(0, Math.ceil(totalCustomers * 0.2));
        const topTierRevenue = topTier.reduce((sum: number, a: any) => sum + a.totalRevenue, 0);
        const topTierPct = totalLifetimeValue > 0 ? Math.round((topTierRevenue / totalLifetimeValue) * 100) : 0;

        return NextResponse.json({
            accounts: accountCLVs.slice(0, limit),
            aggregate: {
                totalCustomers,
                totalLifetimeValue,
                avgCLV,
                medianCLV,
                avgHealthScore,
                distribution: { q1, median: medianCLV, q3 },
                paretoInsight: `Top 20% of customers generate ${topTierPct}% of revenue`,
            },
        });
    } catch (error) {
        console.error("[CLV_REPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
