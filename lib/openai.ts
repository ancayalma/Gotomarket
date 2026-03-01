import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { prismadb } from "@/lib/prisma";
import { decryptSecret } from "@/lib/encryption";


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

    // --- Dynamic Provider Factory ---
    // Uses sdkType from AiProviderRegistry to determine which SDK to use.
    // Most modern LLM providers are OpenAI-compatible.
    const createProviderModel = async (providerSlug: string, modelId: string, apiKey?: string, resourceName?: string, baseURL?: string) => {
        // Look up provider registry for sdkType and default baseUrl
        let sdkType = "OPENAI_COMPATIBLE";
        let registryBaseUrl: string | undefined;
        try {
            const registry = await prismadb.aiProviderRegistry.findUnique({ where: { slug: providerSlug } });
            if (registry) {
                sdkType = registry.sdkType;
                registryBaseUrl = registry.baseUrl || undefined;
            }
        } catch { /* Registry may not be seeded yet, fall back to slug-based matching */ }

        // Fallback: infer sdkType from known built-in provider slugs
        if (!sdkType || sdkType === "OPENAI_COMPATIBLE") {
            const slugOverrides: Record<string, string> = {
                ANTHROPIC: "ANTHROPIC",
                GOOGLE: "GOOGLE",
                AZURE: "AZURE",
                MISTRAL: "MISTRAL",
            };
            sdkType = slugOverrides[providerSlug] || "OPENAI_COMPATIBLE";
        }

        const effectiveBaseURL = baseURL || registryBaseUrl;

        // Known provider-specific base URLs (fallbacks for built-in providers)
        const builtInBaseUrls: Record<string, string> = {
            GROK: "https://api.x.ai/v1",
            DEEPSEEK: "https://api.deepseek.com",
            PERPLEXITY: "https://api.perplexity.ai",
        };

        // Known env var keys per provider slug
        const envKeyMap: Record<string, string> = {
            OPENAI: "OPENAI_API_KEY",
            AZURE: "AZURE_OPENAI_API_KEY",
            ANTHROPIC: "ANTHROPIC_API_KEY",
            GOOGLE: "GOOGLE_GENERATIVE_AI_API_KEY",
            GROK: "XAI_API_KEY",
            DEEPSEEK: "DEEPSEEK_API_KEY",
            PERPLEXITY: "PERPLEXITY_API_KEY",
            MISTRAL: "MISTRAL_API_KEY",
        };
        const envKey = envKeyMap[providerSlug];
        const effectiveApiKey = apiKey || (envKey ? process.env[envKey] : undefined);

        switch (sdkType) {
            case "AZURE": {
                const effectiveResourceName = resourceName || process.env.AZURE_OPENAI_RESOURCE_NAME;
                const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
                console.log(`[AZURE_DEBUG] Using Resource: ${effectiveResourceName} (Version: ${apiVersion})`);
                const azure = createAzure({
                    apiKey: effectiveApiKey!,
                    resourceName: effectiveResourceName,
                    apiVersion: apiVersion,
                });
                return azure(modelId);
            }
            case "ANTHROPIC": {
                const anthropic = createAnthropic({
                    apiKey: effectiveApiKey || process.env.ANTHROPIC_API_KEY,
                    baseURL: effectiveBaseURL,
                });
                return anthropic(modelId);
            }
            case "GOOGLE": {
                const google = createGoogleGenerativeAI({
                    apiKey: effectiveApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                    baseURL: effectiveBaseURL,
                });
                return google(modelId);
            }
            case "MISTRAL": {
                const mistral = createMistral({
                    apiKey: effectiveApiKey || process.env.MISTRAL_API_KEY,
                    baseURL: effectiveBaseURL,
                });
                return mistral(modelId);
            }
            case "OPENAI_COMPATIBLE":
            case "CUSTOM":
            default: {
                // Covers: OpenAI, Grok, DeepSeek, Perplexity, Groq, Together,
                // Fireworks, HuggingFace, Ollama, LM Studio, vLLM, and any
                // OpenAI-compatible endpoint.
                const openai = createOpenAI({
                    name: providerSlug.toLowerCase(),
                    apiKey: effectiveApiKey || process.env.OPENAI_API_KEY,
                    baseURL: effectiveBaseURL || builtInBaseUrls[providerSlug] || cleanUrl(process.env.OPENAI_BASE_URL),
                });
                return openai(modelId);
            }
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
    const systemModelId = systemConfig?.defaultModelId || "gpt-4o";
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
    let rawSystemKey = systemConfig?.apiKey ?? undefined;
    if (rawSystemKey) rawSystemKey = decryptSecret(rawSystemKey) || rawSystemKey;
    let finalApiKey: string | undefined = rawSystemKey;
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
                    finalApiKey = decryptSecret(specificSystemConfig.apiKey) || specificSystemConfig.apiKey;
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
                finalApiKey = decryptSecret(teamConfig.apiKey) || teamConfig.apiKey;
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
