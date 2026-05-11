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
      where: whereClause,
      include: {
        assigned_opportunities: {
          take: 100,
          select: { id: true, name: true, description: true, next_step: true, budget: true, expected_revenue: true, status: true, close_date: true }
        },
        assigned_documents: {
          take: 100,
          select: { id: true, document_name: true, document_file_url: true, document_file_mimeType: true }
        },
        assigned_accounts: {
          select: { id: true, name: true, industry: true }
        },
      },
    });
    return data;
  } catch (error) {
    console.error("GET_CONTACT_ERROR", error);
    return null;
  }
};
