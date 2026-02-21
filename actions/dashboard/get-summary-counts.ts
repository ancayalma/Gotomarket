"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export type DashboardCounts = {
  leads: number;
  tasks: number;
  boards: number;
  contacts: number;
  accounts: number;
  contracts: number;
  invoices: number;
  documents: number;
  opportunities: number; // Combined: CRM + Project opportunities
  users: number; // active users
  revenue: number; // Projected Revenue (All Invoices)
  actualRevenue: number; // Actual Revenue (Paid Invoices)
  storageMB: number; // total storage in MB (rounded to 2 decimals)
  leadPools: number;
};

export const getSummaryCounts = async (from?: Date, to?: Date): Promise<DashboardCounts> => {
  // Get team context for filtering
  const teamInfo = await getCurrentUserTeamId();
  if (from || to) {
    console.log('[getSummaryCounts] applying date filter:', { from, to });
  }

  const teamId = teamInfo?.teamId;
  const isGlobalAdmin = teamInfo?.isGlobalAdmin;

  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  const getCreatedAtFilter = (fieldName: string = "createdAt") => {
    return Object.keys(dateFilter).length > 0 ? { [fieldName]: dateFilter } : {};
  };

  // Helper to merge team filter with member restriction
  const getFilter = (modelField: "assigned_to" | "user" | "none" = "none", dateFieldName: string = "createdAt") => {
    let base: any = teamId ? { team_id: teamId } : teamInfo?.isImpersonating ? {} : { team_id: "no-team-fallback" };

    if (teamRole === "MEMBER") {
      if (modelField === "assigned_to") {
        base.assigned_to = teamInfo?.userId;
      } else if (modelField === "user") {
        base.user = teamInfo?.userId;
      }
    }

    // Merge date filter for most models
    return { ...base, ...getCreatedAtFilter(dateFieldName) };
  };

  const teamRole = teamInfo?.teamRole;

  // For documents: members see only their assigned or created docs
  const getDocumentFilter = () => {
    const base = teamId ? { team_id: teamId } : teamInfo?.isImpersonating ? {} : { team_id: "no-team-fallback" };
    const dateQuery = getCreatedAtFilter();

    if (teamRole === "MEMBER") {
      return {
        ...base,
        ...dateQuery,
        OR: [
          { created_by_user: teamInfo?.userId },
          { assigned_user: teamInfo?.userId }
        ]
      };
    }
    return { ...base, ...dateQuery };
  };

  // For project opportunities: members see only their created/assigned ones
  const getProjectOpportunityFilter = () => {
    const dateQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    if (teamRole === "MEMBER") {
      return {
        status: "OPEN",
        ...dateQuery,
        OR: [
          { createdBy: teamInfo?.userId },
          { assignedTo: teamInfo?.userId }
        ]
      };
    }
    return { status: "OPEN", ...dateQuery };
  };

  const getAccountFilter = () => {
    const base = getFilter("assigned_to");
    return {
      ...base,
      NOT: [
        { name: { startsWith: "Email -" } },
        { name: { startsWith: "Meeting" } },
        { name: { startsWith: "Call" } },
        { name: { startsWith: "Amazon SES" } },
        { name: { startsWith: "Project Documents" } },
      ]
    };
  };

  const getInvoiceFilter = () => {
    const base = teamId ? { team_id: teamId } : teamInfo?.isImpersonating ? {} : { team_id: "no-team-fallback" };
    const dateQuery = Object.keys(dateFilter).length > 0 ? { date_created: dateFilter } : {};
    return { ...base, ...dateQuery };
  };

  const getLeadPoolFilter = () => {
    const base = teamId ? { team_id: teamId } : teamInfo?.isImpersonating ? {} : { team_id: "no-team-fallback" };
    // For members, maybe restrict? For now, team-wide.
    return {
      ...base,
      status: "ACTIVE"
    };
  };

  const [
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices,
    documents,
    crmOpportunities,
    projectOpportunities,
    users,
    crmRevenueAgg,
    projectRevenueAgg,
    storageAgg,
    leadPools,
  ] = await Promise.all([
    prismadb.crm_Leads.count({ where: getFilter("assigned_to") }),
    prismadb.tasks.count({ where: getFilter("user") }),
    prismadb.boards.count({ where: getFilter("user") }),
    prismadb.crm_Contacts.count({ where: getFilter("assigned_to", "cratedAt") }),
    prismadb.crm_Accounts.count({ where: getAccountFilter() }),
    prismadb.crm_Contracts.count({ where: getFilter("assigned_to") }),
    // Fetch all invoices with amount and status for revenue calculation
    prismadb.invoices.findMany({
      where: getInvoiceFilter(),
      select: { invoice_amount: true, payment_status: true }
    }),
    prismadb.documents.count({ where: getDocumentFilter() }), // Member-specific document filter
    // Count CRM Opportunities
    prismadb.crm_Opportunities.count({ where: getFilter("assigned_to") }),
    // Count Project Opportunities - now filtered for members
    (prismadb.project_Opportunities as any).count({ where: getProjectOpportunityFilter() }),
    // Users: members see "1" (themselves), admins see team count
    prismadb.users.count({
      where: teamRole === "MEMBER"
        ? { id: teamInfo?.userId }
        : { ...(teamId ? { team_id: teamId } : teamInfo?.isImpersonating ? {} : { team_id: "no-team-fallback" }), userStatus: "ACTIVE" as any }
    }),
    // CRM Opportunities expected revenue (already filtered for members)
    prismadb.crm_Opportunities.aggregate({
      where: { ...getFilter("assigned_to"), status: "ACTIVE" as any },
      _sum: { expected_revenue: true }
    }),
    // Project Opportunities value estimate - now filtered for members
    (prismadb.project_Opportunities as any).aggregate({
      where: getProjectOpportunityFilter(),
      _sum: { valueEstimate: true }
    }),
    prismadb.documents.aggregate({ where: getDocumentFilter(), _sum: { size: true } }),
    prismadb.crm_Lead_Pools.count({ where: getLeadPoolFilter() }),
  ]);

  // Combine opportunities from both CRM and Project systems
  // UPDATE: User requested separation. ONLY Sales Pipeline counts as official "Opportunities" and "Revenue".
  // Project Requests are just internal tasks.
  const opportunities = crmOpportunities;

  // Combine revenue from both CRM opportunities and Project opportunities
  const crmRevenue = Number((crmRevenueAgg as any)._sum?.expected_revenue ?? 0);
  const projectRevenue = Number((projectRevenueAgg as any)._sum?.valueEstimate ?? 0);

  // Calculate Invoice-based Revenue
  let projectedRevenue = 0;
  let actualRevenue = 0;

  if (Array.isArray(invoices)) {
    (invoices as any[]).forEach((inv) => {
      const amount = parseFloat((inv.invoice_amount || "0").replace(/[^0-9.-]+/g, ""));
      if (!isNaN(amount)) {
        projectedRevenue += amount;
        if (inv.payment_status === "PAID") {
          actualRevenue += amount;
        }
      }
    });
  }

  const revenue = projectedRevenue;
  const invoicesCount = Array.isArray(invoices) ? invoices.length : 0;

  const storageBytes = Number((storageAgg as any)._sum?.size ?? 0);
  const storageMB = Math.round((storageBytes / 1_000_000) * 100) / 100;

  return {
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices: invoicesCount,
    documents,
    opportunities,
    users,
    revenue, // Projected
    actualRevenue, // Actual
    storageMB,
    leadPools,
  };
};
