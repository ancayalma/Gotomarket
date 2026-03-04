"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { startOfDay, subDays, format } from "date-fns";

export interface EngagementDay {
    date: string; // Changed to string for serialization safety
    count: number;
}

/**
 * Fetches real engagement pulse data from SystemActivity.
 * Serializes dates to strings to prevent "Unexpected response" errors in Next.js Server Actions.
 */
export const getEngagementPulse = async (days = 168): Promise<EngagementDay[]> => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.userId) return [];

        const teamId = teamInfo.teamId;
        const isGlobalAdmin = teamInfo.isGlobalAdmin;

        // Fetch activities from the last X days
        const startDate = startOfDay(subDays(new Date(), days));

        const activities = await prismadb.systemActivity.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                },
                ...(isGlobalAdmin ? {} : { team_id: teamId || "no-team" }),
            },
            select: {
                createdAt: true,
            },
        });

        // Group by day
        const countsByDay: Record<string, number> = {};

        // Initialize all days in range with 0 to ensure no gaps
        const today = new Date();
        for (let i = 0; i < days; i++) {
            const dateStr = format(subDays(today, i), "yyyy-MM-dd");
            countsByDay[dateStr] = 0;
        }

        activities.forEach((activity: { createdAt: Date }) => {
            const dateStr = format(activity.createdAt, "yyyy-MM-dd");
            if (countsByDay[dateStr] !== undefined) {
                countsByDay[dateStr]++;
            }
        });

        // Convert to array and sort by date
        const result: EngagementDay[] = Object.entries(countsByDay)
            .map(([dateStr, count]) => ({
                date: dateStr,
                count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return result;
    } catch (error) {
        console.error("[GET_ENGAGEMENT_PULSE_ERROR]", error);
        // Return empty array instead of throwing to prevent crashing the page
        return [];
    }
};
