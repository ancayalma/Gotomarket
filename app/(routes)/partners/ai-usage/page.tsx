
import { getServerSession } from "next-auth";
import { prismadb } from "@/lib/prisma";
import { prismadbChat } from "@/lib/prisma-chat";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, Title, Subtitle, Legend } from "@tremor/react";
import { ModelDistributionChart } from "@/app/(routes)/partners/_components/ModelDistributionChart";
import Container from "@/app/(routes)/components/ui/Container";
import { AiUsageCharts } from "@/app/(routes)/partners/_components/AiUsageCharts";
import { AiUsageReportTable } from "@/app/(routes)/partners/_components/AiUsageReportTable";
import { AiUsageTrends } from "@/app/(routes)/partners/_components/AiUsageTrends";
import { DateRangeSelector } from "@/app/(routes)/partners/_components/DateRangeSelector";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { startOfDay, endOfDay, parseISO, subDays } from "date-fns";

// Type wrapper for prisma-chat
const db: any = prismadbChat;

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: {
        from?: string;
        to?: string;
    }
}

export default async function PartnersAiUsagePage({ searchParams }: PageProps) {
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
        return (
            <Container title="Access Denied" description="You do not have permission to view global AI usage.">
                <div className="p-4 text-red-500">Only Platform Admins can view this dashboard.</div>
            </Container>
        );
    }

    // 2. Fetch Chat Messages (Include all for request count, even if tokens are zero/null)
    const messagesWithUsage = await db.chat_Messages.findMany({
        where: dateFilter,
        select: {
            session: true,
            model: true,
            tokenUsage: true,
            createdAt: true
        }
    });

    // 2b. NEW: Fetch Global AI Usage Logs (for non-chat AI like email, Varuni, etc.)
    const aiUsageLogs = await prismadb.crm_AiUsageLog.findMany({
        where: dateFilter,
        select: {
            tenant_id: true,
            user_id: true,
            model_used: true,
            tokens_in: true,
            tokens_out: true,
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
    const chatUserIds = new Set<string>();

    sessions.forEach((s: any) => {
        sessionUserMap.set(s.id, s.user);
        if (s.user) chatUserIds.add(s.user);
    });

    // Combine with users from logs
    const allRelevantUserIds = new Set([...Array.from(chatUserIds), ...aiUsageLogs.map(l => l.user_id).filter(Boolean) as string[]]);

    // Fetch Users to map to Teams and Roles
    const users = await prismadb.users.findMany({
        where: {
            id: { in: Array.from(allRelevantUserIds) }
        },
        select: {
            id: true,
            team_role: true,
            assigned_team: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        }
    });

    // Map User -> Team & Role
    const userTeamMap = new Map<string, { id: string, name: string, slug: string }>();
    const userRoleMap = new Map<string, string>();

    users.forEach((u) => {
        if (u.assigned_team) {
            userTeamMap.set(u.id, u.assigned_team);
        }
        if (u.team_role) {
            userRoleMap.set(u.id, u.team_role.toUpperCase());
        }
    });

    // 3. Fetch ALL teams to ensure complete coverage
    const allTeams = await prismadb.team.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            team_type: true,
            parent_id: true
        }
    });

    const basaltTeam = allTeams.find(t => t.slug === 'basalthq' || t.slug === 'basalt');
    const basaltTeamId = basaltTeam?.id || 'basalt-internal';
    const INTERNAL_TEAM_NAME = basaltTeam?.name || "BasaltHQ Team";

    // 4. Aggregate Data
    const teamUsage: Record<string, { id: string, name: string, team_type: string, totalTokens: number, promptTokens: number, completionTokens: number, requestCount: number }> = {};
    const modelUsage: Record<string, number> = {};
    const temporalUsage: Record<string, { date: string, tokens: number, requests: number }> = {};
    const UNKNOWN_TEAM_ID = "unknown-team";
    const UNKNOWN_TEAM_NAME = "Unknown / Deleted Team";

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Map each team to its top-level organization for roll-up
    const teamToOrgMap = new Map<string, string>();
    allTeams.forEach(t => {
        // Simple map: if it's a department, map to parent (assumes 1 level of nesting as per typical CRM structure)
        // If no parent, it's its own organization.
        teamToOrgMap.set(t.id, t.team_type === 'DEPARTMENT' && t.parent_id ? t.parent_id : t.id);
    });

    // Initialize with all teams (0 usage)
    allTeams.forEach(team => {
        teamUsage[team.id] = {
            id: team.id,
            name: team.name,
            team_type: team.team_type,
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
            requestCount: 0
        };
    });

    // Ensure unknown bucket exists
    teamUsage[UNKNOWN_TEAM_ID] = {
        id: UNKNOWN_TEAM_ID,
        name: UNKNOWN_TEAM_NAME,
        team_type: 'ORGANIZATION',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0
    };

    // A. Parse Chat Messages
    messagesWithUsage.forEach((msg: any) => {
        const userId = sessionUserMap.get(msg.session);
        const team = userId ? userTeamMap.get(userId) : null;
        const role = userId ? userRoleMap.get(userId) : '';

        let targetId = team ? team.id : UNKNOWN_TEAM_ID;

        // Attribution: If it's a platform admin, attribute to BasaltHQ if team is missing
        if (targetId === UNKNOWN_TEAM_ID && (role === "PLATFORM_ADMIN" || role === "PLATFORM ADMIN")) {
            targetId = basaltTeamId;
        }

        if (!teamUsage[targetId]) {
            const teamInfo = allTeams.find(t => t.id === targetId);
            teamUsage[targetId] = {
                id: targetId,
                name: teamInfo?.name || team?.name || INTERNAL_TEAM_NAME,
                team_type: teamInfo?.team_type || 'ORGANIZATION',
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0,
                requestCount: 0
            };
        }

        const usage = (msg.tokenUsage || {}) as { promptTokens?: number, completionTokens?: number, totalTokens?: number };
        const tokens = (usage.totalTokens || 0);
        teamUsage[targetId].totalTokens += tokens;
        teamUsage[targetId].promptTokens += (usage.promptTokens || 0);
        teamUsage[targetId].completionTokens += (usage.completionTokens || 0);
        teamUsage[targetId].requestCount += 1;

        // Model Distribution
        const modelName = msg.model || "Unknown Model";
        modelUsage[modelName] = (modelUsage[modelName] || 0) + tokens;

        // Temporal Aggregation
        const dateKey = formatDate(msg.createdAt);
        if (!temporalUsage[dateKey]) temporalUsage[dateKey] = { date: dateKey, tokens: 0, requests: 0 };
        temporalUsage[dateKey].tokens += tokens;
        temporalUsage[dateKey].requests += 1;
    });

    // B. Parse Global AI Logs
    aiUsageLogs.forEach((log) => {
        let targetId = log.tenant_id || UNKNOWN_TEAM_ID;

        if (targetId === UNKNOWN_TEAM_ID && log.user_id) {
            const team = userTeamMap.get(log.user_id);
            const role = userRoleMap.get(log.user_id);
            if (team) targetId = team.id;
            else if (role === "PLATFORM_ADMIN" || role === "PLATFORM ADMIN") targetId = basaltTeamId;
        }

        if (!teamUsage[targetId]) {
            const teamInfo = allTeams.find(t => t.id === targetId);
            teamUsage[targetId] = {
                id: targetId,
                name: teamInfo?.name || INTERNAL_TEAM_NAME,
                team_type: teamInfo?.team_type || 'ORGANIZATION',
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0,
                requestCount: 0
            };
        }

        const tokens = (log.tokens_in + log.tokens_out);
        teamUsage[targetId].totalTokens += tokens;
        teamUsage[targetId].promptTokens += log.tokens_in;
        teamUsage[targetId].completionTokens += log.tokens_out;
        teamUsage[targetId].requestCount += 1;

        // Model Distribution
        const modelName = log.model_used || "Platform AI (Internal)";
        modelUsage[modelName] = (modelUsage[modelName] || 0) + tokens;

        // Temporal Aggregation
        const dateKey = formatDate(log.createdAt);
        if (!temporalUsage[dateKey]) temporalUsage[dateKey] = { date: dateKey, tokens: 0, requests: 0 };
        temporalUsage[dateKey].tokens += tokens;
        temporalUsage[dateKey].requests += 1;
    });

    // C. Initialize any teams with zero usage so they still appear if they are Top-Level Orgs
    allTeams.forEach(team => {
        if (!teamUsage[team.id]) {
            teamUsage[team.id] = {
                id: team.id,
                name: team.name,
                team_type: team.team_type,
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0,
                requestCount: 0
            };
        }
    });

    // Final Dataset for Display
    const chartData = Object.values(teamUsage)
        .filter(t => {
            if (t.team_type === 'ORGANIZATION') return true;
            if (t.totalTokens > 0) return true;
            return false;
        })
        .sort((a, b) => b.totalTokens - a.totalTokens);

    // Roll-up logic for Active Organizations KPI
    // An organization is "active" if it OR any of its departments have activity (requests)
    const orgsWithActivity = new Set<string>();
    Object.values(teamUsage).forEach(t => {
        if (t.requestCount > 0) {
            const orgId = teamToOrgMap.get(t.id);
            if (orgId) orgsWithActivity.add(orgId);
        }
    });

    const activeOrgCount = orgsWithActivity.size;

    const modelChartData = Object.entries(modelUsage)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Sort temporal data by date (simple approach for now)
    const trendData = Object.values(temporalUsage);
    const totalPlatformTokens = chartData.reduce((acc, curr) => acc + curr.totalTokens, 0);
    const totalRequests = chartData.reduce((acc, curr) => acc + curr.requestCount, 0);
    const avgTokensPerRequest = totalRequests > 0 ? Math.round(totalPlatformTokens / totalRequests) : 0;
    const promptToOutputRatio = chartData.reduce((acc, curr) => acc + curr.promptTokens, 0) / (chartData.reduce((acc, curr) => acc + curr.completionTokens, 0) || 1);

    return (
        <Container
            title="Global AI Usage"
            description="Platform-wide tracking of AI token consumption across all teams."
            action={<DateRangeSelector />}
        >
            <div className="space-y-6">
                <div className="grid gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-card border-border/50" decoration="top" decorationColor="primary">
                            <p className="text-tremor-default text-muted-foreground uppercase tracking-widest font-semibold">Total Token Consumption</p>
                            <p className="text-3xl text-foreground font-bold mt-2">
                                {totalPlatformTokens.toLocaleString()}
                            </p>
                        </Card>
                        <Card className="bg-card border-border/50" decoration="top" decorationColor="fuchsia">
                            <p className="text-tremor-default text-muted-foreground uppercase tracking-widest font-semibold">Active Organizations</p>
                            <p className="text-3xl text-foreground font-bold mt-2">
                                {activeOrgCount}
                            </p>
                        </Card>
                        <Card className="bg-card border-border/50" decoration="top" decorationColor="amber">
                            <p className="text-tremor-default text-muted-foreground uppercase tracking-widest font-semibold">Total AI Requests</p>
                            <p className="text-3xl text-foreground font-bold mt-2">
                                {totalRequests.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Usage Intelligence Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-card border-border/30 p-4">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Avg Tokens / Request</p>
                            <p className="text-xl text-foreground font-mono mt-1">{avgTokensPerRequest.toLocaleString()}</p>
                        </Card>
                        <Card className="bg-card border-border/30 p-4">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Prompt/Output Ratio</p>
                            <p className="text-xl text-foreground font-mono mt-1">{promptToOutputRatio.toFixed(1)}x</p>
                        </Card>
                        <Card className="bg-card border-border/30 p-4">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Leading Model</p>
                            <p className="text-xl text-foreground font-semibold mt-1 truncate">{modelChartData[0]?.name || "N/A"}</p>
                        </Card>
                        <Card className="bg-card border-border/30 p-4">
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Peak Daily Activity</p>
                            <p className="text-xl text-foreground font-mono mt-1">{trendData.length > 0 ? Math.max(...trendData.map(d => d.requests)).toLocaleString() : 0} reqs</p>
                        </Card>
                    </div>

                    {/* Pattern Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AiUsageTrends data={trendData} />
                        <Card className="bg-card border-border/50">
                            <Title className="text-foreground text-base">Usage Efficiency & Patterns</Title>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start justify-between p-3 bg-accent/10 rounded-lg border border-border/30">
                                    <div className="space-y-1">
                                        <p className="text-foreground font-medium">Model Efficiency</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {avgTokensPerRequest < 500 ? "Highly efficient: many short interactions." : "Detailed usage: long context and complex prompts."}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${avgTokensPerRequest < 500 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {avgTokensPerRequest < 500 ? "Compact" : "Deep"}
                                    </div>
                                </div>
                                <div className="flex items-start justify-between p-3 bg-accent/10 rounded-lg border border-border/30">
                                    <div className="space-y-1">
                                        <p className="text-foreground font-medium">Output Characteristics</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {promptToOutputRatio > 2 ? "High Input Ratio: Analyzing large amounts of text." : "Generative Heavy: Producing significant creative content."}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${promptToOutputRatio > 2 ? 'bg-blue-500/10 text-blue-400' : 'bg-fuchsia-500/10 text-fuchsia-400'}`}>
                                        {promptToOutputRatio > 2 ? "Analytical" : "Creative"}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AiUsageCharts
                                chartData={chartData}
                                title="Token Usage by Team"
                                subtitle="Breakdown of total tokens (prompt + output) consumed per organization."
                            />
                        </div>
                        <ModelDistributionChart
                            data={modelChartData}
                        />
                    </div>

                    {/* Breakdown Table */}
                    <AiUsageReportTable
                        data={chartData}
                        basaltTeamId={basaltTeamId}
                        unknownTeamId={UNKNOWN_TEAM_ID}
                    />
                </div>
            </div>
        </Container>
    );
}
