import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getGraphClient } from "@/lib/microsoft";
import { systemLogger } from "@/lib/logger";

// Verify Microsoft Subscriptions (they send validationToken query parameter)
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const validationToken = url.searchParams.get("validationToken");

    // Subscription validation response
    if (validationToken) {
      return NextResponse.json({ ok: true }, { status: 200, headers: { 'Content-Type': 'text/plain' }, statusText: validationToken });
    }

    const payload = await req.json();

    // Loop through notifications
    if (payload && Array.isArray(payload.value)) {
      for (const notification of payload.value) {
        const sid = notification.subscriptionId;
        const resourceId = notification.resource; // Usually like Users/{id}/Messages/{id}

        systemLogger.info(`[MICROSOFT_WEBHOOK] Notification for ${sid}. Resource: ${resourceId}`);

        // 1. Look up ms token by subscription_id
        // 2. Refresh graphClient via getGraphClient(userId)
        // 3. fetch message from MS Graph endpoint: /me/messages/{messageId}
        // 4. Transform to crm_Emails row 
        // 5. Insert into DB if not exists
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    systemLogger.error("[MICROSOFT_WEBHOOK_ERROR]", error?.message || error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
