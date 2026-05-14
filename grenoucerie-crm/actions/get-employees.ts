import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getEmployees = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  if (!session || !teamInfo?.teamId) return [];

  const whereClause: any = {};
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  const data = await prismadb.employees.findMany({
    where: whereClause,
  });
  return data;
};
