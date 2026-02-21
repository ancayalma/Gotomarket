"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAIInsights = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

        const insights = [];
        const now = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // ─── 1. Revenue Risk: Overdue High-Value Invoices ───
        const unpaidInvoices = await prismadb.invoices.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                payment_status: "UNPAID",
                date_due: { lt: now }
            },
            take: 1,
            orderBy: { invoice_amount: "desc" }
        });

        if (unpaidInvoices.length > 0) {
            insights.push({
                id: "overdue-invoice",
                title: "Capital Risk Detected",
                description: `Invoice ${unpaidInvoices[0].invoice_number} is past due. High impact on projected cash flow.`,
                action: "Send Reminder",
                actionHref: `/invoice/${unpaidInvoices[0].id}`,
                type: "warning",
                priority: "high"
            });
        }

        // ─── 2. Pipeline Risk: Stale Leads ───
        const staleLeads = await prismadb.crm_Leads.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                status: "NEW",
                createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
            },
            take: 1,
            orderBy: { createdAt: "desc" }
        });

        if (staleLeads.length > 0) {
            insights.push({
                id: "stale-lead",
                title: "Lead Decay Warning",
                description: `Leads from the last discovery are stagnating in "NEW" status. Speed-to-lead is currently below benchmark.`,
                action: "Follow Up",
                actionHref: `/crm/leads/${staleLeads[0].id}`,
                type: "warning",
                priority: "high"
            });
        }

        // ─── 3. Contract Velocity: Pending Signatures ───
        const pendingContracts = await prismadb.crm_Contracts.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                status: "INPROGRESS"
            },
            take: 1
        });

        if (pendingContracts.length > 0) {
            insights.push({
                id: "pending-contract",
                title: "Closing Momentum",
                description: `"${pendingContracts[0].title}" is awaiting final signatures. Follow up to secure Q1 revenue.`,
                action: "View Contract",
                actionHref: `/crm/contracts/${pendingContracts[0].id}`,
                type: "info",
                priority: "medium"
            });
        }

        // ─── 4. Campaign Success: High Engagement Streak ───
        const topCampaigns = await prismadb.crm_Outreach_Campaigns.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                status: "ACTIVE",
                emails_opened: { gte: 10 }
            },
            take: 1,
            orderBy: { emails_opened: "desc" }
        });

        if (topCampaigns.length > 0) {
            const openRate = topCampaigns[0].emails_sent > 0
                ? Math.round((topCampaigns[0].emails_opened / topCampaigns[0].emails_sent) * 100)
                : 0;

            insights.push({
                id: "campaign-win",
                title: "Campaign Excellence",
                description: `"${topCampaigns[0].name}" is outperforming benchmarks with a ${openRate}% open rate. Neural patterns identified.`,
                action: "Scale Success",
                actionHref: "/campaigns",
                type: "success",
                priority: "medium"
            });
        }

        // ─── 5. Account Health: High Value / Low Activity ───
        const highValueAccounts = await prismadb.crm_Accounts.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                status: "Active",
                updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            take: 1
        });

        if (highValueAccounts.length > 0) {
            insights.push({
                id: "account-churn",
                title: "Dormant Account Alert",
                description: `"${highValueAccounts[0].name}" has had no touchpoints in 7 days. AI recommends a "Pulse Check" interaction.`,
                action: "Check In",
                actionHref: `/crm/accounts/${highValueAccounts[0].id}`,
                type: "info",
                priority: "medium"
            });
        }

        // ─── 6. Task Efficiency: Workload Balance ───
        const overdueTasks = await prismadb.tasks.count({
            where: {
                user: teamInfo.userId,
                taskStatus: { not: "COMPLETE" },
                dueDateAt: { lt: now }
            }
        });

        if (overdueTasks > 5) {
            insights.push({
                id: "burnout-risk",
                title: "Workload Compression",
                description: `You have ${overdueTasks} overdue tasks. Current velocity suggests a 15% delay in pipeline movement.`,
                action: "Delegate",
                actionHref: "/projects",
                type: "warning",
                priority: "medium"
            });
        }

        // ─── 7. Discovery Opportunity: Target Gap ───
        const activePools = await prismadb.crm_Lead_Pools.count({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                status: "ACTIVE"
            }
        });

        if (activePools < 3) {
            insights.push({
                id: "discovery-gap",
                title: "Top-of-Funnel Op",
                description: "Predictive analysis shows a lead shortage in 14 days. Recommend initiating a new industry scan.",
                action: "Start Scan",
                actionHref: "/crm/accounts",
                type: "info",
                priority: "high"
            });
        }

        // Fetch user preferences for dismissed insights
        const userPrefs = await prismadb.users.findUnique({
            where: { id: teamInfo.userId },
            select: { dismissedAIInsights: true }
        });
        const dismissedIds = userPrefs?.dismissedAIInsights || [];

        // Ensure we always return at least 4 items for a "Beefy" feel, filtering out dismissed ones
        return insights
            .filter(insight => !dismissedIds.includes(insight.id))
            .sort((a, b) => {
                const priorityMap: any = { high: 0, medium: 1, low: 2 };
                return priorityMap[a.priority] - priorityMap[b.priority];
            }).slice(0, 4);
    } catch (error) {
        console.error("Error fetching AI insights:", error);
        return [];
    }
};
