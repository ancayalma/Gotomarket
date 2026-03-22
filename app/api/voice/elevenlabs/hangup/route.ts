import { NextResponse } from "next/server";

// Ensure Node.js runtime for AWS SDK compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

import { ChimeSDKVoiceClient, UpdateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";
import { requireApiAuth, requireAdminAuth } from "@/lib/api-auth-guard";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/voice/elevenlabs/hangup
 * Body: { transactionId: string }
 * 
 * Sends an UpdateSipMediaApplicationCallCommand to the AWS Chime SMA.
 * Because the SMA Lambda does not currently explicitly handle CALL_UPDATE_REQUESTED,
 * the Lambda drops to the default fallback: returning a Hangup action.
 */

type Body = {
  transactionId: string;
};

export async function POST(req: Request) {
  // ── Auth guard ──
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const body = (await req.json()) as Body;

    if (!body || !body.transactionId) {
      return new NextResponse("Missing transactionId", { status: 400 });
    }

    const smaId = process.env.CHIME_SMA_APPLICATION_ID || process.env.CHIME_SMA_ID;
    const region = process.env.CHIME_VOICE_REGION || process.env.AWS_REGION || "us-west-2";

    if (!smaId) return new NextResponse("Missing CHIME_SMA_APPLICATION_ID in env", { status: 500 });

    const client = new ChimeSDKVoiceClient({ region });

    const cmd = new UpdateSipMediaApplicationCallCommand({
      SipMediaApplicationId: smaId,
      TransactionId: body.transactionId,
      Arguments: {
        Action: "Hangup"
      }
    });

    const res = await client.send(cmd);
    
    systemLogger.info(`[ELEVENLABS_OUTBOUND_HANGUP] Requested artificial hangup for Transaction ${body.transactionId}`);
    
    return NextResponse.json({ ok: true, result: res }, { status: 200 });
  } catch (e: any) {
    systemLogger.error("[ELEVENLABS_OUTBOUND_HANGUP_ERROR]", e);
    return NextResponse.json({
      ok: false,
      error: {
        name: e?.name,
        message: e?.message,
        code: (e as any)?.code,
      },
    }, { status: 500 });
  }
}
