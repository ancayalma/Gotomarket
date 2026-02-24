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
        invoices.forEach(inv => {
            const amount = parseFloat((inv.invoice_amount || "0").replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount)) {
                currentRevenue += amount;
            }
        });

        // Set a realistic target based on typical monthly performance (~$10k default or based on current vol)
        const targetRevenue = 10000;

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
