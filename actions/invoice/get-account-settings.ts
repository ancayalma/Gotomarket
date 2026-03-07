import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function getAccountSettings() {
  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) return null;

  const whereClause: any = {};
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  const myAccount = await prismadb.myAccount.findFirst({
    where: whereClause,
  });

  return myAccount;
}
