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

  try {
    const data = await prismadb.crm_Accounts.findMany({
      where: whereClause,
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        industry: true,
        createdAt: true,
        email: true,
        type: true,
        billing_city: true,
        billing_state: true,
        billing_country: true,
        employees: true,
        annual_revenue: true,
        vat: true,
        company_id: true,
        description: true,
        assigned_to_user: { select: { name: true } },
        contacts: { select: { first_name: true, last_name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return data;
  } catch (error) {
    console.error("GET_ACCOUNTS_ERROR", error);
    return [];
  }
};
