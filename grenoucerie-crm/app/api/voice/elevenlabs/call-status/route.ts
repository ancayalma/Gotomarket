import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireApiAuth } from "@/lib/api-auth-guard";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/voice/elevenlabs/call-status?callSid=xxx
 * 
 * Polls Twilio for the call status so the dialer can detect when the
 * remote party hangs up. Uses the Twilio REST API directly.
 * 
 * Returns: { status: string } where status is one of:
 *   queued, ringing, in-progress, completed, busy, no-answer, canceled, failed
 */
export async function GET(req: Request) {
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  const { searchParams } = new URL(req.url);
  const callSid = searchParams.get("callSid");

  if (!callSid) {
    return NextResponse.json({ error: "Missing callSid" }, { status: 400 });
  }

  try {
    // Get Twilio credentials — try tenant DB first, then env
    let accountSid = process.env.TWILIO_ACCOUNT_ID || "";
    let authToken = process.env.TWILIO_AUTH_TOKEN || "";

    try {
      const { getCurrentUserTeamId } = await import("@/lib/team-utils");
      const { prismadb } = await import("@/lib/prisma");
      const teamInfo = await getCurrentUserTeamId();
      if (teamInfo?.teamId) {
        const integration = await prismadb.tenant_Integrations.findUnique({
          where: { tenant_id: teamInfo.teamId },
          select: { twilio_account_sid: true, twilio_auth_token: true },
        });
        if (integration?.twilio_account_sid) accountSid = integration.twilio_account_sid;
        if (integration?.twilio_auth_token) authToken = integration.twilio_auth_token;
      }
    } catch { /* use env */ }

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
    const res = await fetch(twilioUrl, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });

    if (!res.ok) {
      // Call may not exist or already cleaned up — treat as completed
      if (res.status === 404) {
        return NextResponse.json({ status: "completed" });
      }
      return NextResponse.json({ error: `Twilio ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ status: data.status || "unknown" });
  } catch (e: any) {
    systemLogger.error("[CALL_STATUS]", e?.message);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
