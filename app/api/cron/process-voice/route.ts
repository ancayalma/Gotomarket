import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/api-auth-guard";
import { prismadbCrm as prisma } from "@/lib/prisma-crm";
import { systemLogger } from "@/lib/logger";

// Ensure Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

function isE164(num: string) {
  return /^\+[1-9]\d{1,14}$/.test(num);
}

export async function GET(req: Request) {
  return processVoiceCampaigns(req);
}
export async function POST(req: Request) {
  return processVoiceCampaigns(req);
}

async function processVoiceCampaigns(req: Request) {
  // 1. Authenticate Cron (Uses ?token= CRON_SECRET or Header)
  const authResponse = requireCronAuth(req);
  if (authResponse instanceof Response) return authResponse;

  systemLogger.info("[CRON_VOICE] Starting voice campaign processor...");

  try {
    // 2. Fetch all VOICE_BATCH chron jobs to know which campaigns are allowed to dispatch
    const voiceCronJobs = await prisma.crm_Cron_Jobs.findMany({
      where: {
        job_type: "VOICE_BATCH",
        status: "ACTIVE"
      },
      select: { campaign_id: true, id: true, run_count: true }
    });

    // Map allowed campaigns to their specific chron job for stat tracking
    const allowedCampaignsMap = new Map(
      voiceCronJobs
        .filter((job: any) => job.campaign_id != null)
        .map((job: any) => [job.campaign_id, job.id])
    );

    if (allowedCampaignsMap.size === 0) {
      return NextResponse.json({ message: "No active voice batch CRON jobs to process at this time." });
    }

    // 3. Fetch ACTIVE campaigns with PHONE channel and past/null start time, filtering by the allowed map
    const activeVoiceCampaigns = await prisma.crm_Outreach_Campaigns.findMany({
      where: {
        id: { in: Array.from(allowedCampaignsMap.keys()) as string[] },
        status: "ACTIVE",
        channels: { has: "PHONE" },
        OR: [
          { voice_start_time: null },
          { voice_start_time: { lte: new Date() } }
        ]
      },
      select: {
        id: true,
        voice_agent_id: true,
        voice_concurrency_limit: true,
        user: true,
      }
    });

    if (activeVoiceCampaigns.length === 0) {
      return NextResponse.json({ message: "No active voice campaigns to process at this time." });
    }

    // ElevenLabs API key for native Twilio outbound
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

    if (!ELEVENLABS_API_KEY) {
      systemLogger.error("[CRON_VOICE] Missing ELEVENLABS_API_KEY");
      return new NextResponse("Configuration Error: ELEVENLABS_API_KEY required", { status: 500 });
    }

    let totalProcessed = 0;

    // 4. Process each campaign individually
    for (const campaign of activeVoiceCampaigns) {
      const agentId = campaign.voice_agent_id || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT;
      if (!agentId) {
        systemLogger.warn(`[CRON_VOICE] Campaign ${campaign.id} skipped: No ElevenLabs Agent ID configured.`);
        continue;
      }

      // Concurrency functions as "Calls Per Minute Rate Limit" mapped from the UI Slider
      const fetchLimit = Math.max(0, (campaign.voice_concurrency_limit || 2));
      if (fetchLimit <= 0) continue;

      const pendingItems = await prisma.crm_Outreach_Items.findMany({
        where: {
          campaign: campaign.id,
          channel: "PHONE",
          status: "PENDING",
        },
        take: fetchLimit,
      });

      if (pendingItems.length === 0) continue;

      // Fetch the actual Leads from main DB to get their phone numbers
      const { prismadb } = await import("@/lib/prisma"); 
      
      for (const item of pendingItems) {
        try {
          if (!item.lead) continue;
          
          const lead = await prismadb.crm_Leads.findUnique({
            where: { id: item.lead },
            select: { id: true, phone: true }
          });

          if (!lead || !lead.phone || !isE164(lead.phone)) {
            // Invalid phone or missing lead
            await prisma.crm_Outreach_Items.update({
              where: { id: item.id },
              data: { status: "FAILED", error_message: "Invalid or missing E.164 phone number" }
            });
            continue;
          }

          // Move to SENDING immediately to prevent double-processing if cron scales out
          await prisma.crm_Outreach_Items.update({
            where: { id: item.id },
            data: { status: "SENDING", sentAt: new Date() }
          });

          // Trigger ElevenLabs native Twilio outbound call
          const payload: Record<string, any> = {
            agent_id: agentId,
            to_number: lead.phone.trim(),
          };

          if (agentPhoneNumberId) {
            payload.agent_phone_number_id = agentPhoneNumberId;
          }

          // Pass lead context
          payload.custom_llm_extra_body = {
            leadId: String(lead.id),
          };

          const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound_call", {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`ElevenLabs API ${res.status}: ${errText}`);
          }

          totalProcessed++;

          // Transition to SENT status indicating successful handoff
          await prisma.crm_Outreach_Items.update({
            where: { id: item.id },
            data: { status: "SENT" }
          });

          // Log in main DB Lead Activities list
          await prismadb.crm_Lead_Activities.create({
            data: {
              lead: lead.id,
              user: campaign.user,
              type: "call_outbound",
              metadata: {
                message: "Batched AI Voice Call initiated via Twilio",
                agentId: agentId,
                campaign: campaign.id
              } as any
            }
          });

        } catch (callErr: any) {
           systemLogger.error(`[CRON_VOICE] Error initiating call for Lead ${item.lead}:`, callErr);
           await prisma.crm_Outreach_Items.update({
              where: { id: item.id },
              data: { status: "FAILED", error_message: callErr?.message || "ElevenLabs/Twilio Error" }
           });
        }
      }

      // Update campaigns count
      const sentCount = await prisma.crm_Outreach_Items.count({
         where: { campaign: campaign.id, channel: "PHONE", status: "SENT" }
      });
      await prisma.crm_Outreach_Campaigns.update({
         where: { id: campaign.id },
         data: { calls_initiated: sentCount }
      });
    }

    systemLogger.info(`[CRON_VOICE] Successfully processed ${totalProcessed} voice calls this cycle.`);
    return NextResponse.json({ processed: totalProcessed, message: "Voice cron job finished successfully" });
  } catch (err: any) {
    systemLogger.error("[CRON_VOICE] Failure running cron:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
