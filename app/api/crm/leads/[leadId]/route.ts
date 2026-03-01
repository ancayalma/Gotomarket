import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getSessionAndTeam, validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

export async function DELETE(req: Request, props: { params: Promise<{ leadId: string }> }) {
  const params = await props.params;
  const { error, teamInfo, session } = await getSessionAndTeam();

  if (error) return error;

  if (!params.leadId) {
    return new NextResponse("Lead ID is required", { status: 400 });
  }

  try {
    // 1. Fetch the lead first to check ownership
    const lead = await prismadb.crm_Leads.findUnique({
      where: { id: params.leadId },
      select: { team_id: true, firstName: true, lastName: true }
    });

    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    // 2. Critical SOC2 Check: Does the user's team own this lead?
    if (!validateResourceOwnership(teamInfo!.teamId, lead.team_id, teamInfo!.isGlobalAdmin)) {
      return await unauthorizedResponse("DELETE", `crm_Leads:${params.leadId}`);
    }

    // 3. Perform Delete
    await prismadb.crm_Leads.delete({
      where: {
        id: params.leadId,
      },
    });

    // 4. Audit Log the deletion
    await logActivityInternal(
      session!.user.id,
      "RECORD_DELETE",
      "crm_Leads",
      `Deleted lead: ${lead.firstName} ${lead.lastName}`,
      teamInfo!.teamId || undefined
    );

    return NextResponse.json({ message: "Lead deleted" }, { status: 200 });
  } catch (error) {
    systemLogger.error("[LEAD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
