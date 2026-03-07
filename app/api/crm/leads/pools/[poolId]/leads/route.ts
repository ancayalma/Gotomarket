import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { prismadbCrm } from "@/lib/prisma-crm";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

// GET /api/crm/leads/pools/[poolId]/leads?mine=true
// Returns leads converted from a pool; if mine=true, restrict to current user's assigned leads.
export async function GET(req: Request, context: { params: Promise<{ poolId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { poolId } = await context.params;
    if (!poolId) return new NextResponse("Missing poolId", { status: 400 });

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "true";

    // Verify user role directly
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true }
    });

    // Permission check
    // 1. Global Admin (simplified check or rely on isGlobalAdmin from teamInfo if reliable, but role is better)
    // 2. Pool Owner
    // 3. Team Admin (if pool is in team)

    const teamInfo = await getCurrentUserTeamId();
    const isTeamAdmin = teamInfo?.isAdmin;

    // Fetch pool with team_id and assigned_members
    const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
      where: { id: poolId },
      select: { user: true, team_id: true, assigned_members: true },
    });

    if (!pool) return new NextResponse("Pool not found", { status: 404 });

    const isOwner = pool.user === session.user.id;
    const isTeamMatch = pool.team_id === teamInfo?.teamId;
    const isAssigned = Array.isArray(pool.assigned_members) && pool.assigned_members.includes(session.user.id);

    // RBAC logic:
    // 1. Global Admin (GOD MODE) -> Always allow
    // 2. Creator (isOwner) -> Always allow
    // 3. Team Admin/Owner (isTeamAdmin && isTeamMatch) -> Allow team management
    // 4. Member (isAssigned) -> Allow access if list is assigned to them

    if (isOwner || (isTeamAdmin && isTeamMatch) || isAssigned) {
      // Access granted
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get lead ids linked to this pool through crm_Lead_Pools_Leads
    const poolLeads = await (prismadbCrm as any).crm_Lead_Pools_Leads.findMany({
      where: { pool: poolId },
      select: { lead: true },
    });
    const leadIds = poolLeads.map((pl: any) => pl.lead);

    // Fetch leads from primary DB and restrict to mine if requested (assigned_to=user)
    const leads = await prismadb.crm_Leads.findMany({
      where: {
        id: { in: leadIds },
        ...(mine ? { assigned_to: session.user.id } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        email: true,
        phone: true,
        description: true,
        lead_source: true,
        status: true,
        type: true,
        outreach_status: true,
        outreach_sent_at: true,
        outreach_opened_at: true,
        outreach_meeting_booked_at: true,
        outreach_meeting_link: true,
        outreach_notes: true,
        pipeline_stage: true,
        sms_status: true,
        call_status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" as const },
    });

    // Also fetch candidates to show potentially unconverted pool members
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
      where: { pool: poolId },
      include: {
        contacts: {
          orderBy: { confidence: "desc" },
          take: 1,
        },
      },
    });

    // Separate candidates
    const activeCandidates = candidates.filter((c: any) => c.status !== "CONVERTED");
    const convertedCandidates = candidates.filter((c: any) => c.status === "CONVERTED" && c.accountsIDs);

    // Fetch Converted Accounts
    const accountIds = convertedCandidates.map((c: any) => c.accountsIDs);
    const convertedAccounts = await (prismadbCrm as any).crm_Accounts.findMany({
      where: { id: { in: accountIds } },
      include: { contacts: true, leads: true }
    });

    const accountItems = [];
    for (const acc of convertedAccounts) {
      const fallbackEmail = acc.email || (acc.additional_emails && acc.additional_emails.length > 0 ? acc.additional_emails[0] : "");

      // Try to find a primary lead record for outreach status
      const primaryLead = acc.leads && acc.leads.length > 0 ? acc.leads[0] : null;

      if (acc.contacts && acc.contacts.length > 0) {
        for (const contact of acc.contacts) {
          accountItems.push({
            id: contact.id,
            accountId: acc.id,
            contactId: contact.id,
            firstName: contact.first_name || "",
            lastName: contact.last_name || "",
            company: acc.name,
            jobTitle: contact.position || contact.job_title || "",
            email: contact.email || fallbackEmail,
            phone: contact.mobile_phone || contact.office_phone || acc.office_phone || "",
            description: acc.description || "",
            lead_source: "POOL_ACCOUNT",
            status: primaryLead?.outreach_status !== "IDLE" ? primaryLead?.outreach_status : (primaryLead?.status || acc.status || "CONVERTED"),
            type: "CLIENT",
            outreach_status: primaryLead?.outreach_status || "IDLE",
            pipeline_stage: primaryLead?.pipeline_stage || acc.type || "Lead",
            createdAt: acc.createdAt,
            updatedAt: acc.updatedAt
          });
        }
      } else {
        // Account with no contacts
        accountItems.push({
          id: acc.id,
          accountId: acc.id,
          contactId: null,
          firstName: "",
          lastName: acc.name,
          company: acc.name,
          jobTitle: "",
          email: fallbackEmail,
          phone: acc.office_phone || "",
          description: acc.description || "",
          lead_source: "POOL_ACCOUNT",
          status: primaryLead?.outreach_status !== "IDLE" ? primaryLead?.outreach_status : (primaryLead?.status || acc.status || "CONVERTED"),
          type: "CLIENT",
          outreach_status: primaryLead?.outreach_status || "IDLE",
          pipeline_stage: primaryLead?.pipeline_stage || acc.type || "Lead",
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt
        });
      }
    }

    const candidateItems = activeCandidates.map((c: any) => {
      const contact = c.contacts?.[0];
      const nameParts = contact?.fullName?.split(" ") || [];
      const lastName = nameParts.length > 1 ? nameParts.pop() : (contact?.fullName || c.companyName || "Candidate");
      const firstName = nameParts.join(" ");

      // Extract email from description if missing (regex)
      let email = contact?.email || c.email;
      if (!email && c.description) {
        const match = c.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) email = match[0];
      }

      return {
        id: c.id,
        accountId: c.accountsIDs || null,
        contactId: null, // Candidates don't have a contact ID in the main contacts table yet
        firstName: firstName || "",
        lastName: lastName as string,
        company: c.companyName || null,
        jobTitle: contact?.title || null,
        email: email || null,
        phone: contact?.phone || null,
        description: c.description,
        lead_source: "POOL_CANDIDATE",
        status: c.status || "IDENTIFIED",
        type: "CANDIDATE",
        outreach_status: "IDLE",
        pipeline_stage: "Identify",
        createdAt: c.freshnessAt || new Date(),
        updatedAt: new Date(),
      };
    });

    // Merge and sort (Legacy Leads + New Account Items + Unconverted Candidates)
    const allLeads = [...leads, ...accountItems, ...candidateItems].sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json({ leads: allLeads }, { status: 200 });
  } catch (error) {
    systemLogger.error("[POOL_LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
