import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getSessionAndTeam, validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";

const isValidId = (id: any) => typeof id === "string" && id.length === 24;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      account,
      assigned_to,
      assign_to_project,
      budget,
      lead_source,
      close_date,
      contact,
      lead,
      currency,
      description,
      expected_revenue,
      name,
      next_step,
      sales_stage,
      type,
    } = body;

    // Auto-resolve unspecified bindings from parent Lead
    let finalAccountId = account;
    let finalAssignedTo = assigned_to;

    if (lead && (!finalAccountId || !finalAssignedTo)) {
      const sourceLead = await prismadb.crm_Leads.findUnique({
        where: { id: lead },
        select: { accountsIDs: true, assigned_to: true }
      });
      if (sourceLead) {
        if (!finalAccountId && sourceLead.accountsIDs) {
          finalAccountId = sourceLead.accountsIDs;
        }
        if (!finalAssignedTo && sourceLead.assigned_to) {
          finalAssignedTo = sourceLead.assigned_to;
        }
      }
    }

    const newOpportunity = await (prismadb.crm_Opportunities as any).create({
      data: {
        v: 0,
        assigned_team: isValidId(teamId) ? { connect: { id: teamId } } : undefined,
        assigned_account: isValidId(finalAccountId) ? { connect: { id: finalAccountId } } : undefined,
        assigned_to_user: isValidId(finalAssignedTo) ? { connect: { id: finalAssignedTo } } : { connect: { id: userId } },
        assigned_project: isValidId(assign_to_project) ? { connect: { id: assign_to_project } } : undefined,
        budget: Number(budget) || 0,
        lead_source: lead_source,
        close_date: close_date ? new Date(close_date) : undefined,
        contacts: isValidId(contact) ? { connect: [{ id: contact }] } : undefined,
        assigned_lead: isValidId(lead) ? { connect: { id: lead } } : undefined,
        created_by_user: isValidId(userId) ? { connect: { id: userId } } : undefined,
        last_activity_by: isValidId(userId) ? userId : undefined,
        updatedBy: isValidId(userId) ? userId : undefined,
        currency: currency,
        description: description,
        expected_revenue: Number(expected_revenue) || 0,
        name: name,
        next_step: next_step,
        assigned_sales_stage: isValidId(sales_stage) ? { connect: { id: sales_stage } } : undefined,
        assigned_type: isValidId(type) ? { connect: { id: type } } : undefined,
        status: "ACTIVE",
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject: `New opportunity ${name} has been added to the system and assigned to you.`,
        text: `New opportunity ${name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newOpportunity.id}`,
      });
    }

    return NextResponse.json({ newOpportunity }, { status: 200 });
  } catch (error) {
    console.log("[NEW_OPPORTUNITY_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
export async function PUT(req: Request) {
  const { error, teamInfo, session } = await getSessionAndTeam();
  if (error) return error;

  try {
    const body = await req.json();
    const userId = session!.user.id;

    if (!body || !body.id) {
      return new NextResponse("ID required", { status: 400 });
    }

    const {
      id,
      // ... (other fields)
    } = body;

    // 1. Fetch current opportunity to check ownership
    const existingOpportunity = await prismadb.crm_Opportunities.findUnique({
      where: { id },
      select: { team_id: true, name: true }
    });

    if (!existingOpportunity) {
      return new NextResponse("Opportunity not found", { status: 404 });
    }

    // 2. SOC2 Ownership Check
    if (!validateResourceOwnership(teamInfo!.teamId, existingOpportunity.team_id, teamInfo!.isGlobalAdmin)) {
      return await unauthorizedResponse("UPDATE", `crm_Opportunities:${id}`);
    }

    const updatedOpportunity = await (prismadb.crm_Opportunities as any).update({
      where: { id },
      data: {
        assigned_account: isValidId(body.account) ? { connect: { id: body.account } } : undefined,
        assigned_to_user: isValidId(body.assigned_to) ? { connect: { id: body.assigned_to } } : undefined,
        assigned_project: isValidId(body.assign_to_project) ? { connect: { id: body.assign_to_project } } : undefined,
        budget: Number(body.budget) || 0,
        lead_source: body.lead_source,
        close_date: body.close_date ? new Date(body.close_date) : undefined,
        contacts: isValidId(body.contact) ? { set: [{ id: body.contact }] } : undefined,
        assigned_lead: isValidId(body.lead) ? { connect: { id: body.lead } } : undefined,
        updatedBy: isValidId(userId) ? userId : undefined,
        currency: body.currency,
        description: body.description,
        expected_revenue: Number(body.expected_revenue) || 0,
        name: body.name,
        next_step: body.next_step,
        assigned_sales_stage: isValidId(body.sales_stage) ? { connect: { id: body.sales_stage } } : undefined,
        assigned_type: isValidId(body.type) ? { connect: { id: body.type } } : undefined,
        status: "ACTIVE",
      },
    });

    // 3. Audit Log
    await logActivityInternal(
      userId,
      "USER_UPDATE",
      "crm_Opportunities",
      `Updated opportunity: ${updatedOpportunity.name}`,
      teamInfo!.teamId || undefined
    );

    return NextResponse.json({ updatedOpportunity }, { status: 200 });
  } catch (error) {
    console.log("[UPDATED_OPPORTUNITY_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const where: any = {};
    if (teamInfo?.teamId) {
      where.team_id = teamInfo.teamId;
    } else {
      return NextResponse.json({
        users: [],
        accounts: [],
        contacts: [],
        saleTypes: [],
        saleStages: [],
        campaigns: [], // Potentially needs team_id too
        industries: []
      }, { status: 200 });
    }

    const users = await (prismadb.users as any).findMany({
      where: { team_id: teamInfo.teamId }
    });
    const accounts = await (prismadb.crm_Accounts as any).findMany({
      where: where
    });
    const contacts = await (prismadb.crm_Contacts as any).findMany({
      where: where
    });
    const saleTypes = await prismadb.crm_Opportunities_Type.findMany({});
    const saleStages = await prismadb.crm_Opportunities_Sales_Stages.findMany(
      {}
    );
    const leads = await (prismadb.crm_Leads as any).findMany({
      where: where
    });
    // Assuming campaigns are global for now, or need update. If global, no where.
    const campaigns = await prismadb.crm_campaigns.findMany({});
    const industries = await prismadb.crm_Industry_Type.findMany({});

    const opportunities = await prismadb.crm_Opportunities.findMany({
      where: where,
      orderBy: {
        created_on: "desc",
      },
    });

    const data = {
      users,
      accounts,
      contacts,
      leads,
      opportunities,
      saleTypes,
      saleStages,
      campaigns,
      industries,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log("[GET_OPPORTUNITIES]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
