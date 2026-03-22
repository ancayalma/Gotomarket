import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

type Params = { params: Promise<{ campaignId: string }> };

/**
 * GET /api/crm/campaigns/[campaignId]/contacts
 *
 * Returns all outreach items for a campaign with their associated
 * agentic actions and opportunity data for the progress tracker UI.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { campaignId } = await params;

    // Fetch all outreach items for this campaign
    const outreachItems = await prismadb.crm_Outreach_Items.findMany({
      where: { campaign: campaignId },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        lead: true,
        status: true,
        subject: true,
        candidate_email: true,
        candidate_name: true,
        candidate_company: true,
        candidate_job_title: true,
        sentAt: true,
        openedAt: true,
        repliedAt: true,
        reply_sentiment: true,
        reply_snippet: true,
        followup_count: true,
        unsubscribed_at: true,
        account_id: true,
        contact_id: true,
      },
    });

    // Get lead IDs to lookup opportunities and actions
    const leadIds = outreachItems
      .map((i: any) => i.lead)
      .filter(Boolean) as string[];

    // Fetch opportunities linked to these leads
    const opportunities = leadIds.length > 0
      ? await prismadb.crm_Opportunities.findMany({
          where: { lead_id: { in: leadIds } },
          select: { id: true, name: true, status: true, lead_id: true },
        })
      : [];

    const oppByLead = new Map(
      opportunities.map((o: any) => [o.lead_id, o])
    );

    // Fetch agentic actions for these contacts
    const contactIds = outreachItems
      .map((i: any) => i.contact_id)
      .filter(Boolean) as string[];

    const accountIds = outreachItems
      .map((i: any) => i.account_id)
      .filter(Boolean) as string[];

    const actions =
      contactIds.length > 0 || accountIds.length > 0
        ? await prismadb.crm_Agentic_Actions.findMany({
            where: {
              OR: [
                { campaign_id: campaignId },
                ...(contactIds.length > 0
                  ? [{ contact_id: { in: contactIds } }]
                  : []),
              ],
              status: { in: ["PROPOSED", "EXECUTED", "REJECTED"] },
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              action_type: true,
              status: true,
              reasoning: true,
              requires_human: true,
              payload: true,
              createdAt: true,
              contact_id: true,
              account_id: true,
            },
          })
        : [];

    // Group actions by contact
    const actionsByContact = new Map<string, typeof actions>();
    for (const action of actions) {
      const key = action.contact_id || action.account_id || "";
      if (!actionsByContact.has(key)) actionsByContact.set(key, []);
      actionsByContact.get(key)!.push(action);
    }

    // Combine data
    const items = outreachItems.map((item: any) => ({
      ...item,
      opportunity: item.lead ? oppByLead.get(item.lead) || null : null,
      pendingActions:
        actionsByContact.get(item.contact_id || "") ||
        actionsByContact.get(item.account_id || "") ||
        [],
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[CAMPAIGN_CONTACTS_GET]", error?.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
