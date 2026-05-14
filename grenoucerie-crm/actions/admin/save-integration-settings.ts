
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";

export async function saveIntegrationSettings(data: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return { error: "Unauthorized" };
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.isAdmin) {
            return { error: "Forbidden" };
        }

        const teamId = teamInfo.teamId;
        if (!teamId) return { error: "No team context" };

        // Extract Surge Settings
        const surgeEnabled = data.get("surge_enabled") === "on";
        const surgeApiKey = data.get("surge_api_key") as string;
        const surgeMerchantId = data.get("surge_merchant_id") as string;

        // Extract Mercury Settings
        const mercuryEnabled = data.get("mercury_enabled") === "on";
        const mercuryApiKey = data.get("mercury_api_key") as string;
        const mercuryAccountId = data.get("mercury_account_id") as string;

        // Extract Shopify Settings
        const shopifyEnabled = data.get("shopify_enabled") === "on";
        const shopifyStoreUrl = data.get("shopify_store_url") as string;
        const shopifyAccessToken = data.get("shopify_access_token") as string;

        // Extract WooCommerce Settings
        const woocommerceEnabled = data.get("woocommerce_enabled") === "on";
        const woocommerceStoreUrl = data.get("woocommerce_store_url") as string;
        const woocommerceConsumerKey = data.get("woocommerce_consumer_key") as string;
        const woocommerceConsumerSecret = data.get("woocommerce_consumer_secret") as string;

        // Extract Twilio Settings
        const twilioEnabled = data.get("twilio_enabled") === "on";
        const twilioAccountSid = data.get("twilio_account_sid") as string;
        const twilioAuthToken = data.get("twilio_auth_token") as string;
        const twilioPhoneNumber = data.get("twilio_phone_number") as string;
        const voiceAgentName = data.get("voice_agent_name") as string;
        const elevenlabsApiKey = data.get("elevenlabs_api_key") as string;
        const elevenlabsAgentId = data.get("elevenlabs_agent_id") as string;

        // Validate
        if (surgeEnabled && (!surgeApiKey || !surgeMerchantId)) {
            return { error: "Surge API Key and ID are required when enabled." };
        }

        systemLogger.error(`[Integrations] Saving for team ${teamId}`);

        // Update or Create
        await prismadb.tenant_Integrations.upsert({
            where: { tenant_id: teamId },
            create: {
                tenant_id: teamId,
                surge_enabled: surgeEnabled,
                surge_api_key: surgeApiKey,
                surge_merchant_id: surgeMerchantId,
                mercury_enabled: mercuryEnabled,
                mercury_api_key: mercuryApiKey,
                mercury_account_id: mercuryAccountId,
                shopify_enabled: shopifyEnabled,
                shopify_store_url: shopifyStoreUrl || undefined,
                shopify_access_token: shopifyAccessToken || undefined,
                woocommerce_enabled: woocommerceEnabled,
                woocommerce_store_url: woocommerceStoreUrl || undefined,
                woocommerce_consumer_key: woocommerceConsumerKey || undefined,
                woocommerce_consumer_secret: woocommerceConsumerSecret || undefined,
                twilio_enabled: twilioEnabled,
                twilio_account_sid: twilioAccountSid || undefined,
                twilio_auth_token: twilioAuthToken || undefined,
                twilio_phone_number: twilioPhoneNumber || undefined,
                voice_agent_name: voiceAgentName || undefined,
                elevenlabs_api_key: elevenlabsApiKey || undefined,
                elevenlabs_agent_id: elevenlabsAgentId || undefined,
                preferred_chain: "BASE"
            },
            update: {
                surge_enabled: surgeEnabled,
                surge_api_key: surgeApiKey,
                surge_merchant_id: surgeMerchantId,
                mercury_enabled: mercuryEnabled,
                mercury_api_key: mercuryApiKey,
                mercury_account_id: mercuryAccountId,
                shopify_enabled: shopifyEnabled,
                shopify_store_url: shopifyStoreUrl || undefined,
                shopify_access_token: shopifyAccessToken || undefined,
                woocommerce_enabled: woocommerceEnabled,
                woocommerce_store_url: woocommerceStoreUrl || undefined,
                woocommerce_consumer_key: woocommerceConsumerKey || undefined,
                woocommerce_consumer_secret: woocommerceConsumerSecret || undefined,
                twilio_enabled: twilioEnabled,
                twilio_account_sid: twilioAccountSid || undefined,
                twilio_auth_token: twilioAuthToken || undefined,
                twilio_phone_number: twilioPhoneNumber || undefined,
                voice_agent_name: voiceAgentName || undefined,
                elevenlabs_api_key: elevenlabsApiKey || undefined,
                elevenlabs_agent_id: elevenlabsAgentId || undefined,
            }
        });

        revalidatePath("/admin/integrations");
        return { success: true };

    } catch (error) {
        systemLogger.error("[SaveIntegrations] Error:", error);
        return { error: "Failed to save settings." };
    }
}
