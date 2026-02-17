
import { getServerSession } from "next-auth";
import { prismadb } from "@/lib/prisma";
import { prismadbChat } from "@/lib/prisma-chat";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, Title, BarChart, Subtitle, DonutChart, Legend } from "@tremor/react";
import Container from "@/app/(routes)/components/ui/Container";

// Type wrapper for prisma-chat
const db: any = prismadbChat;

export const dynamic = 'force-dynamic';

export default async function PartnersAiUsagePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/");

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
        return (
            <Container title="Access Denied" description="You do not have permission to view global AI usage.">
                <div className="p-4 text-red-500">Only Platform Admins can view this dashboard.</div>
            </Container>
        );
    }

    // 2. Fetch Chat Messages with Usage
    const messagesWithUsage = await db.chat_Messages.findMany({
        where: {
            tokenUsage: { not: null }
        },
        select: {
            session: true,
            tokenUsage: true,
            createdAt: true
        }
    });

    // Extract Session IDs to find Users
    const sessionIds = Array.from(new Set(messagesWithUsage.map((m: any) => m.session))) as string[];

    // Fetch Sessions to map to Users
    const sessions = await db.chat_Sessions.findMany({
        where: {
            id: { in: sessionIds }
        },
        select: {
            id: true,
            user: true
        }
    });

    // Map Session -> User
    const sessionUserMap = new Map<string, string>();
    const userIds = new Set<string>();

    sessions.forEach((s: any) => {
        sessionUserMap.set(s.id, s.user);
        if (s.user) userIds.add(s.user);
    });

    // Fetch Users to map to Teams
    const users = await prismadb.users.findMany({
        where: {
            id: { in: Array.from(userIds) }
        },
        select: {
            id: true,
            assigned_team: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    // Map User -> Team
    const userTeamMap = new Map<string, { id: string, name: string }>();
    users.forEach((u) => {
        if (u.assigned_team) {
            userTeamMap.set(u.id, u.assigned_team);
        }
    });

    // 3. Aggregate Data
    const teamUsage: Record<string, { name: string, totalTokens: number, promptTokens: number, completionTokens: number, requestCount: number }> = {};
    const UNKNOWN_TEAM = "Unknown / Deleted Team";

    messagesWithUsage.forEach((msg: any) => {
        const userId = sessionUserMap.get(msg.session);
        const team = userId ? userTeamMap.get(userId) : null;
        const teamName = team ? team.name : UNKNOWN_TEAM;

        if (!teamUsage[teamName]) {
            teamUsage[teamName] = { name: teamName, totalTokens: 0, promptTokens: 0, completionTokens: 0, requestCount: 0 };
        }

        const usage = msg.tokenUsage as { promptTokens?: number, completionTokens?: number, totalTokens?: number };

        teamUsage[teamName].totalTokens += (usage.totalTokens || 0);
        teamUsage[teamName].promptTokens += (usage.promptTokens || 0);
        teamUsage[teamName].completionTokens += (usage.completionTokens || 0);
        teamUsage[teamName].requestCount += 1;
    });

    const chartData = Object.values(teamUsage).sort((a, b) => b.totalTokens - a.totalTokens);
    const totalPlatformTokens = chartData.reduce((acc, curr) => acc + curr.totalTokens, 0);

    return (
        <Container title="Global AI Usage" description="Platform-wide tracking of AI token consumption across all teams.">
            <div className="grid gap-6 mb-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card decoration="top" decorationColor="indigo">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Token Consumption</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {totalPlatformTokens.toLocaleString()}
                        </p>
                    </Card>
                    <Card decoration="top" decorationColor="fuchsia">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Active Teams (AI)</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {chartData.length}
                        </p>
                    </Card>
                    <Card decoration="top" decorationColor="amber">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total AI Requests</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {chartData.reduce((acc, curr) => acc + curr.requestCount, 0).toLocaleString()}
                        </p>
                    </Card>
                </div>

                {/* Main Chart */}
                <Card>
                    <Title>Token Usage by Team</Title>
                    <Subtitle>Breakdown of total tokens (prompt + output) consumed per organization.</Subtitle>
                    <BarChart
                        className="mt-6"
                        data={chartData}
                        index="name"
                        categories={["totalTokens", "promptTokens", "completionTokens"]}
                        colors={["blue", "cyan", "indigo"]}
                        yAxisWidth={48}
                        valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
                    />
                </Card>

                {/* Breakdown Table */}
                <Card>
                    <Title>Detailed Usage Report</Title>
                    <div className="mt-6 overflow-x-auto">
                        <table className="mt-4 w-full text-left">
                            <thead className="border-b border-tremor-border dark:border-dark-tremor-border">
                                <tr>
                                    <th className="py-2 pr-4 pl-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">Team Name</th>
                                    <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Requests</th>
                                    <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Prompt Tokens</th>
                                    <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Output Tokens</th>
                                    <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Total Tokens</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartData.map((item) => (
                                    <tr key={item.name} className="border-b border-tremor-border dark:border-dark-tremor-border hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted transition-colors">
                                        <td className="py-2 pl-4 pr-4">{item.name}</td>
                                        <td className="py-2 pr-4 text-right font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">{item.requestCount}</td>
                                        <td className="py-2 pr-4 text-right font-mono">{item.promptTokens.toLocaleString()}</td>
                                        <td className="py-2 pr-4 text-right font-mono">{item.completionTokens.toLocaleString()}</td>
                                        <td className="py-2 pr-4 text-right font-bold font-mono">{item.totalTokens.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {chartData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No usage data recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Container>
    );
}
