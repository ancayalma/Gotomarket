import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/** Quick check: is `id` a 24-hex-character MongoDB ObjectID? */
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export const getUserInvoices = async (userId: string) => {
  // Guard: If the dynamic segment isn't a valid ObjectID, bail early
  // (e.g. "/invoice/detail" sends userId="detail")
  if (!isValidObjectId(userId)) return [];

  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  const teamId = teamInfo?.teamId;

  if (!session || !teamId) return [];

  // Assuming userId should be in the same team?
  // Ideally check if userId is in team. But team_id filter on invoice is safer.

  const data = await (prismadb.invoices as any).findMany({
    where: {
      assigned_user_id: userId,
      team_id: teamId,
    },

    orderBy: {
      date_created: "desc",
    },
  });

  return data;
};
