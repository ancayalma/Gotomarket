"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function getSynthesisAnalytics() {
    try {
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        if (!teamId) {
            return { sentimentAvg: 0, intentDistribution: [], recentSignals: [], sentimentHistory: [] };
        }

        const nodes = await prismadb.contextNode.findMany({
            where: {
                OR: [
                    { account: { team_id: teamId } },
                    { lead: { team_id: teamId } }
                ]
            },
            select: {
                sentimentScore: true,
                intentLevel: true,
                summary: true,
                updatedAt: true,
                account: { select: { name: true } },
                lead: { select: { firstName: true, lastName: true } }
            },
            take: 100,
            orderBy: {
                updatedAt: 'desc'
            }
        });

        const totalNodes = nodes.length;
        if (totalNodes === 0) {
            return { sentimentAvg: 0, intentDistribution: [], recentSignals: [], sentimentHistory: [] };
        }

        let sentimentSum = 0;
        let countWithSentiment = 0;
        nodes.forEach((node: any) => {
            if (node.sentimentScore !== null && node.sentimentScore !== undefined) {
                sentimentSum += node.sentimentScore;
                countWithSentiment++;
            }
        });
        const sentimentAvg = countWithSentiment > 0 ? (sentimentSum / countWithSentiment) : 0;

        const intentCounts = nodes.reduce((acc: Record<string, number>, node: any) => {
            const intent = node.intentLevel || "UNKNOWN";
            acc[intent] = (acc[intent] || 0) + 1;
            return acc;
        }, {});

        const intentDistribution = Object.keys(intentCounts).map(key => ({
            intent: key,
            count: intentCounts[key],
            percentage: (intentCounts[key] / totalNodes) * 100
        }));

        // Mock history for chart
        const sentimentHistory = [
            { date: '1w ago', score: Math.max(-1, sentimentAvg - 0.2) },
            { date: '5d ago', score: Math.min(1, sentimentAvg + 0.1) },
            { date: '2d ago', score: Math.max(-1, sentimentAvg - 0.1) },
            { date: 'Today', score: sentimentAvg },
        ];

        return {
            sentimentAvg,
            intentDistribution,
            recentSignals: nodes.slice(0, 5),
            sentimentHistory
        };
    } catch (error) {
        console.error("Failed to fetch synthesis analytics:", error);
        return { sentimentAvg: 0, intentDistribution: [], recentSignals: [], sentimentHistory: [] };
    }
}
