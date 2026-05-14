"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getOutreachStats = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return null;

        const campaigns = await prismadb.crm_Outreach_Campaigns.findMany({
            where: {
                team_id: teamInfo?.teamId,
                status: "ACTIVE"
            },
            select: {
                name: true,
                emails_sent: true,
                emails_opened: true,
                meetings_booked: true,
                total_leads: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 5
        });

        if (campaigns.length === 0) return null;

        const aggregate = (campaigns as any[]).reduce((acc: any, curr: any) => ({
            emails_sent: (acc.emails_sent || 0) + (curr.emails_sent || 0),
            emails_opened: (acc.emails_opened || 0) + (curr.emails_opened || 0),
            meetings_booked: (acc.meetings_booked || 0) + (curr.meetings_booked || 0),
            total_leads: (acc.total_leads || 0) + (curr.total_leads || 0)
        }), { emails_sent: 0, emails_opened: 0, meetings_booked: 0, total_leads: 0 });

        const openRate = aggregate.emails_sent > 0 ? (aggregate.emails_opened / aggregate.emails_sent) * 100 : 0;
        const bookingRate = aggregate.total_leads > 0 ? (aggregate.meetings_booked / aggregate.total_leads) * 100 : 0;

        return {
            campaigns,
            aggregate,
            openRate,
            bookingRate
        };
    } catch (error) {
        console.error("Error fetching outreach stats:", error);
        return null;
    }
};
