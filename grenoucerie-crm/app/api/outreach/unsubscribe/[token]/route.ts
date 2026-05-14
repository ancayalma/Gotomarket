import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";
import React from "react";
import { render } from "@react-email/render";

/**
 * GET /api/outreach/unsubscribe/[token]
 *
 * Token-based unsubscribe endpoint. When a recipient clicks the unsubscribe
 * link in an outreach email:
 * 1. Finds the outreach item by unsubscribe_token
 * 2. Marks the contact as unsubscribed (email_unsubscribed=true)
 * 3. Updates the lead's outreach_status to UNSUBSCRIBED
 * 4. Updates the outreach item with unsubscribed_at
 * 5. Logs activity
 * 6. Returns a branded confirmation page — does NOT auto-delete (human decides)
 */

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { token: rawToken } = await params;
    const token = rawToken?.trim();

    if (!token) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Find outreach item by unsubscribe token
    const item = await prismadb.crm_Outreach_Items.findFirst({
      where: { unsubscribe_token: token },
      select: {
        id: true,
        lead: true,
        contact_id: true,
        candidate_email: true,
        unsubscribed_at: true,
      },
    });

    let alreadyUnsubscribed = false;

    if (item) {
      if (item.unsubscribed_at) {
        alreadyUnsubscribed = true;
      } else {
        // Update outreach item
        await prismadb.crm_Outreach_Items.update({
          where: { id: item.id },
          data: {
            unsubscribed_at: new Date(),
            status: "SKIPPED", // Mark as skipped to prevent follow-ups
          },
        });

        // Update lead outreach status
        if (item.lead) {
          await prismadb.crm_Leads.update({
            where: { id: item.lead },
            data: {
              outreach_status: "UNSUBSCRIBED" as any,
              opt_out: true,
            },
          }).catch(() => { /* Lead may not exist for candidates */ });

          // Log activity
          await prismadb.crm_Lead_Activities.create({
            data: {
              lead: item.lead,
              type: "unsubscribed",
              metadata: {
                source: "email_link",
                outreach_item_id: item.id,
              } as any,
            },
          }).catch(() => { });
        }

        // Update contact
        if (item.contact_id) {
          await prismadb.crm_Contacts.update({
            where: { id: item.contact_id },
            data: {
              email_unsubscribed: true,
              opt_out: true,
            },
          }).catch(() => { });
        } else if (item.candidate_email) {
          // Try to find contact by email
          const contact = await prismadb.crm_Contacts.findFirst({
            where: { email: item.candidate_email },
            select: { id: true },
          });
          if (contact) {
            await prismadb.crm_Contacts.update({
              where: { id: contact.id },
              data: {
                email_unsubscribed: true,
                opt_out: true,
              },
            }).catch(() => { });
          }
        }

        systemLogger.info(
          `[UNSUBSCRIBE] Processed: token=${token}, leadId=${item.lead}, contactId=${item.contact_id}`
        );
      }
    }

    // Return a branded confirmation page
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1f2937;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 48px 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 16px; color: #6b7280; line-height: 1.6; }
    .note {
      margin-top: 20px;
      padding: 12px 16px;
      background: #fef3c7;
      border-radius: 8px;
      font-size: 14px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✉️</div>
    <h1>${alreadyUnsubscribed ? "Already Unsubscribed" : "You've Been Unsubscribed"}</h1>
    <p>${alreadyUnsubscribed
      ? "You were already unsubscribed from our mailing list. No further action is needed."
      : "You've been successfully removed from our outreach list. You won't receive any more emails from this campaign."
    }</p>
    ${!alreadyUnsubscribed ? '<div class="note">If this was a mistake, please reply to your most recent email and we\'ll re-add you.</div>' : ''}
  </div>
</body>
</html>`;

    return new NextResponse(pageHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    systemLogger.error("[UNSUBSCRIBE_GET]", error);
    return new NextResponse("Something went wrong", { status: 500 });
  }
}
