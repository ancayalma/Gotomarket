import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/api-auth-guard";
import { prismadbCrm as prisma } from "@/lib/prisma-crm";
import { systemLogger } from "@/lib/logger";

// Ensure Node.js runtime for AWS SDK compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// We must initialize the Chime API client to initiate the calls
import { ChimeSDKVoiceClient, CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";

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
  if (authResponse) return authResponse;

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

    const smaId = process.env.CHIME_SMA_APPLICATION_ID || process.env.CHIME_SMA_ID;
    const defaultFrom = process.env.CHIME_SOURCE_PHONE || process.env.CHIME_FROM_PHONE_NUMBER;
    const region = process.env.CHIME_VOICE_REGION || process.env.AWS_REGION || "us-west-2";

    if (!smaId || !defaultFrom) {
      systemLogger.error("[CRON_VOICE] Missing AWS Chime configuration variables");
      return new NextResponse("Configuration Error", { status: 500 });
    }

    const client = new ChimeSDKVoiceClient({ region });
    let totalProcessed = 0;

    // 3. Process each campaign individually
    for (const campaign of activeVoiceCampaigns) {
      const agentId = campaign.voice_agent_id || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
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

          // Trigger Chime API
          const sipHeaders: Record<string, string> = {
            "X-Elevenlabs-Agent-Id": agentId,
            "x-elevenlabs-agent-id": agentId,
            "X-Lead-Id": String(lead.id),
            "x-lead-id": String(lead.id)
          };

          const argumentsMap: Record<string, string> = {
            "X-Elevenlabs-Agent-Id": agentId,
            "LeadId": String(lead.id)
          };

          const cmd = new CreateSipMediaApplicationCallCommand({
            SipMediaApplicationId: smaId,
            FromPhoneNumber: defaultFrom,
            ToPhoneNumber: lead.phone.trim(),
            SipHeaders: sipHeaders,
            ArgumentsMap: argumentsMap,
          });

          await client.send(cmd);
          totalProcessed++;

          // Transition to SENT status indicating successful handoff to Chime
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
                message: "Batched AI Voice Call initiated",
                agentId: agentId,
                campaign: campaign.id
              } as any
            }
          });

        } catch (callErr: any) {
           systemLogger.error(`[CRON_VOICE] Error initiating call for Lead ${item.lead}:`, callErr);
           await prisma.crm_Outreach_Items.update({
              where: { id: item.id },
              data: { status: "FAILED", error_message: callErr?.message || "AWS Chime SDK Error" }
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
