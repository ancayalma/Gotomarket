import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getInvoices = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  if (!session || !teamInfo?.teamId) return [];

  const whereClause: any = {};
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  const data = await (prismadb.invoices as any).findMany({
    where: whereClause,
    include: {
      users: {
        select: {
          name: true,
        },
      },
      opportunities: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      date_created: "desc",
    },
  });

  return data;
};
