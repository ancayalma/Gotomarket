import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getGmailClientForUser } from "@/lib/gmail";
import { getGraphClient } from "@/lib/microsoft";
import { systemLogger } from "@/lib/logger";
import { encryptSecret } from "@/lib/encryption";
// Note: Depending on your exact mailer library, you might import your SES helper here.
// import { sendWithSES } from "@/lib/ses"; 

/**
 * POST /api/crm/emails/send
 * Sends an email natively through the authenticated user's connected Google/Microsoft account so it hits their "Sent" folder.
 * If no OAuth is connected, falls back to the Team's custom AWS SES or Platform SES.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { to, subject, body_html, body_text, leadId, contactId, cc, bcc } = await req.json();

    if (!to || !subject || (!body_html && !body_text)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Check for Active OAuth Connections (Google/Microsoft)
    const gmailClient = await getGmailClientForUser(userId);
    const graphClient = !gmailClient ? await getGraphClient(userId) : null;

    let messageId: string | undefined;
    let providerUsed = "ses"; // Default to SES if no OAuth

    if (gmailClient) {
      // Send natively via Google Workspace
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${utf8Subject}`,
        "Content-Type: text/html; charset=utf-8",
        "MIME-Version: 1.0",
        "",
        body_html || body_text
      ].filter(Boolean);

      const messageContent = messageParts.join("\r\n");
      const encodedMessage = Buffer.from(messageContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await gmailClient.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage }
      });

      messageId = res.data.id || undefined;
      providerUsed = "google";

    } else if (graphClient) {
      // Send natively via Microsoft Graph API
      const messagePayload: any = {
        message: {
          subject: subject,
          body: {
            contentType: body_html ? "HTML" : "Text",
            content: body_html || body_text
          },
          toRecipients: [{ emailAddress: { address: to } }]
        },
        saveToSentItems: "true"
      };

      if (cc) messagePayload.message.ccRecipients = [{ emailAddress: { address: cc } }];
      if (bcc) messagePayload.message.bccRecipients = [{ emailAddress: { address: bcc } }];

      const res = await graphClient.api('/me/sendMail').post(messagePayload);
      // Microsoft Graph sendMail doesn't usually return the message ID directly 
      // without querying the sent folder, but we mark it as successful.
      messageId = `ms-${Date.now()}`; 
      providerUsed = "microsoft";

    } else {
      // 3. Fallback to AWS SES / SendGrid (Configured in TeamEmailConfig)
      // await sendWithSES({ to, subject, html: body_html });
      // messageId = "ses-xyz";
      // providerUsed = "aws_ses";
      
      return new NextResponse("OAuth not connected. SES Fallback not fully implemented in this stub.", { status: 400 });
    }

    // 4. Log the outbound message reliably in crm_Emails
    await prismadb.crm_Emails.create({
      data: {
        user_id: userId,
        provider: providerUsed,
        message_id: messageId || `local-${Date.now()}`,
        subject: subject,
        snippet: body_text?.substring(0, 100) || '',
        to_emails: [{ email: to }],
        is_inbound: false, // User sent this
        is_read: true,
        date: new Date(),
        lead_id: leadId,
        contact_id: contactId,
        // body_html: encryptSecret(body_html), // Optional: Encrypt outbound payloads
        // body_text: encryptSecret(body_text),
      } as any,
    });

    // 5. Log Activity for the Lead timeline
    if (leadId) {
       await prismadb.crm_Lead_Activities.create({
         data: {
           lead: leadId,
           user: userId,
           type: "email_sent",
           metadata: { subject, to },
           createdAt: new Date(),
         } as any,
       });
    }

    return NextResponse.json({ ok: true, provider: providerUsed, messageId }, { status: 200 });

  } catch (error: any) {
    systemLogger.error("[CRM_EMAILS_SEND]", error?.message || error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
