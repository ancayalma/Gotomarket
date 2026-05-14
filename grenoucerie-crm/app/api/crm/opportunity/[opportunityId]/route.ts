import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getSessionAndTeam, validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

export async function PUT(req: Request, props: { params: Promise<{ opportunityId: string }> }) {
  const params = await props.params;
  const { opportunityId } = params;
  const { error, teamInfo, session } = await getSessionAndTeam();

  if (error) return error;

  if (!opportunityId) {
    return new NextResponse("Opportunity ID is required", { status: 400 });
  }

  try {
    const body = await req.json();
    const { destination } = body;

    // 1. Fetch current opportunity to check ownership
    const opportunity = await prismadb.crm_Opportunities.findUnique({
      where: { id: opportunityId },
      select: { team_id: true, name: true, account: true, assigned_to: true, expected_revenue: true }
    });

    if (!opportunity) {
      return new NextResponse("Opportunity not found", { status: 404 });
    }

    // 2. SOC2 Ownership Check
    if (!validateResourceOwnership(teamInfo!.teamId, opportunity.team_id, false)) {
      return await unauthorizedResponse("UPDATE", `crm_Opportunities:${opportunityId}`);
    }

    const newStage = await prismadb.crm_Opportunities_Sales_Stages.findUnique({
      where: { id: destination },
    });

    if (
      newStage?.probability === 100 ||
      newStage?.name === "Complete" ||
      newStage?.name === "Closed Won" ||
      newStage?.name === "Realization of the project"
    ) {
      if (!opportunity.account) {
        const newAccount = await prismadb.crm_Accounts.create({
          data: {
            name: opportunity.name || "New Account",
            status: "Active",
            assigned_to: opportunity.assigned_to,
            annual_revenue: String(opportunity.expected_revenue),
            team_id: teamInfo!.teamId,
            v: 0,
          },
        });

        await prismadb.crm_Opportunities.update({
          where: { id: opportunityId },
          data: {
            sales_stage: destination,
            account: newAccount.id,
          },
        });
      } else {
        await prismadb.crm_Opportunities.update({
          where: { id: opportunityId },
          data: {
            sales_stage: destination,
          },
        });
      }
    } else {
      await prismadb.crm_Opportunities.update({
        where: { id: opportunityId },
        data: {
          sales_stage: destination,
        },
      });
    }

    // Return only opportunities for the user's team
    const data = await prismadb.crm_Opportunities.findMany({
      where: { team_id: teamInfo!.teamId },
      include: {
        assigned_to_user: {
          select: {
            avatar: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Opportunity updated", data },
      { status: 200 }
    );
  } catch (error) {
    systemLogger.error("[OPPORTUNITY_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ opportunityId: string }> }) {
  const params = await props.params;
  const { opportunityId } = params;
  const { error, teamInfo, session } = await getSessionAndTeam();

  if (error) return error;

  if (!opportunityId) {
    return new NextResponse("Opportunity ID is required", { status: 400 });
  }

  try {
    // 1. Fetch current opportunity to check ownership
    const opportunity = await prismadb.crm_Opportunities.findUnique({
      where: { id: opportunityId },
      select: { team_id: true, name: true }
    });

    if (!opportunity) {
      return new NextResponse("Opportunity not found", { status: 404 });
    }

    // 2. SOC2 Ownership Check
    if (!validateResourceOwnership(teamInfo!.teamId, opportunity.team_id, false)) {
      return await unauthorizedResponse("DELETE", `crm_Opportunities:${opportunityId}`);
    }

    await prismadb.crm_Opportunities.delete({
      where: {
        id: opportunityId,
      },
    });

    await logActivityInternal(
      session!.user.id,
      "RECORD_DELETE",
      "crm_Opportunities",
      `Deleted opportunity: ${opportunity.name}`,
      teamInfo!.teamId || undefined
    );

    return NextResponse.json(
      { message: "Opportunity deleted" },
      { status: 200 }
    );
  } catch (error) {
    systemLogger.error("[OPPORTUNITY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
