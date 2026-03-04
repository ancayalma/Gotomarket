"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export const getRevenuePacing = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return null;

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const daysInMonth = differenceInDays(end, start) + 1;
        const currentDay = differenceInDays(now, start) + 1;
        const daysRemaining = daysInMonth - currentDay;

        // Fetch current month's revenue from INVOICES
        const invoices = await prismadb.invoices.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId }),
                date_created: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                invoice_amount: true
            }
        });

        let currentRevenue = 0;
        (invoices as any[]).forEach(inv => {
            const amount = parseFloat((inv.invoice_amount || "0").replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount)) {
                currentRevenue += amount;
            }
        });

        // Fetch team settings for the target - Native driver approach to bypass stale Prisma client
        let targetRevenue = 10000;
        try {
            const { dbAdapter } = await import("@/lib/database/db-adapter");
            const collection = await dbAdapter.getNativeCollection("Team");
            const { ObjectId } = await import("mongodb");

            const team = await collection.findOne({ _id: new ObjectId(teamInfo.teamId) as any });
            if (team && typeof team.revenue_target === "number") {
                targetRevenue = team.revenue_target;
            } else if (team && team.revenue_target) {
                // Handle string if it somehow got saved as such
                targetRevenue = parseInt(team.revenue_target.toString()) || 10000;
            }
        } catch (e) {
            console.warn("Native target fetch failed, using fallback:", e);
        }

        // Projection logic: Linear extrapolation
        const projectedEOM = currentDay > 0 ? (currentRevenue / currentDay) * daysInMonth : 0;

        return {
            currentRevenue,
            targetRevenue,
            projectedEOM,
            daysRemaining,
            progress: targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0
        };
    } catch (error) {
        console.error("Error fetching revenue pacing:", error);
        return null;
    }
};
