import { prismadb } from "@/lib/prisma";

export const getOpportunitiesFullByContactId = async (contactId: string) => {
  const data = await prismadb.crm_Opportunities.findMany({
    where: {
      connected_contacts: {
        has: contactId,
      },
    },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      next_step: true,
      budget: true,
      expected_revenue: true,
      status: true,
      close_date: true,
      created_on: true,
      assigned_account: { select: { name: true } },
      assigned_sales_stage: { select: { name: true } },
      assigned_to_user: { select: { name: true, avatar: true } },
      assigned_lead: { select: { firstName: true, lastName: true } },
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return data;
};
