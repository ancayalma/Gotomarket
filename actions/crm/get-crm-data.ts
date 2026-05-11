"use server";

import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAllCrmData = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();

  if (!session || !teamInfo?.teamId) return { users: [], accounts: [], opportunities: [], leads: [], contacts: [], contracts: [], saleTypes: [], saleStages: [], campaigns: [], industries: [], boards: [] };

  const whereClause: any = {};
  if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

  // Users are special, maybe filter by team_id too?
  // Previous logic for users was just Active. Now we should filter by Team?
  // Prismadb.users has team_id.
  const usersWhere = {
    userStatus: "ACTIVE" as any,
    team_id: teamInfo?.teamId,
  };

  const accountsWhere = {
    ...whereClause,
    NOT: [
      { name: { startsWith: "Email -" } },
      { name: { startsWith: "Meeting" } },
      { name: { startsWith: "Call" } },
      { name: { startsWith: "Amazon SES" } },
      { name: { startsWith: "Project Documents" } },
    ],
  };

  const [
    users,
    accounts,
    opportunities,
    leads,
    contacts,
    contracts,
    saleTypes,
    saleStages,
    campaigns,
    industries,
    boards,
  ] = await Promise.all([
    prismadb.users.findMany({ where: usersWhere }),
    (prismadb.crm_Accounts as any).findMany({ where: accountsWhere }),
    prismadb.crm_Opportunities.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        expected_revenue: true,
        assigned_to: true,
        assigned_to_user: { select: { avatar: true, name: true } },
      }
    }),
    prismadb.crm_Leads.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, company: true, email: true, status: true, assigned_to: true }
    }),
    (prismadb.crm_Contacts as any).findMany({
      where: whereClause,
      select: { id: true, first_name: true, last_name: true, email: true, status: true, assigned_to: true }
    }),
    (prismadb.crm_Contracts as any).findMany({ where: whereClause }),
    prismadb.crm_Opportunities_Type.findMany({}),
    prismadb.crm_Opportunities_Sales_Stages.findMany({}),
    prismadb.crm_campaigns.findMany({}),
    prismadb.crm_Industry_Type.findMany({}),
    prismadb.boards.findMany({ select: { id: true, title: true } }),
  ]);

  const data = {
    users,
    accounts,
    opportunities,
    leads,
    contacts,
    contracts,
    saleTypes,
    saleStages,
    campaigns,
    industries,
    boards,
  };

  return data;
};
