"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

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
  revenue: number; // Total Projected (Actual + Unrealized + Forecast)
  actualRevenue: number; // Actual Revenue (Paid Invoices)
  unrealizedRevenue: number; // Unrealized Revenue (Unpaid Invoices)
  forecastRevenue: number; // Forecast Revenue (Opportunity Potential)
  storageMB: number; // total storage in MB (rounded to 2 decimals)
  leadPools: number;
};

export const getSummaryCounts = async (from?: Date, to?: Date): Promise<DashboardCounts> => {
  // Get team context for filtering
  const teamInfo = await getCurrentUserTeamId();
  if (from || to) {
    systemLogger.error('[getSummaryCounts] applying date filter:', { from, to });
  }

  const teamId = teamInfo?.teamId;
  const isGlobalAdmin = teamInfo?.isGlobalAdmin;
  const isActuallyGlobal = teamInfo?.isPlatformAdmin || teamInfo?.isGlobalAdmin;

  const dateFilter: any = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;

  const getCreatedAtFilter = (fieldName: string = "createdAt") => {
    return Object.keys(dateFilter).length > 0 ? { [fieldName]: dateFilter } : {};
  };

  // Helper to merge team filter with member restriction
  const getFilter = (modelField: "assigned_to" | "user" | "none" = "none", dateFieldName: string = "createdAt") => {
    // If Global Admin or impersonating, allow empty filter (all records) if teamId is null
    const normalizedRole = (teamRole || "").trim().toUpperCase();
    const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "OWNER" || isActuallyGlobal;

    let base: any = teamId ? { team_id: teamId } : isActuallyGlobal ? {} : { team_id: "no-team-fallback" };

    if (normalizedRole === "MEMBER") {
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
    const base = teamId ? { team_id: teamId } : isActuallyGlobal ? {} : { team_id: "no-team-fallback" };
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
    // Project_Opportunities does not have team_id directly, it inherits from assigned_project (Boards)
    const base = teamId ? { assigned_project: { team_id: teamId } } : isActuallyGlobal ? {} : { assigned_project: { team_id: "no-team-fallback" } };
    const dateQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const normalizedRole = (teamRole || "").trim().toUpperCase();

    if (normalizedRole === "MEMBER") {
      return {
        ...base,
        status: "OPEN",
        ...dateQuery,
        OR: [
          { createdBy: teamInfo?.userId },
          { assignedTo: teamInfo?.userId }
        ]
      };
    }
    return { ...base, status: "OPEN" as any, ...dateQuery };
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
    // SysAdms see everything by default if not strictly filtered
    const base = teamId ? { team_id: teamId } : (isActuallyGlobal ? {} : { team_id: "no-team-fallback" });
    const dateQuery = Object.keys(dateFilter).length > 0 ? { date_created: dateFilter } : {};
    return { ...base, ...dateQuery };
  };

  const getLeadPoolFilter = () => {
    const base = teamId ? { team_id: teamId } : isActuallyGlobal ? {} : { team_id: "no-team-fallback" };
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
      select: {
        id: true,
        invoice_amount: true,
        payment_status: true,
        opportunityIDs: true,
        projectOpportunityIDs: true
      }
    }),
    prismadb.documents.count({ where: getDocumentFilter() }), // Member-specific document filter
    // Fetch CRM Opportunities for detailed revenue calculation
    prismadb.crm_Opportunities.findMany({
      where: { ...getFilter("assigned_to"), status: "ACTIVE" as any },
      select: { id: true, expected_revenue: true, invoiceIDs: true }
    }),
    // Fetch Project Opportunities for detailed revenue calculation
    (prismadb.project_Opportunities as any).findMany({
      where: getProjectOpportunityFilter(),
      select: { id: true, valueEstimate: true, invoiceIDs: true }
    }),
    // Users: members see "1" (themselves), admins see team count
    prismadb.users.count({
      where: teamRole === "MEMBER"
        ? { id: teamInfo?.userId }
        : { ...(teamId ? { team_id: teamId } : isActuallyGlobal ? {} : { team_id: "no-team-fallback" }), userStatus: "ACTIVE" as any }
    }),
    prismadb.documents.aggregate({ where: getDocumentFilter(), _sum: { size: true } }),
    prismadb.crm_Lead_Pools.count({ where: getLeadPoolFilter() }),
  ]);

  // Combine opportunities from both CRM and Project systems for the 'opportunities' count
  const opportunities = (Array.isArray(crmOpportunities) ? crmOpportunities.length : 0) +
    (Array.isArray(projectOpportunities) ? projectOpportunities.length : 0);

  // Calculate Invoice-based Revenue and track invoiced totals per opportunity
  let invoiceRevenueTotal = 0;
  let actualRevenue = 0;
  const invoicedCrmOppMap = new Map<string, number>();
  const invoicedProjectOppMap = new Map<string, number>();

  if (Array.isArray(invoices)) {
    (invoices as any[]).forEach((inv) => {
      const amount = parseFloat((inv.invoice_amount || "0").replace(/[^0-9.-]+/g, ""));
      if (!isNaN(amount)) {
        invoiceRevenueTotal += amount;
        if (inv.payment_status === "PAID") {
          actualRevenue += amount;
        }

        // Track how much of each deal is already invoiced to avoid double-counting
        if (inv.opportunityIDs && Array.isArray(inv.opportunityIDs)) {
          inv.opportunityIDs.forEach((id: string) => {
            invoicedCrmOppMap.set(id, (invoicedCrmOppMap.get(id) || 0) + amount);
          });
        }
        if (inv.projectOpportunityIDs && Array.isArray(inv.projectOpportunityIDs)) {
          inv.projectOpportunityIDs.forEach((id: string) => {
            invoicedProjectOppMap.set(id, (invoicedProjectOppMap.get(id) || 0) + amount);
          });
        }
      }
    });
  }

  // Calculate Opportunity-based Revenue (Un-invoiced components)
  // "Source latest data": We add the portion of active opportunities that HAS NOT been invoiced yet.
  let activeOppRevenueRemnant = 0;
  if (Array.isArray(crmOpportunities)) {
    crmOpportunities.forEach((opp: any) => {
      const expected = Number(opp.expected_revenue || 0);
      const alreadyInvoiced = invoicedCrmOppMap.get(opp.id) || 0;

      // Also check if the opportunity record itself points to invoices (redundancy)
      const hasExplicitInvoices = opp.invoiceIDs && opp.invoiceIDs.length > 0;

      if (hasExplicitInvoices && alreadyInvoiced === 0) {
        // If it has invoices but we didn't find them in the 'invoices' list (maybe different filters?),
        // we should still be cautious about adding the full amount. 
        // For now, if it has explicit invoices, we assume they are the source of truth if we skip.
        // But the safest way to avoid the "XOINPAY" double-count is to skip if there's ANY link.
        return;
      }

      // Add only the amount exceed what's already been invoiced
      const remnant = Math.max(0, expected - alreadyInvoiced);
      activeOppRevenueRemnant += remnant;
    });
  }

  let openProjectOppRevenueRemnant = 0;
  if (Array.isArray(projectOpportunities)) {
    projectOpportunities.forEach((opp: any) => {
      const estimate = Number(opp.valueEstimate || 0);
      const alreadyInvoiced = invoicedProjectOppMap.get(opp.id) || 0;

      const hasExplicitInvoices = opp.invoiceIDs && opp.invoiceIDs.length > 0;
      if (hasExplicitInvoices && alreadyInvoiced === 0) return;

      const remnant = Math.max(0, estimate - alreadyInvoiced);
      openProjectOppRevenueRemnant += remnant;
    });
  }

  // Final Projected Revenue is the sum of all invoices + the un-invoiced potential from active deals
  const forecastRevenue = activeOppRevenueRemnant + openProjectOppRevenueRemnant;
  const unrealizedRevenue = invoiceRevenueTotal - actualRevenue;
  const revenue = invoiceRevenueTotal + forecastRevenue;

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
    revenue, // Total Projected
    actualRevenue, // Actual (Paid)
    unrealizedRevenue, // Unrealized (Unpaid)
    forecastRevenue, // Forecast (Remnant)
    storageMB,
    leadPools,
  };
};
