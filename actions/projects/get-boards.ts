import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getBoards = async (userId: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) return [];

  const whereClause: any = {};
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  const data = await (prismadb.boards as any).findMany({
    where: whereClause,
    include: {
      assigned_user: {
        select: {
          name: true,
        },
      },
      // project_members: true // If needed
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return data;
};
