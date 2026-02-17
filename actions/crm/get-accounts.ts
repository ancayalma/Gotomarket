import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAccounts = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

  const baseWhere: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    baseWhere.team_id = teamInfo?.teamId;
  }

  // Account-specific filters (Removed hardcoded filters)
  const accountWhere = {
    ...baseWhere,
  };

  const data = await (prismadb.crm_Accounts as any).findMany({
    where: accountWhere,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
};
