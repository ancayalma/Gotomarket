import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/email/inbound
 * Webhook for AWS SES Inbound Email via Amazon SNS.
 */
export async function POST(req: Request) {
  try {
    // SNS posts data as text/plain or application/json
    const rawBody = await req.text();

    try {
        await prismadb.crm_Email_Thread.create({
            data: {
                team_id: "600000000000000000000000",
                direction: "INBOUND",
                from_email: "debug@sns.amazonaws.com",
                to_email: "system@crm.basalthq.com",
                subject: "SNS DEBUG PAYLOAD",
                body_text: rawBody,
                receivedAt: new Date(),
            } as any
        });
    } catch(e) {}

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    // 1. Handle SNS Subscription Confirmation
    if (body.Type === "SubscriptionConfirmation") {
      const { SubscribeURL } = body;
      systemLogger.info(`[SES_INBOUND] Confirming SNS Subscription: ${SubscribeURL}`);
      if (SubscribeURL) {
        try {
            // Fetch the URL to confirm, and ensure Vercel/NextJS doesn't cache it
            const res = await fetch(SubscribeURL, { cache: "no-store", method: "GET" });
            const resText = await res.text();
            systemLogger.info(`[SES_INBOUND] SNS Subscription confirmation response: ${res.status} ${resText}`);
        } catch (fetchErr) {
            systemLogger.error(`[SES_INBOUND] SNS Subscription confirmation fetch failed:`, fetchErr);
        }
      }
      return new NextResponse("OK", { status: 200 });
    }

    // 2. Handle Notification (Actual Email)
    if (body.Type === "Notification") {
      let emailMessage;
      try {
        emailMessage = JSON.parse(body.Message);
      } catch {
        systemLogger.warn("[SES_INBOUND] Could not parse Notification Message JSON.");
        return new NextResponse("Invalid SES Message", { status: 400 });
      }

      if (emailMessage.notificationType !== "Received") {
        // Not an inbound email (e.g. bounce/complaint)
        return new NextResponse("Ignored", { status: 200 });
      }

      const mail = emailMessage.mail;
      const content = emailMessage.content; // Requires SES to publish the RAW email Content to SNS? Usually we just parse headers from 'mail'. We'll extract what SES gives us.
      
      const headers = mail?.headers || [];
      const commonHeaders = mail?.commonHeaders || {};

      const fromAddress = commonHeaders.from?.[0] || "";
      const toAddresses = commonHeaders.to || [];
      const subject = commonHeaders.subject || "(No Subject)";
      const inboundMessageId = mail.messageId; // SES assigned ID

      // Extract In-Reply-To and References from headers to match our outbound emails
      const inReplyToHeader = headers.find((h: any) => h.name.toLowerCase() === "in-reply-to")?.value;
      const referencesHeader = headers.find((h: any) => h.name.toLowerCase() === "references")?.value;
      
      // Clean "<...>" from message IDs
      const cleanMessageId = (id?: string) => id?.replace(/[<>]/g, "").trim();
      const inReplyTo = cleanMessageId(inReplyToHeader);
      
      let matchedOutreachItem = null;

      // Match against the original sent outreach item
      if (inReplyTo) {
        matchedOutreachItem = await prismadb.crm_Outreach_Items.findFirst({
          where: { message_id: inReplyTo },
          select: { id: true, campaign: true, lead: true },
        });
      }

      // If we don't find it via In-Reply-To, try References
      if (!matchedOutreachItem && referencesHeader) {
        const refs = referencesHeader.split(/\s+/).map(cleanMessageId).filter(Boolean);
        if (refs.length > 0) {
          matchedOutreachItem = await prismadb.crm_Outreach_Items.findFirst({
            where: { message_id: { in: refs as string[] } },
            select: { id: true, campaign: true, lead: true },
          });
        }
      }

      // Fetch campaign to get user and team_id context
      let campaignRecord = null;
      if (matchedOutreachItem?.campaign) {
        campaignRecord = await prismadb.crm_Outreach_Campaigns.findUnique({
          where: { id: matchedOutreachItem.campaign },
          select: { user: true, team_id: true }
        });
      }

      // Attempt to extract body text from the raw email content.
      // SES SNS notifications don't typically include the full parsed body by default unless configured with S3 or specific actions.
      // For now, we'll store basic details. If full body parsing is needed, we'll use an AWS Lambda to parse the S3 object and send it to our API.
      // But SES *can* send the `content` snippet if configured to base64 encode it in the SNS action.
      let bodyText = emailMessage.content || "Empty or requires S3 fetch"; 

      // Create Email Thread entry
      await prismadb.crm_Email_Thread.create({
        data: {
          team_id: campaignRecord?.team_id || "600000000000000000000000", // Fallback if no match
          user: campaignRecord?.user || undefined,
          lead: matchedOutreachItem?.lead || undefined,
          campaign: matchedOutreachItem?.campaign || undefined,
          outreach_item: matchedOutreachItem?.id || undefined,
          thread_subject: subject,
          message_id: inboundMessageId, // Storing the incoming ID
          direction: "INBOUND",
          from_email: fromAddress,
          to_email: toAddresses.join(", "),
          subject: subject,
          body_text: bodyText,
          receivedAt: new Date(),
        } as any,
      });

      if (matchedOutreachItem) {
        // 1. Update Outreach Item Status
        await prismadb.crm_Outreach_Items.update({
          where: { id: matchedOutreachItem.id },
          data: {
            status: "REPLIED" as any,
            repliedAt: new Date(),
            reply_snippet: subject // using subject as snippet placeholder until body parsing is robust
          },
        });

        // 2. Increment Campaign emails_replied
        if (matchedOutreachItem.campaign) {
          await prismadb.crm_Outreach_Campaigns.update({
            where: { id: matchedOutreachItem.campaign },
            data: { emails_replied: { increment: 1 } },
          }).catch(() => {});
        }
        systemLogger.info(`[SES_INBOUND] Matched reply to outreach item ${matchedOutreachItem.id}. Campaign ${matchedOutreachItem.campaign} updated.`);
      } else {
        systemLogger.info(`[SES_INBOUND] Received email from ${fromAddress} but could not match to an outreach item.`);
      }

      return new NextResponse("OK", { status: 200 });
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    systemLogger.error("[SES_INBOUND_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
