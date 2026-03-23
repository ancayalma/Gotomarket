import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/email/inbound
 * Webhook for AWS SES Inbound Email via Amazon SNS.
 * Debug mode: stores diagnostic trace in crm_Email_Thread body_text.
 */
export async function POST(req: Request) {
  const debugLog: string[] = [];
  const log = (msg: string) => { debugLog.push(`[${new Date().toISOString()}] ${msg}`); };

  try {
    const rawBody = await req.text();
    log(`Received webhook. Body length: ${rawBody.length}`);
    
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      log(`FATAL: Invalid JSON body: ${rawBody.substring(0, 300)}`);
      await saveDebugLog(debugLog, rawBody.substring(0, 500));
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    log(`Parsed body. Type: ${body.Type}, TopicArn: ${body.TopicArn}`);

    // 1. Handle SNS Subscription Confirmation
    if (body.Type === "SubscriptionConfirmation") {
      log(`SubscriptionConfirmation received. SubscribeURL: ${body.SubscribeURL}`);
      if (body.SubscribeURL) {
        try {
          const res = await fetch(body.SubscribeURL, { cache: "no-store", method: "GET" });
          log(`Confirmation response: ${res.status}`);
        } catch (fetchErr: any) {
          log(`Confirmation fetch failed: ${fetchErr.message}`);
        }
      }
      await saveDebugLog(debugLog, "SNS Subscription Confirmation");
      return new NextResponse("OK", { status: 200 });
    }

    // 2. Handle Notification (Actual Email)
    if (body.Type === "Notification") {
      log(`Processing Notification. SNS Subject: ${body.Subject}, SNS MessageId: ${body.MessageId}`);
      
      let emailMessage;
      try {
        emailMessage = JSON.parse(body.Message);
      } catch {
        log(`FATAL: Could not parse body.Message as JSON. Raw (300 chars): ${body.Message?.substring(0, 300)}`);
        await saveDebugLog(debugLog, "Parse failure");
        return new NextResponse("Invalid SES Message", { status: 400 });
      }

      log(`notificationType: ${emailMessage.notificationType}`);
      log(`receipt.action: ${JSON.stringify(emailMessage.receipt?.action)}`);
      log(`mail keys: ${Object.keys(emailMessage.mail || {}).join(", ")}`);

      if (emailMessage.notificationType !== "Received") {
        log(`Ignoring non-Received notification: ${emailMessage.notificationType}`);
        await saveDebugLog(debugLog, `Ignored: ${emailMessage.notificationType}`);
        return new NextResponse("Ignored", { status: 200 });
      }

      const mail = emailMessage.mail;
      const headers = mail?.headers || [];
      const commonHeaders = mail?.commonHeaders || {};

      const fromAddress = commonHeaders.from?.[0] || "";
      const toAddresses = commonHeaders.to || [];
      const subject = commonHeaders.subject || "(No Subject)";
      const inboundMessageId = mail?.messageId;

      log(`From: ${fromAddress}`);
      log(`To: ${JSON.stringify(toAddresses)}`);
      log(`Subject: ${subject}`);
      log(`SES MessageId: ${inboundMessageId}`);
      log(`Headers count: ${headers.length}`);
      
      // Log ALL headers
      for (const h of headers) {
        log(`  Header: ${h.name} = ${String(h.value).substring(0, 200)}`);
      }

      // Extract In-Reply-To and References
      const inReplyToHeader = headers.find((h: any) => h.name.toLowerCase() === "in-reply-to")?.value;
      const referencesHeader = headers.find((h: any) => h.name.toLowerCase() === "references")?.value;
      
      const cleanMessageId = (id?: string) => id?.replace(/[<>]/g, "").trim();
      const inReplyTo = cleanMessageId(inReplyToHeader);
      
      log(`In-Reply-To raw: "${inReplyToHeader}"`);
      log(`In-Reply-To cleaned: "${inReplyTo}"`);
      log(`References raw: "${referencesHeader}"`);

      let matchedOutreachItem = null;

      // Match via In-Reply-To
      if (inReplyTo) {
        matchedOutreachItem = await prismadb.crm_Outreach_Items.findFirst({
          where: { message_id: inReplyTo },
          select: { id: true, campaign: true, lead: true, message_id: true },
        });
        log(`Lookup by In-Reply-To "${inReplyTo}": ${matchedOutreachItem ? `MATCHED (item: ${matchedOutreachItem.id}, stored: ${matchedOutreachItem.message_id})` : "NO MATCH"}`);
        
        // Also try with angle brackets
        if (!matchedOutreachItem && inReplyToHeader) {
          const rawId = inReplyToHeader.trim();
          matchedOutreachItem = await prismadb.crm_Outreach_Items.findFirst({
            where: { message_id: rawId },
            select: { id: true, campaign: true, lead: true, message_id: true },
          });
          log(`Retry with raw In-Reply-To "${rawId}": ${matchedOutreachItem ? "MATCHED" : "NO MATCH"}`);
        }
      }

      // Match via References
      if (!matchedOutreachItem && referencesHeader) {
        const refs = referencesHeader.split(/\s+/).map(cleanMessageId).filter(Boolean);
        log(`Trying References with ${refs.length} refs: ${JSON.stringify(refs.slice(0, 5))}`);
        if (refs.length > 0) {
          matchedOutreachItem = await prismadb.crm_Outreach_Items.findFirst({
            where: { message_id: { in: refs as string[] } },
            select: { id: true, campaign: true, lead: true, message_id: true },
          });
          log(`References lookup: ${matchedOutreachItem ? `MATCHED (item: ${matchedOutreachItem.id})` : "NO MATCH"}`);
        }
      }

      // If no match, log recent outreach items for comparison
      if (!matchedOutreachItem) {
        const recentItems = await prismadb.crm_Outreach_Items.findMany({
          orderBy: { sentAt: "desc" },
          take: 3,
          select: { id: true, message_id: true, sentAt: true, to_email: true },
        });
        log(`NO MATCH FOUND. Recent outreach items for comparison:`);
        for (const item of recentItems) {
          log(`  item ${item.id}: message_id="${item.message_id}" to=${item.to_email} sent=${item.sentAt}`);
        }
      }

      // Fetch campaign context
      let campaignRecord = null;
      if (matchedOutreachItem?.campaign) {
        campaignRecord = await prismadb.crm_Outreach_Campaigns.findUnique({
          where: { id: matchedOutreachItem.campaign },
          select: { user: true, team_id: true }
        });
      }

      log(`Campaign record: ${campaignRecord ? `team=${campaignRecord.team_id}` : "none"}`);

      // Create Email Thread entry — debug log stored in body_text
      const bodyContent = emailMessage.content || "Empty or requires S3 fetch";
      await prismadb.crm_Email_Thread.create({
        data: {
          team_id: campaignRecord?.team_id || "600000000000000000000000",
          user: campaignRecord?.user || undefined,
          lead: matchedOutreachItem?.lead || undefined,
          campaign: matchedOutreachItem?.campaign || undefined,
          outreach_item: matchedOutreachItem?.id || undefined,
          thread_subject: subject,
          message_id: inboundMessageId,
          direction: "INBOUND",
          from_email: fromAddress,
          to_email: toAddresses.join(", "),
          subject: subject,
          body_text: `--- DEBUG LOG ---\n${debugLog.join("\n")}\n--- END DEBUG ---\n\n${bodyContent}`,
          receivedAt: new Date(),
        } as any,
      });

      log(`Created crm_Email_Thread`);

      if (matchedOutreachItem) {
        await prismadb.crm_Outreach_Items.update({
          where: { id: matchedOutreachItem.id },
          data: {
            status: "REPLIED" as any,
            repliedAt: new Date(),
            reply_snippet: subject
          },
        });

        if (matchedOutreachItem.campaign) {
          await prismadb.crm_Outreach_Campaigns.update({
            where: { id: matchedOutreachItem.campaign },
            data: { emails_replied: { increment: 1 } },
          }).catch(() => {});
        }
      }

      return new NextResponse("OK", { status: 200 });
    }

    log(`Unknown SNS message type: ${body.Type}`);
    await saveDebugLog(debugLog, `Unknown type: ${body.Type}`);
    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    log(`FATAL ERROR: ${error.message}\n${error.stack}`);
    try { await saveDebugLog(debugLog, `CRASH: ${error.message}`); } catch { /* last resort */ }
    systemLogger.error("[SES_INBOUND_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/** Save debug log to crm_Email_Thread as a diagnostic entry */
async function saveDebugLog(debugLog: string[], context: string) {
  try {
    await prismadb.crm_Email_Thread.create({
      data: {
        team_id: "600000000000000000000000",
        thread_subject: `[SES_DEBUG] ${context}`,
        message_id: `debug_${Date.now()}`,
        direction: "INBOUND",
        from_email: "system@debug",
        to_email: "debug",
        subject: `[SES_DEBUG] ${context}`,
        body_text: debugLog.join("\n"),
        receivedAt: new Date(),
      } as any,
    });
  } catch { /* silently fail */ }
}
