import { prismadb } from "@/lib/prisma";

export const getOpportunitiesFullByAccountId = async (accountId: string) => {
  // Guard: skip query if accountId is not a valid MongoDB ObjectID (24 hex chars)
  if (!accountId || !/^[a-f0-9]{24}$/i.test(accountId)) return [];
  const data = await prismadb.crm_Opportunities.findMany({
    where: {
      account: accountId,
    },
    include: {
      assigned_account: {
        select: {
          name: true,
        },
      },
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return data;
};
