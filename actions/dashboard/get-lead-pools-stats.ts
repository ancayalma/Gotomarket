"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getLeadPoolsStats = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

        const pools = await prismadb.crm_Lead_Pools.findMany({
            where: {
                ...(teamInfo.isGlobalAdmin ? {} : {
                    OR: [
                        { team_id: teamInfo.teamId },
                        { user: teamInfo.userId }
                    ]
                }),
                status: "ACTIVE"
            },
            include: {
                _count: {
                    select: {
                        lead_maps: true,
                        candidates: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const activePools = pools.filter(pool => pool._count.lead_maps > 0 || pool._count.candidates > 0).slice(0, 10);

        // For each active pool, get detailed engagement stats
        const poolsWithStats = await Promise.all(activePools.map(async (pool) => {
            // Get leads linked to this pool
            const poolLeads = await (prismadb as any).crm_Lead_Pools_Leads.findMany({
                where: { pool: pool.id },
                select: { lead: true }
            });
            const leadIds = poolLeads.map((pl: any) => pl.lead);

            // Fetch engagement stats from crm_Leads
            const engagement = await prismadb.crm_Leads.aggregate({
                where: { id: { in: leadIds } },
                _count: {
                    id: true,
                },
                _sum: {
                    // Note: We'll count by status presence since we don't have direct counters on Leads for aggregate
                }
            });

            // More precise counts
            const contactedCount = await prismadb.crm_Leads.count({
                where: {
                    id: { in: leadIds },
                    outreach_status: { not: "IDLE" }
                }
            });

            const openedCount = await prismadb.crm_Leads.count({
                where: {
                    id: { in: leadIds },
                    outreach_status: { in: ["OPENED", "MEETING_LINK_CLICKED", "MEETING_BOOKED"] }
                }
            });

            return {
                id: pool.id,
                name: pool.name,
                leadCount: pool._count.lead_maps,
                candidateCount: pool._count.candidates,
                contactedCount,
                openedCount,
                total: pool._count.lead_maps + pool._count.candidates
            };
        }));

        return poolsWithStats;
    } catch (error) {
        console.error("Error fetching lead pools stats:", error);
        return [];
    }
};
