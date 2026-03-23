import { NextResponse } from "next/server";

// Ensure Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { startOutboundCall } from "@/lib/aws/connect";
import { systemLogger } from "@/lib/logger";

// Minimal global for agent bot join info across branches in this request scope
// (kept function-local via closure variable below)

/**
 * POST /api/outreach/call/initiate
 * Body: { leadId: string; phone?: string; attributes?: Record<string,string> }
 * 
 * Uses ElevenLabs native Twilio integration for outbound dialing when 
 * ELEVENLABS_API_KEY is available, otherwise falls back to Amazon Connect.
 */

type Body = { leadId: string; phone?: string; attributes?: Record<string, string> };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = (await req.json()) as Body;
    const phoneInput = (body?.phone || "").trim();

    // Resolve lead either by provided leadId or by phone when present
    let lead = body?.leadId
      ? await prismadb.crm_Leads.findUnique({
        where: { id: body.leadId },
        select: { id: true, phone: true, firstName: true, lastName: true, company: true },
      })
      : (phoneInput
        ? await prismadb.crm_Leads.findFirst({
          where: { phone: phoneInput },
          select: { id: true, phone: true, firstName: true, lastName: true, company: true },
        })
        : null);

    if (!lead) {
      if (!body?.leadId && !phoneInput) {
        return new NextResponse("leadId or phone required", { status: 400 });
      }
      return new NextResponse("Lead not found", { status: 404 });
    }

    const dest = (body.phone || lead.phone || "").trim();
    if (!dest) return new NextResponse("No destination phone for lead", { status: 400 });

    const attributes: Record<string, string> = {
      leadId: lead.id,
      leadName: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead",
      leadCompany: lead.company || "",
      agentUserId: session.user.id,
      ...(body.attributes || {}),
    };

    let contactId: string;

    // Primary path: ElevenLabs native Twilio outbound (replaces Chime SMA)
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT;

    if (ELEVENLABS_API_KEY && agentId) {
      systemLogger.error('[CALL_INITIATE] Using ElevenLabs + Twilio path', { dest });

      const payload: Record<string, any> = {
        agent_id: agentId,
        to_number: dest,
      };

      const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
      if (agentPhoneNumberId) {
        payload.agent_phone_number_id = agentPhoneNumberId;
      }

      // Pass lead context as custom data
      payload.custom_llm_extra_body = {
        leadId: lead.id,
        leadName: attributes.leadName,
        leadCompany: attributes.leadCompany,
      };

      try {
        const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound_call", {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as any)?.detail || (data as any)?.message || `ElevenLabs API ${res.status}`);
        }

        contactId = (data as any)?.call_sid || (data as any)?.callSid || (data as any)?.sid || `el-${Date.now()}`;
        systemLogger.error('[CALL_INITIATE] ElevenLabs callSid', contactId);
      } catch (e: any) {
        systemLogger.error('[CALL_INITIATE][ELEVENLABS_ERROR]', e?.message || e);
        return new NextResponse(e?.message || 'ElevenLabs call failed', { status: 500 });
      }
    } else {
      // Fallback: Amazon Connect
      systemLogger.error('[CALL_INITIATE] Using Connect path', { dest });
      try {
        const { contactId: cid } = await startOutboundCall({ destinationPhoneNumber: dest, attributes });
        contactId = cid;
        systemLogger.error('[CALL_INITIATE] Connect contactId', contactId);
      } catch (e: any) {
        systemLogger.error('[CALL_INITIATE][CONNECT_ERROR]', e?.message || e);
        return new NextResponse(e?.message || 'Connect call failed', { status: 500 });
      }
    }

    await prismadb.crm_Leads.update({
      where: { id: lead.id },
      data: {
        call_status: "INITIATED",
        connect_contact_id: contactId,
        pipeline_stage: "Engage_Human" as any,
      },
    });

    await prismadb.crm_Lead_Activities.create({
      data: {
        lead: lead.id,
        user: session.user.id,
        type: "call_initiated",
        metadata: { contactId, to: dest, attributes, pipeline_stage: "Engage_Human" } as any,
      },
    });

    const responsePayload: any = { contactId, to: dest };
    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    systemLogger.error("[CALL_INITIATE]", error?.message || error);
    return new NextResponse(error?.message || "Internal Error", { status: 500 });
  }
}
