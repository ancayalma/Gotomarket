import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/reports/analytics/cohort
 * 
 * Cohort analysis: groups customers (accounts) by their creation month
 * and tracks retention/deal activity over subsequent months.
 * 
 * Query params:
 *   months: number of months to analyze (default: 12)
 *   metric: "deals" | "revenue" | "retention" (default: "deals")
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
        const months = parseInt(url.searchParams.get("months") || "12");
        const metric = url.searchParams.get("metric") || "deals";

        // Get the start date (X months ago, first day of month)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // Fetch all accounts created in the window
        const accounts = await prismadb.crm_Accounts.findMany({
            where: {
                ...(user?.team_id ? { assigned_to_team: user.team_id } : {}),
                createdAt: { gte: startDate },
            },
            select: {
                id: true,
                createdAt: true,
            },
        });

        // Fetch all opportunities in the window
        const opportunities = await prismadb.crm_Opportunities.findMany({
            where: {
                ...(user?.team_id ? { team_id: user.team_id } : {}),
                createdAt: { gte: startDate },
                account: { isNot: null },
            },
            select: {
                id: true,
                account: true,
                createdAt: true,
                expected_revenue: true,
                status: true,
            },
        });

        // Build cohort matrix
        const cohorts: Record<string, {
            label: string;
            accountCount: number;
            months: Record<number, { value: number; pct: number }>;
        }> = {};

        // Group accounts by creation month
        const accountCohorts = new Map<string, string[]>();
        for (const account of accounts) {
            const key = formatMonthKey(account.createdAt);
            if (!accountCohorts.has(key)) accountCohorts.set(key, []);
            accountCohorts.get(key)!.push(account.id);
        }

        // For each cohort, compute the metric for each subsequent month
        for (const [cohortKey, accountIds] of Array.from(accountCohorts)) {
            const cohortDate = new Date(cohortKey + "-01");
            const monthsData: Record<number, { value: number; pct: number }> = {};

            for (let m = 0; m < months; m++) {
                const monthStart = new Date(cohortDate);
                monthStart.setMonth(monthStart.getMonth() + m);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);

                if (monthStart > new Date()) break;

                const monthOpps = opportunities.filter((o: any) =>
                    o.account &&
                    accountIds.includes(typeof o.account === "string" ? o.account : (o.account as any).id || "") &&
                    o.createdAt >= monthStart &&
                    o.createdAt < monthEnd
                );

                let value = 0;
                if (metric === "deals") {
                    value = monthOpps.length;
                } else if (metric === "revenue") {
                    value = monthOpps.reduce((sum: number, o: any) => sum + (o.expected_revenue || 0), 0);
                } else if (metric === "retention") {
                    // Unique accounts that had activity
                    const activeAccounts = new Set(monthOpps.map((o: any) =>
                        typeof o.account === "string" ? o.account : (o.account as any)?.id
                    ).filter(Boolean));
                    value = activeAccounts.size;
                }

                const pct = accountIds.length > 0 ? Math.round((value / accountIds.length) * 100) : 0;
                monthsData[m] = { value, pct };
            }

            cohorts[cohortKey] = {
                label: formatMonthLabel(cohortDate),
                accountCount: accountIds.length,
                months: monthsData,
            };
        }

        // Sort by cohort date
        const sortedCohorts = Object.entries(cohorts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, data]) => ({ key, ...data }));

        return NextResponse.json({
            metric,
            months,
            cohorts: sortedCohorts,
            totalAccounts: accounts.length,
        });
    } catch (error) {
        console.error("[COHORT_ANALYSIS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

function formatMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
