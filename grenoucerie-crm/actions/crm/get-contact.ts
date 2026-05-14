import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { isValidObjectId } from "@/lib/utils";

export const getContact = async (contactId: string) => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();

  if (!session || !teamInfo?.teamId) return null;

  if (!isValidObjectId(contactId)) return null;

  const whereClause: any = { id: contactId };
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }
  if (teamInfo?.teamRole === "MEMBER" || teamInfo?.teamRole === "VIEWER") {
    whereClause.assigned_to = teamInfo?.userId;
  }

  try {
    const data = await prismadb.crm_Contacts.findFirst({
      where: whereClause
    });
    return data;
  } catch (error) {
    console.error("GET_CONTACT_ERROR", error);
    return null;
  }
};
