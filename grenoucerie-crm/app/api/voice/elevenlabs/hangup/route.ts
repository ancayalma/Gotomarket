import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { requireApiAuth } from "@/lib/api-auth-guard";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getTwilioConfig, twilioApiUrl, twilioAuthHeader } from "@/lib/twilio/twilio-voice";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/voice/elevenlabs/hangup
 * 
 * Terminates an active Twilio call by updating its status to 'completed'.
 * Reads Twilio credentials from the team's integration settings in the DB.
 * 
 * Body: { callSid: string } or { transactionId: string } (legacy compat)
 */

type Body = {
  callSid?: string;
  transactionId?: string; // Legacy compat — older UI may still send this
};

export async function POST(req: Request) {
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const body = (await req.json()) as Body;
    const callSid = body?.callSid || body?.transactionId;

    if (!callSid) {
      return NextResponse.json({ ok: false, error: "Missing callSid" }, { status: 400 });
    }

    // Load Twilio creds from DB
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;
    if (!teamId) {
      return NextResponse.json({ ok: false, error: "No team context" }, { status: 401 });
    }

    const config = await getTwilioConfig(teamId);
    if (!config) {
      return NextResponse.json({ ok: false, error: "Twilio integration not configured. Go to Admin → Integrations to add your Twilio credentials." }, { status: 400 });
    }

    // Call Twilio REST API to terminate the call
    const url = twilioApiUrl(config.accountSid, `/Calls/${callSid}.json`);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": twilioAuthHeader(config.accountSid, config.authToken),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "Status=completed",
    });

    if (!res.ok) {
      const txt = await res.text();
      systemLogger.error(`[TWILIO_HANGUP] Failed for ${callSid}: ${res.status}`, txt);
      return NextResponse.json({ ok: false, error: `Twilio returned ${res.status}` }, { status: res.status });
    }

    systemLogger.info(`[TWILIO_HANGUP] Terminated call ${callSid}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    systemLogger.error("[TWILIO_HANGUP_ERROR]", e);
    return NextResponse.json({
      ok: false,
      error: e?.message || "Hangup failed",
    }, { status: 500 });
  }
}
