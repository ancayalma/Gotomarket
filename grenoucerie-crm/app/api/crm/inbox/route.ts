import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/crm/inbox
 * Returns a unified stream of INBOUND, UNREAD messages that require human-in-the-loop attention.
 * This includes:
 * 1. Emails (from crm_Emails where is_inbound=true)
 * 2. Internal Messages (from InternalMessage_Recipient where is_read=false)
 * 3. SMS (from crm_Lead_Activities where type='sms_received') - assuming this is where inbound SMS is logged.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // 1. Fetch Inbound Unread Emails
    const unreadEmails = await prismadb.crm_Emails.findMany({
      where: {
        user_id: userId,
        is_inbound: true,
        // Only fetch emails that need attention
        is_read: false,
      },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        assigned_user: { select: { email: true, name: true } }
      }
    });

    const emailItems = unreadEmails.map((email: any) => ({
      id: email.id,
      type: "email",
      provider: email.provider,
      subject: email.subject || "(No Subject)",
      snippet: email.snippet,
      from: email.from_name || email.from_email || "Unknown Sender",
      date: email.date,
      isRead: email.is_read,
      leadId: email.lead_id,
      contactId: email.contact_id,
      accountId: email.account_id,
    }));

    // 2. Fetch Internal Messages (Notifications/Chat)
    const internalMessages = await prismadb.internalMessage_Recipient.findMany({
      where: {
        recipient_id: userId,
        is_read: false,
        is_deleted: false,
      },
      include: {
        message: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const notificationItems = internalMessages.map((msg: any) => ({
      id: msg.id,
      type: "internal",
      subject: msg.message?.subject || "New Message",
      snippet: msg.message?.body_text?.substring(0, 100) || "",
      from: msg.message?.sender_id || "System",
      date: msg.createdAt,
      isRead: msg.is_read,
      messageId: msg.message_id
    }));

    // 3. Fetch Inbound API Messages & SMS (from v1 messages endpoint + legacy SMS)
    // Get team's leads/contacts to scope the query
    const user = await prismadb.users.findUnique({
      where: { id: userId },
      select: { team_id: true }
    });
    const teamId = user?.team_id;

    let apiMessageItems: any[] = [];
    if (teamId) {
      const [teamLeadIds, teamContactIds] = await Promise.all([
        prismadb.crm_Leads.findMany({
          where: { team_id: teamId },
          select: { id: true },
        }).then((leads: { id: string }[]) => leads.map(l => l.id)),
        prismadb.crm_Contacts.findMany({
          where: { team_id: teamId },
          select: { id: true },
        }).then((contacts: { id: string }[]) => contacts.map(c => c.id)),
      ]);

      const inboundActivities = await prismadb.crm_Lead_Activities.findMany({
        where: {
          type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE", "sms_received", "inbound_sms"] },
          OR: [
            { lead: { in: teamLeadIds } },
            { contact: { in: teamContactIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      apiMessageItems = inboundActivities.map((act: any) => {
        const meta = (act.metadata || {}) as any;
        return {
          id: act.id,
          type: act.type === "API_MESSAGE" ? "api" : (act.channel || "sms").toLowerCase(),
          subject: act.subject || `${act.channel || "API"} Message`,
          snippet: act.body || act.notes || meta?.message || "",
          from: act.direction === "INBOUND"
            ? (meta.recipientEmail || meta.fromEmail || meta.from_phone || "Customer")
            : ((session as any)?.user?.name || "You"),
          date: act.createdAt,
          isRead: false,
          leadId: act.lead,
          contactId: act.contact,
          direction: act.direction,
          conversation_id: act.conversation_id,
        };
      });
    }

    // Merge and sort all stream items by date descending
    const inboxStream = [...emailItems, ...notificationItems, ...apiMessageItems].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Descending
    }).slice(0, limit);

    return NextResponse.json({
      ok: true,
      inbox: inboxStream,
    }, { status: 200 });

  } catch (error: any) {
    systemLogger.error("[CRM_INBOX_GET]", error?.message || error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
