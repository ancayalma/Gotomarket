import { prismadb } from "./prisma";

/**
 * Resolves the team ID for billing purposes. 
 * If the team is a DEPARTMENT, it inherits its parent COMPANY's plan and token pools.
 */
export async function resolveBillingTeamId(teamId: string): Promise<string> {
    try {
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            select: { team_type: true, parent_id: true }
        });
        
        if (team?.team_type === "DEPARTMENT" && team.parent_id) {
            return team.parent_id;
        }
        return teamId;
    } catch {
        return teamId;
    }
}
