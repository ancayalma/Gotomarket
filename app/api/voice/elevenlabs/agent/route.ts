import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api-auth-guard";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/voice/elevenlabs/agent
 * Provisions or updates a "General Use" Conversational AI agent via the ElevenLabs API,
 * configuring it with the necessary dynamic variables for CRM campaigns.
 */
export async function POST(req: Request) {
  const session = await requireAdminAuth();
  if (session instanceof Response) return session;

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
    }

    const payload = {
      name: "BasaltCRM Outbound Agent",
      conversation_config: {
        agent: {
          prompt: {
            prompt: `You are {{agent_name}}, an AI sales representative calling from {{company_name}}.
Your goal is to connect with the prospect regarding: {{campaign_context}}.
You are speaking with the contact: {{lead_first_name}} {{lead_last_name}}.

Business Context:
{{business_facts}}

Keep your responses natural, engaging, and professional. Always listen carefully.
Do not break character. Do not reveal you are an AI unless asked directly.`,
            llm: "gpt-4o-mini"
          },
          first_message: "Hi, is this {{lead_first_name}}?",
          language: "en"
        },
        // The Pre-Call webhook can be used to inject the variables defined above 
        // at the exact moment the call connects, based on the caller_id mapped from SIP
        turn_config: {
          turn_timeout: 7
        }
      }
    };

    const res = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      systemLogger.error("[ELEVENLABS_AGENT_CREATE_ERR]", txt);
      return NextResponse.json({ ok: false, error: txt }, { status: res.status });
    }

    const data = await res.json();
    systemLogger.info(`[ELEVENLABS_AGENT_CREATE] Successfully created generic agent. ID: ${data.agent_id}`);

    return NextResponse.json({
      ok: true,
      agent_id: data.agent_id,
      note: "IMPORTANT: Please log in to ElevenLabs UI to assign your imported SIP trunk phone number to this agent, and configure the Pre-Call Webhook to point to https://<your-domain>/api/voice/elevenlabs/pre-call"
    });

  } catch (err: any) {
    systemLogger.error("Error creating ElevenLabs Agent", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
