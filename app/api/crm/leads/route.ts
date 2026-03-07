import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getSessionAndTeam, validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";
import { withValidation } from "@/lib/hoc/withValidation";
import { withAuditLog } from "@/lib/hoc/withAuditLog";
import { leadSchema, LeadInput } from "@/lib/validations/crm";
import { checkTeamQuota } from "@/lib/quota-service";

const isValidId = (id: any) => typeof id === "string" && id.length === 24;

// Get leads for current team
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    let whereClause: any = {
      team_id: teamId,
    };

    if (teamInfo && !teamInfo.isAdmin) {
      whereClause.assigned_to = teamInfo.userId;
    }

    const leads = await prismadb.crm_Leads.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        assigned_to: true,
        accountsIDs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    systemLogger.error("[LEADS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Create a new lead route
async function createLeadHandler(req: Request, body: LeadInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      first_name,
      last_name,
      company,
      jobTitle,
      email,
      phone,
      description,
      lead_source,
      refered_by,
      //campaign, // Replaced by social profiles
      social_twitter,
      social_facebook,
      social_linkedin,
      assigned_to,
      accountIDs,
    } = body;

    //console.log(req.body, "req.body");

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // SOC2 CC6.1 / A1.2: Check resource quotas before allowing creation
    if (teamId) {
      const quota = await checkTeamQuota(teamId, "LEADS");
      if (!quota.allowed) {
        return NextResponse.json({ error: quota.message }, { status: 403 });
      }
    }

    const searchOrConditions: any[] = [];
    if (email && email.trim() !== "") {
      searchOrConditions.push({ email: { equals: email } });
    }
    if (phone && phone.trim() !== "") {
      searchOrConditions.push({ phone: { equals: phone } });
    }

    let existingLead = null;
    if (searchOrConditions.length > 0) {
      existingLead = await (prismadb.crm_Leads as any).findFirst({
        where: {
          assigned_team: isValidId(teamId) ? { id: teamId } : undefined,
          OR: searchOrConditions,
        },
      });
    }

    if (existingLead) {
      // Merge: Update existing lead with new data if current fields are empty
      const updatedLead = await (prismadb.crm_Leads as any).update({
        where: { id: existingLead.id },
        data: {
          firstName: existingLead.firstName || first_name,
          lastName: existingLead.lastName || last_name,
          company: existingLead.company || company,
          jobTitle: existingLead.jobTitle || jobTitle,
          phone: existingLead.phone || phone,
          description: existingLead.description || description,
          lead_source: existingLead.lead_source || lead_source,
          refered_by: existingLead.refered_by || refered_by,
          social_twitter: existingLead.social_twitter || social_twitter,
          social_facebook: existingLead.social_facebook || social_facebook,
          social_linkedin: existingLead.social_linkedin || social_linkedin,
          updatedBy: userId,
        },
      });
      return NextResponse.json({ newLead: updatedLead }, { status: 200 });
    }

    const newLead = await (prismadb.crm_Leads as any).create({
      data: {
        v: 1,
        assigned_team: isValidId(teamId) ? { connect: { id: teamId } } : undefined,
        createdBy: userId,
        updatedBy: userId,
        firstName: first_name,
        lastName: last_name,
        company,
        jobTitle,
        email,
        phone,
        description,
        lead_source,
        refered_by,
        campaign: "", // Deprecated
        social_twitter,
        social_facebook,
        social_linkedin,
        assigned_to: assigned_to || userId,
        accountsIDs: accountIDs || undefined,
        status: "NEW",
        type: "DEMO",
        project: body.project || undefined,
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to as any,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject: `New lead ${first_name} ${last_name} has been added to the system and assigned to you.`,
        text: `New lead ${first_name} ${last_name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${newLead.id}`,
      });
    }

    return NextResponse.json({ newLead }, { status: 200 });
  } catch (error) {
    systemLogger.error("[NEW_LEAD_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export const POST = withAuditLog("Lead", withValidation(leadSchema, createLeadHandler));


//UPdate a lead route
export async function PUT(req: Request) {
  const { error, teamInfo, session } = await getSessionAndTeam();
  if (error) return error;

  try {
    const body = await req.json();
    const userId = session!.user.id;

    if (!body || !body.id) {
      return new NextResponse("Lead ID is required", { status: 400 });
    }

    const {
      id,
      firstName,
      lastName,
      // ... (destructured fields)
    } = body;

    // 1. Fetch current lead to check ownership
    const existingLead = await prismadb.crm_Leads.findUnique({
      where: { id },
      select: { team_id: true }
    });

    if (!existingLead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // 2. SOC2 Ownership Check
    if (!validateResourceOwnership(teamInfo!.teamId, existingLead.team_id, false)) {
      return await unauthorizedResponse("UPDATE", `crm_Leads:${id}`);
    }

    const updatedLead = await prismadb.crm_Leads.update({
      where: {
        id,
      },
      data: {
        v: 1,
        updatedBy: userId,
        firstName: body.firstName,
        lastName: body.lastName,
        company: body.company,
        jobTitle: body.jobTitle,
        email: body.email,
        phone: body.phone,
        description: body.description,
        lead_source: body.lead_source,
        refered_by: body.refered_by,
        campaign: body.campaign,
        social_twitter: body.social_twitter,
        social_facebook: body.social_facebook,
        social_linkedin: body.social_linkedin,
        assigned_to: body.assigned_to || userId,
        accountsIDs: body.accountIDs,
        status: body.status,
        type: body.type,
        project: body.project,
      },
    });

    // 3. Audit Log
    await logActivityInternal(
      userId,
      "USER_UPDATE",
      "crm_Leads",
      `Updated lead: ${updatedLead.firstName} ${updatedLead.lastName}`,
      teamInfo!.teamId || undefined
    );

    if (body.assigned_to && body.assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: body.assigned_to,
        },
      });

      if (notifyRecipient) {
        await sendEmail({
          from: process.env.EMAIL_FROM as string,
          to: notifyRecipient.email || "info@softbase.com",
          subject: `Lead ${firstName} ${lastName} has been updated and assigned to you.`,
          text: `Lead ${firstName} ${lastName} has been updated and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${updatedLead.id}`,
        });
      }
    }

    return NextResponse.json({ updatedLead }, { status: 200 });
  } catch (error) {
    systemLogger.error("[UPDATED_LEAD_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
