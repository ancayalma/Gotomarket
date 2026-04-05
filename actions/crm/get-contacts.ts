import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getContacts = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  if (!session || !teamInfo?.teamId) return [];

  let whereClause: any = {};
  if (teamInfo?.teamId) {
    if (teamInfo.isAdmin) {
      whereClause.team_id = teamInfo.teamId;
    } else {
      whereClause.OR = [
        { team_id: teamInfo.teamId },
        { assigned_to: session.user.id }
      ];
    }
  } else {
    // If no teamId (unlikely for proper setups), fallback to user assigned
    if (!teamInfo?.isAdmin) {
       whereClause.assigned_to = session.user.id;
    }
  }

  const data = await (prismadb.crm_Contacts as any).findMany({
    where: whereClause,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      crate_by_user: {
        select: {
          name: true,
        },
      },
      assigned_accounts: true,
    },
  });
  return data;
};
