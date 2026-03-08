
import { getServerSession } from "next-auth";
import { prismadb } from "@/lib/prisma";
import { prismadbChat } from "@/lib/prisma-chat";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, Title, Subtitle, Legend } from "@tremor/react";
import { ModelDistributionChart } from "@/app/(routes)/partners/_components/ModelDistributionChart";
import Container from "@/app/(routes)/components/ui/Container";
import { AiUsageCharts } from "@/app/(routes)/partners/_components/AiUsageCharts";
import { DateRangeSelector } from "@/app/(routes)/partners/_components/DateRangeSelector";
import { ChevronLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { startOfDay, endOfDay, parseISO, subDays } from "date-fns";

// Type wrapper for prisma-chat
const db: any = prismadbChat;

export const dynamic = 'force-dynamic';

interface PageProps {
    params: { teamId: string };
    searchParams: { from?: string; to?: string };
}

export default async function TeamAiUsageDrilldownPage({ params, searchParams }: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/");

    const fromDate = searchParams.from ? startOfDay(parseISO(searchParams.from)) : startOfDay(subDays(new Date(), 30));
    const toDate = searchParams.to ? endOfDay(parseISO(searchParams.to)) : endOfDay(new Date());

    const dateFilter = {
        createdAt: {
            gte: fromDate,
            lte: toDate
        }
    };

    // 1. Check Platform Admin Permissions
    const currentUser = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    });

    const isInternalTeam = currentUser?.assigned_team?.slug === "basalt" ||
        currentUser?.assigned_team?.slug === "basalthq";

    const normalizedRole = (currentUser?.team_role || '').trim().toUpperCase();
    const isPlatformAdmin = normalizedRole === "PLATFORM_ADMIN" || normalizedRole === "PLATFORM ADMIN";

    if (!isPlatformAdmin && !isInternalTeam) {
        return redirect("/");
    }

    // 2. Fetch Target Team
    const targetTeam = await prismadb.team.findUnique({
        where: { id: params.teamId },
        select: {
            id: true,
            name: true,
            slug: true
        }
    });

    if (!targetTeam) return notFound();

    // 3. Fetch Team Members
    const teamMembers = await prismadb.users.findMany({
        where: { team_id: params.teamId },
        select: { id: true, name: true, email: true }
    });

    const teamMemberIds = (teamMembers as any[]).map(u => u.id);

    // 4. Fetch Chat Sessions for these members
    const teamSessions = await db.chat_Sessions.findMany({
        where: {
            user: { in: teamMemberIds }
        },
        select: { id: true, user: true }
    });

    const teamSessionIds = (teamSessions as any[]).map((s: any) => s.id);
    const sessionToUserMap = new Map();
    teamSessions.forEach((s: any) => sessionToUserMap.set(s.id, s.user));

    // 5. Fetch Messages (Include all for request count)
    const messagesWithUsage = await db.chat_Messages.findMany({
        where: {
            session: { in: teamSessionIds },
            ...dateFilter
        },
        select: {
            session: true,
            model: true,
            tokenUsage: true,
            createdAt: true
        }
    });

    // 6. Fetch Global AI Usage Logs
    const aiUsageLogs = await prismadb.crm_AiUsageLog.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { tenant_id: params.teamId },
                        { user_id: { in: teamMemberIds } }
                    ]
                },
                dateFilter
            ]
        },
        select: {
            model_used: true,
            tokens_in: true,
            tokens_out: true,
            user_id: true,
            createdAt: true
        }
    });

    // 7. Aggregate Data
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let requestCount = 0;
    const modelUsage: Record<string, number> = {};
    const userUsage: Record<string, { name: string, email: string, total: number, promptTokens: number, completionTokens: number, requests: number }> = {};

    // Initialize users
    (teamMembers as any[]).forEach(u => {
        userUsage[u.id] = { name: u.name || "Unknown", email: u.email, total: 0, promptTokens: 0, completionTokens: 0, requests: 0 };
    });

    // A. Parse Chat
    (messagesWithUsage as any[]).forEach((msg: any) => {
        const usage = (msg.tokenUsage || {}) as any;
        const tokens = (usage.totalTokens || 0);
        const pTokens = (usage.promptTokens || usage.inputTokens || 0);
        const cTokens = (usage.completionTokens || usage.outputTokens || 0);

        totalTokens += tokens;
        promptTokens += pTokens;
        completionTokens += cTokens;
        requestCount += 1;

        const modelName = msg.model || "Unknown Model";
        modelUsage[modelName] = (modelUsage[modelName] || 0) + tokens;

        const userId = sessionToUserMap.get(msg.session);
        if (userId && userUsage[userId]) {
            userUsage[userId].total += tokens;
            userUsage[userId].promptTokens += pTokens;
            userUsage[userId].completionTokens += cTokens;
            userUsage[userId].requests += 1;
        }
    });

    // B. Parse Logs
    (aiUsageLogs as any[]).forEach((log) => {
        const tokens = (log.tokens_in + log.tokens_out);
        totalTokens += tokens;
        promptTokens += log.tokens_in;
        completionTokens += log.tokens_out;
        requestCount += 1;

        const modelName = log.model_used || "Platform AI";
        modelUsage[modelName] = (modelUsage[modelName] || 0) + tokens;

        if (log.user_id && userUsage[log.user_id]) {
            userUsage[log.user_id].total += tokens;
            userUsage[log.user_id].promptTokens += log.tokens_in;
            userUsage[log.user_id].completionTokens += log.tokens_out;
            userUsage[log.user_id].requests += 1;
        }
    });

    const modelChartData = Object.entries(modelUsage)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const userChartData = Object.values(userUsage)
        .sort((a, b) => b.total - a.total);

    const chartData = [{
        name: targetTeam.name,
        totalTokens,
        promptTokens,
        completionTokens,
        requestCount
    }];

    return (
        <Container
            title={targetTeam.name}
            description={`Detailed AI usage analytics for ${targetTeam.slug}.`}
        >
            <div className="dark space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#09090b] p-6 rounded-xl border border-[#27272a] shadow-sm">
                    <div className="flex items-center gap-4 shrink-0">
                        <Link href="/partners/ai-usage">
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-zinc-800 transition-colors">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div className="h-10 w-[1px] bg-zinc-800 mx-1" />
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-indigo-400" />
                            <div>
                                <p className="text-zinc-100 font-semibold">Usage Period</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Filtering analytics by date range</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <DateRangeSelector />
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="teal">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Tokens</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {totalTokens.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="indigo">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Requests</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {requestCount.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="amber">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Active Users</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {teamMembers.length}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="emerald">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Avg. per Request</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {requestCount > 0 ? Math.round(totalTokens / requestCount).toLocaleString() : 0}
                            </p>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AiUsageCharts
                                chartData={chartData}
                                title="Usage Timeline"
                                subtitle="Token consumption trends for this team."
                            />
                        </div>
                        <ModelDistributionChart
                            data={modelChartData}
                        />
                    </div>

                    {/* User Breakdown */}
                    <Card className="bg-[#09090b] border-[#27272a]">
                        <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">Member Usage Breakdown</Title>
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-tremor-border dark:border-dark-tremor-border">
                                    <tr>
                                        <th className="py-2 pl-4 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">Team Member</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Requests</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-teal-500">Prompt</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-fuchsia-500">Output</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Total Tokens</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userChartData.map((u) => (
                                        <tr key={u.email} className="border-b border-tremor-border dark:border-dark-tremor-border hover:bg-zinc-900/50 transition-colors">
                                            <td className="py-3 pl-4 pr-4">
                                                <div className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">{u.name}</div>
                                                <div className="text-xs text-tremor-content dark:text-dark-tremor-content">{u.email}</div>
                                            </td>
                                            <td className="py-3 pr-4 text-right font-mono text-tremor-content dark:text-dark-tremor-content">{u.requests.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-teal-400/80">{u.promptTokens.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-fuchsia-400/80">{u.completionTokens.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-bold font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">{u.total.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right text-xs">
                                                {totalTokens > 0 ? Math.round((u.total / totalTokens) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </Container>
    );
}
