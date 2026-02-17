
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

export default async function AiUsagePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/");

    // 1. Check Permissions
    const currentUser = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    });

    const teamId = currentUser?.assigned_team?.id;
    const teamName = currentUser?.assigned_team?.name || "Your Team";

    // Allow if user is admin of the team, or global admin
    const normalizedRole = (currentUser?.team_role || '').trim().toUpperCase();
    const isPlatformAdmin = normalizedRole === "PLATFORM_ADMIN" || normalizedRole === "PLATFORM ADMIN";
    const isTeamAdmin = currentUser?.is_admin || normalizedRole === "ADMIN" || normalizedRole === "OWNER";

    if (!teamId || (!isTeamAdmin && !isPlatformAdmin)) {
        return (
            <Container title="Access Denied" description="You do not have permission to view AI usage.">
                <div className="p-4 text-red-500">Only Team Admins can view this dashboard.</div>
            </Container>
        );
    }

    // 2. Fetch Team Members to scope the query
    const teamMembers = await prismadb.users.findMany({
        where: { team_id: teamId },
        select: { id: true }
    });

    const teamMemberIds = teamMembers.map(u => u.id);

    // 3. Fetch Chat Sessions for these members
    const teamSessions = await db.chat_Sessions.findMany({
        where: {
            user: { in: teamMemberIds }
        },
        select: { id: true }
    });

    const teamSessionIds = teamSessions.map((s: any) => s.id);

    // 4. Fetch Messages for these sessions with usage
    const messagesWithUsage = await db.chat_Messages.findMany({
        where: {
            session: { in: teamSessionIds },
            tokenUsage: { not: null }
        },
        select: {
            tokenUsage: true
        }
    });

    // 5. Aggregate Data
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let requestCount = 0;

    messagesWithUsage.forEach((msg: any) => {
        const usage = msg.tokenUsage as { promptTokens?: number, completionTokens?: number, totalTokens?: number };
        totalTokens += (usage.totalTokens || 0);
        promptTokens += (usage.promptTokens || 0);
        completionTokens += (usage.completionTokens || 0);
        requestCount += 1;
    });

    const chartData = [
        {
            name: teamName,
            totalTokens,
            promptTokens,
            completionTokens,
            requestCount
        }
    ];

    return (
        <Container title="AI Usage Intelligence" description={`Tracking AI token consumption for ${teamName}.`}>
            <div className="grid gap-6 mb-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card decoration="top" decorationColor="indigo">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Total Token Consumption</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {totalTokens.toLocaleString()}
                        </p>
                    </Card>
                    <Card decoration="top" decorationColor="fuchsia">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Model Interactions</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {requestCount.toLocaleString()}
                        </p>
                    </Card>
                    <Card decoration="top" decorationColor="amber">
                        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Active Users</p>
                        <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                            {teamMemberIds.length}
                        </p>
                    </Card>
                </div>

                {/* Main Chart */}
                <Card>
                    <Title>Token Usage Overview</Title>
                    <Subtitle>Breakdown of total tokens (prompt + output) consumed.</Subtitle>
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
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Container>
    );
}
