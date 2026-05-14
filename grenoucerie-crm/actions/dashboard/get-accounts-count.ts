import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAccountsCount = async () => {
  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) return 0;

  const data = await prismadb.crm_Accounts.count({
    where: { team_id: teamInfo.teamId }
  });
  return data;
};
