import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";

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
        assigned_team: teamId ? { connect: { id: teamId } } : undefined,
        assigned_account: finalAccountId ? { connect: { id: finalAccountId } } : undefined,
        assigned_to_user: finalAssignedTo ? { connect: { id: finalAssignedTo } } : { connect: { id: userId } },
        assigned_project: assign_to_project ? { connect: { id: assign_to_project } } : undefined,
        budget: Number(budget) || 0,
        lead_source: lead_source,
        close_date: close_date ? new Date(close_date) : undefined,
        contacts: contact ? { connect: [{ id: contact }] } : undefined,
        assigned_lead: lead ? { connect: { id: lead } } : undefined,
        created_by_user: userId ? { connect: { id: userId } } : undefined,
        last_activity_by: userId,
        updatedBy: userId,
        currency: currency,
        description: description,
        expected_revenue: Number(expected_revenue) || 0,
        name: name,
        next_step: next_step,
        assigned_sales_stage: (sales_stage && sales_stage.length === 24) ? { connect: { id: sales_stage } } : undefined,
        assigned_type: (type && type.length === 24) ? { connect: { id: type } } : undefined,
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      id,
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

    //console.log(req.body, "req.body");

    const updatedOpportunity = await (prismadb.crm_Opportunities as any).update({
      where: { id },
      data: {
        assigned_account: account ? { connect: { id: account } } : undefined,
        assigned_to_user: assigned_to ? { connect: { id: assigned_to } } : undefined,
        assigned_project: assign_to_project ? { connect: { id: assign_to_project } } : undefined,
        budget: Number(budget) || 0,
        lead_source: lead_source,
        close_date: close_date ? new Date(close_date) : undefined,
        contacts: contact ? { set: [{ id: contact }] } : undefined,
        assigned_lead: lead ? { connect: { id: lead } } : undefined,
        updatedBy: userId,
        currency: currency,
        description: description,
        expected_revenue: Number(expected_revenue) || 0,
        name: name,
        next_step: next_step,
        assigned_sales_stage: (sales_stage && sales_stage.length === 24) ? { connect: { id: sales_stage } } : undefined,
        assigned_type: (type && type.length === 24) ? { connect: { id: type } } : undefined,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ updatedOpportunity }, { status: 200 });
  } catch (error) {
    console.log("[UPDATED_OPPORTUNITY_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
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
