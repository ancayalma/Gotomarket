
import { prismadb } from "./prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";

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
        apiKey = teamConfig.apiKey;
    } else {
        // Use System Key & Configs
        const envKey = ENV_KEY_MAP[modelRecord.provider];
        apiKey = systemConfig?.apiKey || (envKey ? process.env[envKey] : null) || null;
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
            const resourceName = providerConfig.resourceName || process.env.AZURE_OPENAI_RESOURCE_NAME;
            const deploymentId = providerConfig.deploymentId || process.env.AZURE_OPENAI_DEPLOYMENT || modelRecord.modelId;
            if (!resourceName) throw new Error("Azure Resource Name missing");
            const azure = createAzure({ apiKey: apiKey!, resourceName, baseURL: effectiveBaseURL });
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

