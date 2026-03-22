import { NextResponse } from "next/server";

// Ensure Node.js runtime for AWS SDK compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

import { ChimeSDKVoiceClient, CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";
import { requireApiAuth, requireAdminAuth } from "@/lib/api-auth-guard";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/voice/elevenlabs/outbound
 * Body: { destination: string; agentId: string; from?: string }
 * - destination: E.164 phone number (e.g., "+17203703285")
 * - agentId: ElevenLabs Agent ID
 * - from: optional E.164 to override the default FromPhoneNumber (env)
 * 
 * Initiates an outbound call using Amazon Chime SDK, passing the agent ID 
 * in SIP Headers to tell the Chime SMA Lambda to CallAndBridge directly 
 * to the ElevenLabs SIP endpoint.
 */

type Body = {
  destination: string;
  agentId: string;
  from?: string;
  leadId?: string;
};

function isE164(num: string) {
  return /^\+[1-9]\d{1,14}$/.test(num);
}

export async function POST(req: Request) {
  // ── Auth guard ──
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const body = (await req.json()) as Body;

    if (!body || !body.destination || !isE164(body.destination)) {
      return new NextResponse("Invalid destination (must be E.164)", { status: 400 });
    }

    if (!body.agentId) {
      return new NextResponse("Missing ElevenLabs Agent ID", { status: 400 });
    }

    const smaId = process.env.CHIME_SMA_APPLICATION_ID || process.env.CHIME_SMA_ID;
    const defaultFrom = process.env.CHIME_SOURCE_PHONE || process.env.CHIME_FROM_PHONE_NUMBER;
    const region = process.env.CHIME_VOICE_REGION || process.env.AWS_REGION || "us-west-2";

    if (!smaId) return new NextResponse("Missing CHIME_SMA_APPLICATION_ID in env", { status: 500 });
    
    const fromNumber = body.from?.trim() || defaultFrom?.trim();
    if (!fromNumber || !isE164(fromNumber)) {
      return new NextResponse("Invalid or missing FromPhoneNumber (set CHIME_SOURCE_PHONE or pass body.from)", { status: 400 });
    }

    const client = new ChimeSDKVoiceClient({ region });

    const sipHeaders: Record<string, string> = {
      // Pass the Agent ID back to the SMA Lambda so it knows to bridge to ElevenLabs
      "X-Elevenlabs-Agent-Id": body.agentId,
      "x-elevenlabs-agent-id": body.agentId, 
    };

    const argumentsMap: Record<string, string> = {
      "X-Elevenlabs-Agent-Id": body.agentId,
    };

    if (body.leadId) {
      sipHeaders["X-Lead-Id"] = String(body.leadId);
      sipHeaders["x-lead-id"] = String(body.leadId);
      argumentsMap["LeadId"] = String(body.leadId);
    }

    const cmd = new CreateSipMediaApplicationCallCommand({
      SipMediaApplicationId: smaId,
      FromPhoneNumber: fromNumber,
      ToPhoneNumber: body.destination.trim(),
      SipHeaders: sipHeaders,
      ArgumentsMap: argumentsMap,
    });

    const res = await client.send(cmd);
    
    systemLogger.info(`[ELEVENLABS_OUTBOUND] Triggered outbound call to ${body.destination} for Agent ${body.agentId}`);
    
    return NextResponse.json({ ok: true, result: res }, { status: 200 });
  } catch (e: any) {
    systemLogger.error("[ELEVENLABS_OUTBOUND_ERROR]", e);
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
