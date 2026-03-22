import { NextResponse } from "next/server";
import { prismadb as prisma } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/voice/elevenlabs/pre-call
 * ElevenLabs Pre-Call Webhook endpoint.
 * 
 * When AWS Chime bridges the SIP call to ElevenLabs, we spoof the Caller ID 
 * to be the Lead's actual phone number. ElevenLabs receives the SIP INVITE 
 * and fires this webhook with `caller_id` set to the Lead's phone number.
 * 
 * This endpoint:
 * 1. Parses the caller_id from the ElevenLabs payload.
 * 2. Looks up the Lead in the CRM database.
 * 3. Returns a JSON payload with `dynamic_variables` to instantly customize 
 *    the AI Agent's prompt before it speaks.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    systemLogger.info("[ELEVENLABS_PRE_CALL_WEBHOOK_RECEIVED]", JSON.stringify(payload));

    // ElevenLabs payload structure includes caller_id, sometimes under 'call' object or root
    const callerId = payload?.caller_id || payload?.call?.caller_id || payload?.call_id;

    if (!callerId) {
      systemLogger.warn("[ELEVENLABS_PRE_CALL] No caller_id found in webhook payload.");
      return NextResponse.json({
        dynamic_variables: {
          lead_first_name: "there",
          lead_last_name: "",
          company_name: "our team",
          campaign_context: "general inquiry",
          business_facts: "We are reaching out to see if you need anything."
        }
      });
    }

    // Try to find the lead in the database using the spoofed caller_id (E.164 phone number)
    // We normalize the phone number search slightly just in case of formatting diffs
    const targetPhone = callerId.startsWith("+") ? callerId : `+${callerId}`;

    const lead = await prisma.crm_Leads.findFirst({
      where: {
        OR: [
          { phone: targetPhone },
          { phone: callerId },
          { phone: callerId.replace(/^\+1/, "") }
        ]
      },
      orderBy: { // Prioritize recently updated leads just in case of duplicates
        updatedAt: 'desc'
      }
    });

    if (lead) {
      systemLogger.info(`[ELEVENLABS_PRE_CALL] Successfully matched caller_id ${callerId} to Lead ID ${lead.id}`);
      
      // Determine the active campaign for this lead to get the voice prompt
      const recentOutreach = await prisma.crm_Outreach_Items.findFirst({
        where: {
          lead: lead.id,
          channel: "PHONE",
        },
        orderBy: { updatedAt: 'desc' },
      });

      let campaignInstruction = "";
      if (recentOutreach && recentOutreach.campaign) {
         // Load the campaign
         const campaignParams = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id: recentOutreach.campaign },
            select: { voice_prompt: true, name: true }
         });
         
         if (campaignParams?.voice_prompt) {
             campaignInstruction = campaignParams.voice_prompt;
             systemLogger.info(`[ELEVENLABS_PRE_CALL] Injected custom voice prompt for campaign: ${campaignParams.name}`);
         }
      }

      return NextResponse.json({
        dynamic_variables: {
          agent_name: "Alex",
          lead_first_name: lead.firstName || "there",
          lead_last_name: lead.lastName || "",
          company_name: "Basalt CRM",
          campaign_context: lead.campaign || lead.description || "a recent inquiry or previous touchpoint",
          business_facts: `Company: ${lead.company || 'Unknown'}\nTitle: ${lead.jobTitle || 'Unknown'}\nLead Source: ${lead.lead_source || 'Direct'}.`,
          campaign_instruction: campaignInstruction || "Your goal is to answer questions and be helpful."
        }
      });
    }
    // Fallback if lead not found by phone
    systemLogger.warn(`[ELEVENLABS_PRE_CALL] Lead not found for caller_id: ${callerId}`);
    return NextResponse.json({
      dynamic_variables: {
        agent_name: "Alex",
        lead_first_name: "there",
        lead_last_name: "",
        company_name: "Basalt CRM",
        campaign_context: "your account",
        business_facts: "No additional context found."
      }
    });

  } catch (error: any) {
    systemLogger.error("[ELEVENLABS_PRE_CALL_ERROR]", error);
    // Even on error, return a valid blank payload so the call doesn't unnecessarily fail
    return NextResponse.json({
      dynamic_variables: {
        agent_name: "the AI assistant",
        lead_first_name: "there",
        company_name: "Basalt CRM",
        campaign_context: "a general check-in"
      }
    });
  }
}
