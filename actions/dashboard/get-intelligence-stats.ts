"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { startOfMonth, subMonths } from "date-fns";

export const getIntelligenceStats = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;
        if (!teamId && !teamInfo?.isImpersonating) return null;

        const now = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // 1. Conversion Rate (Leads created in last 30 days that are now Opportunities or marked Converted)
        const recentLeads = await prismadb.crm_Leads.findMany({
            where: {
                ...(teamId ? { team_id: teamId } : teamInfo.isImpersonating ? {} : { team_id: "no-team" }),
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { status: true }
        });

        const totalLeads = recentLeads.length;
        const convertedLeads = recentLeads.filter(l => l.status === "CONVERTED" || l.status === "QUALIFIED").length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        // 2. Average Deal Size
        const opportunities = await prismadb.crm_Opportunities.aggregate({
            where: {
                ...(teamId ? { team_id: teamId } : teamInfo.isImpersonating ? {} : { team_id: "no-team" }),
                status: "ACTIVE"
            },
            _avg: {
                expected_revenue: true
            }
        });

        // 3. Response Time (Calculate average time from lead creation to first outreach)
        const outreachActivities = await prismadb.crm_Lead_Activities.findMany({
            where: {
                assigned_lead: {
                    ...(teamId ? { team_id: teamId } : teamInfo.isImpersonating ? {} : { team_id: "no-team" }),
                    createdAt: { gte: thirtyDaysAgo }
                },
                type: "email_sent"
            },
            include: {
                assigned_lead: {
                    select: { createdAt: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        const firstOutreachMap = new Map();
        outreachActivities.forEach((act: any) => {
            if (act.lead && !firstOutreachMap.has(act.lead)) {
                firstOutreachMap.set(act.lead, act);
            }
        });

        let totalMs = 0;
        let count = 0;
        firstOutreachMap.forEach((act: any) => {
            if (act.assigned_lead?.createdAt) {
                const diff = new Date(act.createdAt).getTime() - new Date(act.assigned_lead.createdAt).getTime();
                if (diff > 0) {
                    totalMs += diff;
                    count++;
                }
            }
        });

        const responseTime = count > 0 ? Math.round(totalMs / count / (1000 * 60)) : 0;

        return {
            conversionRate: Math.round(conversionRate),
            avgDealSize: Math.round(opportunities._avg.expected_revenue || 0),
            responseTime
        };
    } catch (error) {
        console.error("Error fetching intelligence stats:", error);
        return null;
    }
};
