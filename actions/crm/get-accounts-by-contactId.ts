import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAccountsByContactId = async (contactId: string) => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();

  if (!session || !teamInfo?.teamId) return [];

  const whereClause: any = {
    contacts: {
      some: {
        id: contactId,
      },
    },
  };
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }
  if (teamInfo?.teamRole === "MEMBER" || teamInfo?.teamRole === "VIEWER") {
    whereClause.assigned_to = teamInfo?.userId;
  }

  const data = await prismadb.crm_Accounts.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      status: true,
      industry: true,
      createdAt: true,
      assigned_to_user: { select: { name: true } },
      contacts: { select: { first_name: true, last_name: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
