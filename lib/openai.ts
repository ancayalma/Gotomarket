import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";

export function isReasoningModel(modelId: string | undefined | null): boolean {
    if (!modelId) return false;
    return modelId.toLowerCase().includes("o1") ||
        modelId.toLowerCase().includes("gpt-5") ||
        modelId.toLowerCase().includes("deepseek-reasoner");
}

// Temporary fix for Azure OpenAI "unable to get local issuer certificate" in dev
if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function getAiSdkModel(userId: string | "system") {
    const DEBUG_PREFIX = "[getAiSdkModel]";

    // Helper to clean URL (remove trailing slash)
    const cleanUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        return url.endsWith('/') ? url.slice(0, -1) : url;
    };

    // --- Provider Factory Helper ---
    const createProviderModel = (provider: AiProvider, modelId: string, apiKey?: string, resourceName?: string, baseURL?: string) => {
        switch (provider) {
            case "OPENAI": {
                const openai = createOpenAI({
                    apiKey: apiKey || process.env.OPENAI_API_KEY,
                    baseURL: baseURL || cleanUrl(process.env.OPENAI_BASE_URL),
                });
                return openai(modelId);
            }
            case "AZURE": {
                const effectiveResourceName = resourceName || process.env.AZURE_OPENAI_RESOURCE_NAME;
                const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";

                // FORCE URL Construction:
                // The SDK was defaulting to /openai/v1/chat/completions which is invalid for this Azure resource.
                // We will manually construct the deployment endpoint to ensure it's correct.
                // Format: https://{resource}.openai.azure.com/openai/deployments/{deployment}

                let forcedBaseURL = baseURL;
                if (!forcedBaseURL && effectiveResourceName) {
                    forcedBaseURL = `https://${effectiveResourceName}.openai.azure.com/openai/deployments/${modelId}`;
                }

                console.log(`[AZURE_DEBUG] Force-Constructed URL: ${forcedBaseURL} (Version: ${apiVersion})`);

                const azure = createAzure({
                    apiKey: apiKey || process.env.AZURE_OPENAI_API_KEY,
                    baseURL: forcedBaseURL,
                    resourceName: undefined, // Disable SDK internal resource logic to rely on our forced URL
                    apiVersion: apiVersion,
                });
                return azure(modelId);
            }
            case "GOOGLE": {
                const google = createGoogleGenerativeAI({
                    apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                    baseURL: baseURL, // Google might not use this standard prop, but good to have
                });
                return google(modelId);
            }
            case "ANTHROPIC": {
                const anthropic = createAnthropic({
                    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
                    baseURL: baseURL,
                });
                return anthropic(modelId);
            }
            case "GROK": {
                // xAI (Grok) uses an OpenAI-compatible API
                const grok = createOpenAI({
                    name: 'grok',
                    baseURL: baseURL || 'https://api.x.ai/v1',
                    apiKey: apiKey || process.env.XAI_API_KEY,
                });
                return grok(modelId);
            }
            case "DEEPSEEK": {
                // DeepSeek uses an OpenAI-compatible API
                const deepseek = createOpenAI({
                    name: 'deepseek',
                    baseURL: baseURL || 'https://api.deepseek.com',
                    apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
                });
                return deepseek(modelId);
            }
            case "MISTRAL": {
                const mistral = createMistral({
                    apiKey: apiKey || process.env.MISTRAL_API_KEY,
                    baseURL: baseURL,
                });
                return mistral(modelId);
            }
            default:
                console.warn(`${DEBUG_PREFIX} Unknown provider ${provider}, falling back to OpenAI`);
                const fallback = createOpenAI({
                    apiKey: process.env.OPENAI_API_KEY,
                    baseURL: cleanUrl(process.env.OPENAI_BASE_URL)
                });
                return fallback(modelId);
        }
    };

    // 1. Get System Config (Default Fallback)
    const getSystemConfig = async () => {
        try {
            return await prismadb.systemAiConfig.findFirst({ where: { isActive: true } });
        } catch (error) {
            console.warn("Failed to fetch system config", error);
            return null;
        }
    };
    const systemConfig = await getSystemConfig();
    const systemModelId = systemConfig?.defaultModelId || "gpt-5";
    const systemProvider = systemConfig?.provider || "OPENAI";

    // 2. Resolve User's Team Config
    let teamConfig = null;
    if (userId !== "system") {
        const user = await prismadb.users.findUnique({
            where: { id: userId },
            select: { team_id: true }
        });
        if (user?.team_id) {
            teamConfig = await prismadb.teamAiConfig.findUnique({
                where: { team_id: user.team_id },
            });
        }
    }

    // 3. Determine Final Config
    let finalProvider = systemProvider;
    let finalModelId = systemModelId;
    let finalApiKey: string | undefined = systemConfig?.apiKey ?? undefined;
    let finalResourceName: string | undefined = undefined;
    let finalBaseURL: string | undefined = systemConfig?.baseUrl ?? undefined;

    // Helper to extract resourceName from config JSON
    const extractResourceName = (config: any): string | undefined => {
        if (config && typeof config === 'object' && config.resourceName) {
            return config.resourceName as string;
        }
        return undefined;
    };

    // Initialize from default system config
    if (systemConfig?.configuration) {
        finalResourceName = extractResourceName(systemConfig.configuration);
    }

    if (teamConfig) {
        // Override with team pref if set
        finalProvider = teamConfig.provider;
        finalModelId = teamConfig.modelId || systemModelId;

        // Key Logic: 
        // If useSystemKey is TRUE -> Ensure we use the system key for the TEAM'S chosen provider if available.
        // If useSystemKey is FALSE -> Use the team's apiKey.

        if (teamConfig.useSystemKey) {
            // Find system config for the TEAM'S provider? 
            if (finalProvider !== systemProvider) {
                const specificSystemConfig = await prismadb.systemAiConfig.findUnique({
                    where: { provider: finalProvider }
                });
                if (specificSystemConfig?.apiKey) {
                    finalApiKey = specificSystemConfig.apiKey;
                } else {
                    finalApiKey = undefined;
                }

                // Also update resourceName/baseUrl from the specific system config
                if (specificSystemConfig?.baseUrl) {
                    finalBaseURL = specificSystemConfig.baseUrl;
                }
                if (specificSystemConfig?.configuration) {
                    finalResourceName = extractResourceName(specificSystemConfig.configuration);
                }
            } else {
                // Using default system provider, key and resourceName already set above
            }
        } else {
            // Use custom team key
            if (teamConfig.apiKey) {
                finalApiKey = teamConfig.apiKey;
            }
            // Note: TeamAiConfig currently doesn't support storing resourceName, 
            // so if they use a custom key for Azure, they might still rely on System resourceName or Env var.
        }
    }

    // Sanitize baseURL
    finalBaseURL = cleanUrl(finalBaseURL);

    console.debug(`${DEBUG_PREFIX} Selected: Provider=${finalProvider} | Model=${finalModelId} | User=${userId}`);
    return createProviderModel(finalProvider, finalModelId, finalApiKey, finalResourceName, finalBaseURL);
}
