
import { prismadb } from "./prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { decryptSecret } from "./encryption";


// Known provider-specific base URLs (fallbacks for built-in providers)
const BUILT_IN_BASE_URLS: Record<string, string> = {
    GROK: "https://api.x.ai/v1",
    DEEPSEEK: "https://api.deepseek.com",
    PERPLEXITY: "https://api.perplexity.ai",
};

// Known env var keys per provider slug
const ENV_KEY_MAP: Record<string, string> = {
    OPENAI: "OPENAI_API_KEY",
    AZURE: "AZURE_OPENAI_API_KEY",
    ANTHROPIC: "ANTHROPIC_API_KEY",
    GOOGLE: "GOOGLE_GENERATIVE_AI_API_KEY",
    GROK: "XAI_API_KEY",
    DEEPSEEK: "DEEPSEEK_API_KEY",
    PERPLEXITY: "PERPLEXITY_API_KEY",
    MISTRAL: "MISTRAL_API_KEY",
};

export async function getAiClient(teamId: string) {
    // 1. Fetch Team Config
    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: teamId },
    });

    const preferredProvider = teamConfig?.provider || "OPENAI";

    // 2. Fetch System Config for logic reuse
    const systemConfig = await prismadb.systemAiConfig.findUnique({
        where: { provider: preferredProvider }
    });

    // 3. Determine Active Model
    // Priority: Team Override -> System Default for Provider -> Any Active for Provider
    let modelRecord = null;

    if (teamConfig?.modelId) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { modelId: teamConfig.modelId, provider: preferredProvider, isActive: true }
        });
    }

    if (!modelRecord && systemConfig?.defaultModelId) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { modelId: systemConfig.defaultModelId, provider: preferredProvider, isActive: true }
        });
    }

    // Fallback to ANY active model for this provider if no default set
    if (!modelRecord) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { provider: preferredProvider, isActive: true }
        });
    }

    if (!modelRecord) {
        throw new Error("No active AI models found.");
    }

    // 4. Determine Configuration (Key, URL, Azure specifics)
    let apiKey: string | null = null;
    let baseURL: string | null = null;
    let providerConfig: any = {};

    if (teamConfig && !teamConfig.useSystemKey && teamConfig.apiKey) {
        // Use Team Key - Simple key only
        apiKey = decryptSecret(teamConfig.apiKey) || teamConfig.apiKey;
    } else {
        // Use System Key & Configs
        const envKey = ENV_KEY_MAP[modelRecord.provider];
        let sysKeyRaw = systemConfig?.apiKey || null;
        if (sysKeyRaw) sysKeyRaw = decryptSecret(sysKeyRaw) || sysKeyRaw;
        apiKey = sysKeyRaw || (envKey ? process.env[envKey] : null) || null;
        baseURL = systemConfig?.baseUrl || null;
        if (baseURL && baseURL.endsWith("/")) {
            baseURL = baseURL.slice(0, -1);
        }
        providerConfig = systemConfig?.configuration as any || {};
    }

    if (!apiKey) {
        if (modelRecord.provider === "OPENAI") apiKey = process.env.OPENAI_API_KEY!;
    }

    if (!apiKey && modelRecord.provider !== "GOOGLE") {
        // Silently allow — some providers may use other auth
    }

    // 5. Resolve sdkType from AiProviderRegistry (dynamic)
    let sdkType = "OPENAI_COMPATIBLE";
    let registryBaseUrl: string | undefined;

    try {
        const registry = await prismadb.aiProviderRegistry.findUnique({
            where: { slug: modelRecord.provider }
        });
        if (registry) {
            sdkType = registry.sdkType;
            registryBaseUrl = registry.baseUrl || undefined;
        }
    } catch { /* Registry may not be seeded yet */ }

    // Fallback: infer sdkType from known built-in slugs
    const slugToSdkType: Record<string, string> = {
        ANTHROPIC: "ANTHROPIC",
        GOOGLE: "GOOGLE",
        AZURE: "AZURE",
        MISTRAL: "MISTRAL",
    };
    if (sdkType === "OPENAI_COMPATIBLE" && slugToSdkType[modelRecord.provider]) {
        sdkType = slugToSdkType[modelRecord.provider];
    }

    const effectiveBaseURL = baseURL || registryBaseUrl || BUILT_IN_BASE_URLS[modelRecord.provider] || undefined;

    // 6. Instantiate SDK based on sdkType
    let model;

    switch (sdkType) {
        case "AZURE": {
            // Priority: Env Vars -> Provider Config (DB)
            const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT || baseURL || registryBaseUrl;
            const endpoint = rawEndpoint?.endsWith("/") ? rawEndpoint.slice(0, -1) : rawEndpoint;
            const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT || providerConfig.deploymentId || modelRecord.modelId;
            const apiVersion = process.env.AZURE_OPENAI_API_VERSION || providerConfig.apiVersion;
            const effectiveKey = process.env.AZURE_OPENAI_API_KEY || apiKey;

            // Robust Resource Name Extraction (if not explicitly provided)
            let finalResourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || providerConfig.resourceName;
            if (!finalResourceName && endpoint) {
                try {
                    const url = new URL(endpoint);
                    // Match resource from {resource}.openai.azure.com or {resource}.cognitiveservices.azure.com
                    const match = url.hostname.match(/^([^.]+)\.(openai|cognitiveservices)\.azure\.com$/);
                    if (match) {
                        finalResourceName = match[1];
                    }
                } catch (e) { }
            }

            console.log("[AI_DEBUG] Azure Configuration (Dynamic):", {
                finalResourceName,
                deploymentId,
                apiVersion,
                endpoint
            });

            if (!finalResourceName && !endpoint) throw new Error("Azure Configuration Missing: Set AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_RESOURCE_NAME");

            const azure = createAzure({
                apiKey: effectiveKey!,
                resourceName: finalResourceName || undefined,
                apiVersion: apiVersion || undefined,
                // Only pass baseURL if we are NOT using the standard resourceName-based path construction
                baseURL: !finalResourceName ? endpoint : undefined
            });
            model = azure(deploymentId);
            break;
        }
        case "ANTHROPIC": {
            const anthropic = createAnthropic({ apiKey: apiKey!, baseURL: effectiveBaseURL });
            model = anthropic(modelRecord.modelId);
            break;
        }
        case "GOOGLE": {
            const google = createGoogleGenerativeAI({ apiKey: apiKey!, baseURL: effectiveBaseURL });
            model = google(modelRecord.modelId);
            break;
        }
        case "MISTRAL": {
            const mistral = createMistral({ apiKey: apiKey!, baseURL: effectiveBaseURL });
            model = mistral(modelRecord.modelId);
            break;
        }
        case "OPENAI_COMPATIBLE":
        case "CUSTOM":
        default: {
            // Covers: OpenAI, Grok, DeepSeek, Perplexity, Groq, Together,
            // Fireworks, HuggingFace, Ollama, and any OpenAI-compatible endpoint.
            const provider = createOpenAI({
                name: modelRecord.provider.toLowerCase(),
                apiKey: apiKey!,
                baseURL: effectiveBaseURL
            });
            model = provider(modelRecord.modelId);
            break;
        }
    }

    return { client: model, model: model, provider: modelRecord.provider, modelId: modelRecord.modelId };
}

