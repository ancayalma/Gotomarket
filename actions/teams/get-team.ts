"use server";

import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

export const getTeam = async (teamId: string) => {
    try {
        const team = await prismadb.team.findUnique({
            where: {
                id: teamId,
            },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        team_role: true,
                    }
                }
            }
        });

        return team;
    } catch (error) {
        systemLogger.error("[GET_TEAM]", error);
        return null;
    }
};
