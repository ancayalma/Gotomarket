
import { getServerSession } from "next-auth";
import { prismadb } from "@/lib/prisma";
import { prismadbChat } from "@/lib/prisma-chat";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, Title, Subtitle, Legend } from "@tremor/react";
import { ModelDistributionChart } from "@/app/(routes)/partners/_components/ModelDistributionChart";
import Container from "@/app/(routes)/components/ui/Container";
import { AiUsageCharts } from "@/app/(routes)/partners/_components/AiUsageCharts";
import { getTeamLeadGenCredits } from "@/lib/scraper/credits";

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
        select: { id: true, name: true, email: true }
    });

    const teamMemberIds = (teamMembers as any[]).map(u => u.id);

    // 3. Fetch Chat Sessions for these members
    const teamSessions = await db.chat_Sessions.findMany({
        where: {
            user: { in: teamMemberIds }
        },
        select: { id: true, user: true }
    });

    const teamSessionIds = (teamSessions as any[]).map((s: any) => s.id);
    const sessionUserMap = new Map();
    teamSessions.forEach((s: any) => sessionUserMap.set(s.id, s.user));

    // 4. Fetch Messages for these sessions with usage
    const messagesWithUsage = await db.chat_Messages.findMany({
        where: {
            session: { in: teamSessionIds },
            tokenUsage: { not: null }
        },
        select: {
            model: true,
            tokenUsage: true,
            session: true
        }
    });

    // 4b. NEW: Fetch Team-scoped Global AI Usage Logs (for non-chat platform AI)
    const aiUsageLogs = await prismadb.crm_AiUsageLog.findMany({
        where: {
            OR: [
                { tenant_id: teamId },
                { user_id: { in: teamMemberIds } }
            ]
        },
        select: {
            model_used: true,
            tokens_in: true,
            tokens_out: true,
            user_id: true
        }
    });

    const leadgenCredits = await getTeamLeadGenCredits(teamId);

    // Fetch LeadGen jobs for the team to calculate total candidates found
    const { prismadbCrm } = await import("@/lib/prisma-crm");
    const teamJobs = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findMany({
        where: { user: { in: teamMemberIds } },
        select: { counters: true }
    });

    let totalCandidatesFound = 0;
    teamJobs.forEach((job: any) => {
        if (job.counters?.candidatesCreated) {
            totalCandidatesFound += Number(job.counters.candidatesCreated);
        } else if (job.counters?.companiesFound) {
            totalCandidatesFound += Number(job.counters.companiesFound);
        }
    });

    // 5. Aggregate Data
    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let requestCount = 0;
    const modelUsage: Record<string, number> = {};

    const userUsage: Record<string, { name: string, email: string, totalTokens: number, promptTokens: number, completionTokens: number, requestCount: number }> = {};
    (teamMembers as any[]).forEach(u => {
        userUsage[u.id] = { name: u.name || "Unknown", email: u.email, totalTokens: 0, promptTokens: 0, completionTokens: 0, requestCount: 0 };
    });

    // A. Add Chat Usage
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

        const userId = sessionUserMap.get(msg.session);
        if (userId && userUsage[userId]) {
            userUsage[userId].totalTokens += tokens;
            userUsage[userId].promptTokens += pTokens;
            userUsage[userId].completionTokens += cTokens;
            userUsage[userId].requestCount += 1;
        }
    });

    // B. Add Platform Feature Usage
    (aiUsageLogs as any[]).forEach((log: any) => {
        const tokens = (log.tokens_in + log.tokens_out);
        totalTokens += tokens;
        promptTokens += log.tokens_in;
        completionTokens += log.tokens_out;
        requestCount += 1;

        const modelName = log.model_used || "Platform AI (Internal)";
        modelUsage[modelName] = (modelUsage[modelName] || 0) + tokens;

        if (log.user_id && userUsage[log.user_id]) {
            userUsage[log.user_id].totalTokens += tokens;
            userUsage[log.user_id].promptTokens += log.tokens_in;
            userUsage[log.user_id].completionTokens += log.tokens_out;
            userUsage[log.user_id].requestCount += 1;
        }
    });

    const modelChartData = Object.entries(modelUsage)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Filter to only users with requests, or if none, just show something so chart doesn't crash
    const usersWithUsage = Object.values(userUsage).filter(u => u.requestCount > 0 || u.totalTokens > 0);
    const chartData = usersWithUsage.length > 0 ? usersWithUsage.sort((a, b) => b.totalTokens - a.totalTokens) : [{
        name: teamName,
        email: "Team Average",
        totalTokens,
        promptTokens,
        completionTokens,
        requestCount
    }];

    return (
        <Container title="AI Usage Intelligence" description={`Tracking AI token consumption for ${teamName}.`}>
            <div className="dark space-y-6">
                <div className="grid gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="teal">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Token Consumption</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {totalTokens.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="indigo">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Model Interactions</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {requestCount.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="orange">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Intelligence Credits</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {leadgenCredits.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-[#09090b] border-[#27272a]" decoration="top" decorationColor="emerald">
                            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">Leads Discovered</p>
                            <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
                                {totalCandidatesFound.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AiUsageCharts
                                chartData={chartData}
                                title="Token Usage Overview"
                                subtitle="Breakdown of total tokens (prompt + output) consumed."
                            />
                        </div>
                        <ModelDistributionChart
                            data={modelChartData}
                            title="Model Usage Breakdown"
                            subtitle="Active AI models for this team."
                        />
                    </div>

                    {/* Breakdown Table */}
                    <Card className="bg-[#09090b] border-[#27272a]">
                        <Title className="text-tremor-content-strong dark:text-dark-tremor-content-strong">Member Usage Breakdown</Title>
                        <div className="mt-6 overflow-x-auto">
                            <table className="mt-4 w-full text-left">
                                <thead className="border-b border-tremor-border dark:border-dark-tremor-border">
                                    <tr>
                                        <th className="py-2 pr-4 pl-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">Team Member</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Requests</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-teal-500">Prompt Tokens</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right text-fuchsia-500">Output Tokens</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">Total Tokens</th>
                                        <th className="py-2 pr-4 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(chartData as any[]).map((item) => (
                                        <tr key={item.email} className="border-b border-tremor-border dark:border-dark-tremor-border hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted transition-colors">
                                            <td className="py-3 pl-4 pr-4">
                                                <div className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">{item.name}</div>
                                                <div className="text-xs text-tremor-content dark:text-dark-tremor-content">{item.email}</div>
                                            </td>
                                            <td className="py-3 pr-4 text-right font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">{item.requestCount.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-teal-400/80">{item.promptTokens.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-mono text-fuchsia-400/80">{item.completionTokens.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right font-bold font-mono text-tremor-content-strong dark:text-dark-tremor-content-strong">{item.totalTokens.toLocaleString()}</td>
                                            <td className="py-3 pr-4 text-right text-xs">
                                                {totalTokens > 0 ? Math.round((item.totalTokens / totalTokens) * 100) : 0}%
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
