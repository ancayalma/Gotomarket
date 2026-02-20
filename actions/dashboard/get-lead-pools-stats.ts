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

        return activePools.map(pool => ({
            id: pool.id,
            name: pool.name,
            leadCount: pool._count.lead_maps,
            candidateCount: pool._count.candidates,
            total: pool._count.lead_maps + pool._count.candidates
        }));
    } catch (error) {
        console.error("Error fetching lead pools stats:", error);
        return [];
    }
};
