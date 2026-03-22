import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processDealWithAgent } from "@/lib/agents/deal-agent";
import { systemLogger } from "@/lib/logger";
import { prismadb } from "@/lib/prisma";

/**
 * POST /api/agents/deal/process
 *
 * Triggers the agentic deal engine for a specific opportunity.
 * Body: {
 *   opportunityId: string;
 *   replySnippet?: string;  // Latest reply from the prospect
 * }
 *
 * Can be called:
 * - Automatically by the email-sync cron when a positive reply is detected
 * - Manually from the campaign contact tracker UI
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Also accept cron secret for automated triggers
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const body = await req.json();

    if (!body.opportunityId) {
      return new NextResponse("opportunityId is required", { status: 400 });
    }

    // Load opportunity context
    const opportunity = await prismadb.crm_Opportunities.findUnique({
      where: { id: body.opportunityId },
      select: {
        id: true,
        account: true,
        contact: true,
        lead_id: true,
        campaign: true,
        assigned_to: true,
        team_id: true,
      },
    });

    if (!opportunity || !opportunity.account) {
      return NextResponse.json({ error: "Opportunity not found or no account linked" }, { status: 404 });
    }

    // Load campaign document IDs if linked
    let documentIds: string[] = [];
    if (opportunity.campaign) {
      const campaign = await prismadb.crm_Outreach_Campaigns.findUnique({
        where: { id: opportunity.campaign },
        select: { document_ids: true },
      });
      documentIds = campaign?.document_ids || [];
    }

    const userId = session?.user?.id || opportunity.assigned_to || "";

    const result = await processDealWithAgent({
      opportunityId: opportunity.id,
      campaignId: opportunity.campaign || undefined,
      accountId: opportunity.account,
      contactId: opportunity.contact || undefined,
      leadId: opportunity.lead_id || undefined,
      teamId: opportunity.team_id || "",
      userId,
      replySnippet: body.replySnippet,
      documentIds,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    systemLogger.error("[DEAL_AGENT_PROCESS]", error?.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
