
import { prismadb } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidatePath } from "next/cache";
import {
    OpenAIIcon,
    AnthropicIcon,
    GoogleIcon,
    AzureIcon,
    MistralIcon,
    PerplexityIcon,
    DeepSeekIcon,
    GrokIcon,
} from "@/components/ai/ProviderIcons";
import { Cpu, ExternalLink, Key, Lock, Check, Shield, Globe, Save } from "lucide-react";

// ─── Provider visual metadata ───
const PROVIDER_UI: Record<string, {
    name: string;
    color: string;
    gradient: string;
    icon: React.ReactNode;
    apiKeyUrl?: string;
}> = {
    OPENAI: {
        name: "OpenAI",
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-green-500/10",
        icon: <OpenAIIcon className="w-5 h-5" />,
        apiKeyUrl: "https://platform.openai.com/api-keys",
    },
    AZURE: {
        name: "Azure OpenAI",
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/10",
        icon: <AzureIcon className="w-5 h-5" />,
        apiKeyUrl: "https://portal.azure.com",
    },
    ANTHROPIC: {
        name: "Anthropic",
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-amber-500/10",
        icon: <AnthropicIcon className="w-5 h-5" />,
        apiKeyUrl: "https://console.anthropic.com/settings/keys",
    },
    GOOGLE: {
        name: "Google AI",
        color: "text-red-400",
        gradient: "from-red-500/20 to-yellow-500/10",
        icon: <GoogleIcon className="w-5 h-5" />,
        apiKeyUrl: "https://aistudio.google.com/apikey",
    },
    GROK: {
        name: "xAI (Grok)",
        color: "text-gray-300",
        gradient: "from-gray-500/20 to-zinc-500/10",
        icon: <GrokIcon className="w-5 h-5" />,
        apiKeyUrl: "https://console.x.ai/team/default/api-keys",
    },
    DEEPSEEK: {
        name: "DeepSeek",
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-violet-500/10",
        icon: <DeepSeekIcon className="w-5 h-5" />,
        apiKeyUrl: "https://platform.deepseek.com/api_keys",
    },
    PERPLEXITY: {
        name: "Perplexity",
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-cyan-500/10",
        icon: <PerplexityIcon className="w-5 h-5" />,
        apiKeyUrl: "https://www.perplexity.ai/settings/api",
    },
    MISTRAL: {
        name: "Mistral AI",
        color: "text-amber-400",
        gradient: "from-amber-500/20 to-yellow-500/10",
        icon: <MistralIcon className="w-5 h-5" />,
        apiKeyUrl: "https://console.mistral.ai/api-keys/",
    },
    HUGGINGFACE: {
        name: "Hugging Face",
        color: "text-yellow-400",
        gradient: "from-yellow-500/20 to-orange-500/10",
        icon: <Cpu className="w-5 h-5" />,
        apiKeyUrl: "https://huggingface.co/settings/tokens",
    },
};

const getProviderUI = (slug: string) => {
    if (PROVIDER_UI[slug]) return PROVIDER_UI[slug];
    return {
        name: slug.charAt(0) + slug.slice(1).toLowerCase(),
        color: "text-gray-400",
        gradient: "from-gray-500/20 to-slate-500/10",
        icon: <Cpu className="w-5 h-5" />,
        apiKeyUrl: undefined,
    };
};

const UnifiedAiCard = async () => {

    const systemConfigs = await prismadb.systemAiConfig.findMany();

    // Fetch specific models for dropdowns
    const allModels = await prismadb.aiModel.findMany({
        where: { isActive: true }
    });

    // Helper to get config for a provider
    const getConfig = (provider: string) => systemConfigs.find(c => c.provider === provider);

    const saveConfig = async (formData: FormData) => {
        "use server";
        const provider = formData.get("provider") as string;
        const apiKey = formData.get("apiKey") as string;
        const baseUrl = formData.get("baseUrl") as string;
        const isActive = formData.get("isActive") === "on";
        const defaultModelId = formData.get("defaultModelId") as string;

        // Azure/Google Specifics
        const resourceName = formData.get("resourceName") as string;
        const deploymentId = formData.get("deploymentId") as string;
        const apiVersion = formData.get("apiVersion") as string;
        const projectId = formData.get("projectId") as string;

        let configuration = {};

        if (provider === "AZURE") {
            configuration = { resourceName, deploymentId, apiVersion };
        } else if (provider === "GOOGLE") {
            configuration = { projectId };
        }

        await prismadb.systemAiConfig.upsert({
            where: { provider },
            create: {
                provider,
                apiKey: (apiKey || undefined) as any,
                baseUrl,
                configuration: configuration,
                defaultModelId: defaultModelId || null,
                isActive
            },
            update: {
                apiKey: (apiKey || undefined) as any,
                baseUrl,
                configuration: configuration,
                defaultModelId: defaultModelId || null,
                isActive
            }
        });

        revalidatePath("/admin");
        revalidatePath("/partners/ai-system-config");
    };

    // Fetch registered providers from database (dynamic, not enum)
    let providers: string[] = [];
    try {
        const registeredProviders = await prismadb.aiProviderRegistry.findMany({
            where: { isActive: true },
            orderBy: { slug: 'asc' },
            select: { slug: true }
        });
        providers = registeredProviders.map(p => p.slug);
    } catch {
        // Fallback: derive from active models if registry not seeded
        const uniqueProviders = Array.from(new Set(allModels.map(m => m.provider)));
        providers = uniqueProviders.sort();
    }
    // Ensure at least the built-in providers are present
    if (providers.length === 0) {
        providers = ["OPENAI", "AZURE", "ANTHROPIC", "GOOGLE", "GROK", "DEEPSEEK", "PERPLEXITY", "MISTRAL"];
    }

    // Count configured providers
    const configuredCount = providers.filter(p => {
        const c = getConfig(p);
        return c?.apiKey && c.apiKey.length > 0;
    }).length;

    return (
        <div className="space-y-3">
            {/* Subtle info banner */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400/80">
                    These define the <span className="font-semibold text-amber-400">System Keys</span> and <span className="font-semibold text-amber-400">System Defaults</span>.
                    Teams inherit them unless they provide their own.
                </p>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] h-5 px-2 border-amber-500/20 text-amber-400 bg-amber-500/5">
                    {configuredCount}/{providers.length} configured
                </Badge>
            </div>

            {/* Provider Cards */}
            {providers.map(provider => {
                const config = getConfig(provider);
                const configJson = config?.configuration as any || {};
                const providerModels = allModels.filter(m => m.provider === provider);
                const ui = getProviderUI(provider);
                const hasKey = config?.apiKey && config.apiKey.length > 0;
                const isEnabled = config?.isActive ?? true;

                return (
                    <form key={provider} action={saveConfig} suppressHydrationWarning>
                        <input type="hidden" name="provider" value={provider} />

                        <div className={`group rounded-xl border transition-colors duration-300 ${isEnabled
                            ? "border-border/50 bg-card/80 hover:border-border"
                            : "border-border/20 bg-card/30 opacity-50 hover:opacity-70"
                            }`}>
                            {/* ─── Provider Header Row ─── */}
                            <div className="flex items-center gap-3 p-4 pb-0">
                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0 ${ui.gradient}`}>
                                    <span className={ui.color}>{ui.icon}</span>
                                </div>

                                {/* Name + status */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm text-foreground">{ui.name}</h3>
                                        {hasKey ? (
                                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-0.5">
                                                <Check className="w-2.5 h-2.5" />
                                                Key Set
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-muted/30 text-muted-foreground border-border/30">
                                                No Key
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {providerModels.length} model{providerModels.length !== 1 ? "s" : ""} available
                                        {config?.defaultModelId && (
                                            <> · Default: <span className="font-mono">{config.defaultModelId}</span></>
                                        )}
                                    </p>
                                </div>

                                {/* Right side controls */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {ui.apiKeyUrl && (
                                        <a
                                            href={ui.apiKeyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                        >
                                            Get Key
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <Switch name="isActive" defaultChecked={isEnabled} />
                                    </div>
                                </div>
                            </div>

                            {/* ─── Form Fields ─── */}
                            <div className="p-4 pt-3 space-y-3">
                                {/* API Key + Default Model — side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5" suppressHydrationWarning>
                                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            API Key
                                        </Label>
                                        <Input
                                            name="apiKey"
                                            type="password"
                                            placeholder={`Enter ${ui.name} API Key`}
                                            defaultValue={config?.apiKey || ""}
                                            className="h-9 text-sm bg-muted/20 border-border/30 focus:border-primary/50 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Cpu className="w-3 h-3" />
                                            Default Model
                                        </Label>
                                        <Select name="defaultModelId" defaultValue={config?.defaultModelId || ""}>
                                            <SelectTrigger className="h-9 text-sm bg-muted/20 border-border/30">
                                                <SelectValue placeholder="Select default model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {providerModels.length === 0 && <SelectItem value="none" disabled>No active models</SelectItem>}
                                                {providerModels.map(m => (
                                                    <SelectItem key={m.id} value={m.modelId}>
                                                        <span className="font-medium">{m.name}</span>
                                                        <span className="text-muted-foreground ml-1 text-xs font-mono">({m.modelId})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* ─── AZURE-SPECIFIC FIELDS ─── */}
                                {provider === "AZURE" && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-blue-400/80">Resource Name</Label>
                                            <Input name="resourceName" placeholder="my-openai-resource" defaultValue={configJson.resourceName || ""}
                                                className="h-8 text-xs bg-muted/20 border-border/30 font-mono" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-blue-400/80">Deployment ID</Label>
                                            <Input name="deploymentId" placeholder="my-gpt4-deployment" defaultValue={configJson.deploymentId || ""}
                                                className="h-8 text-xs bg-muted/20 border-border/30 font-mono" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-blue-400/80">API Version</Label>
                                            <Input name="apiVersion" placeholder="2024-02-15-preview" defaultValue={configJson.apiVersion || ""}
                                                className="h-8 text-xs bg-muted/20 border-border/30 font-mono" />
                                        </div>
                                    </div>
                                )}

                                {/* ─── GOOGLE-SPECIFIC FIELDS ─── */}
                                {provider === "GOOGLE" && (
                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1.5">
                                        <Label className="text-[10px] text-red-400/80">Project ID (Vertex AI only)</Label>
                                        <Input name="projectId" placeholder="my-gcp-project-id" defaultValue={configJson.projectId || ""}
                                            className="h-8 text-xs bg-muted/20 border-border/30 font-mono" />
                                        <p className="text-[10px] text-muted-foreground">Leave empty if using Google AI Studio API Key.</p>
                                    </div>
                                )}

                                {/* Base URL + Save — side by side */}
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            Base URL
                                            <span className="text-muted-foreground/50">(optional)</span>
                                        </Label>
                                        <Input
                                            name="baseUrl"
                                            placeholder="https://api.example.com/v1"
                                            defaultValue={config?.baseUrl || ""}
                                            className="h-9 text-sm bg-muted/20 border-border/30 font-mono"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className={`h-9 gap-1.5 px-4 shrink-0 transition-colors duration-300 ${hasKey
                                            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                                            : ""
                                            }`}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                );
            })}
        </div>
    );
};

export default UnifiedAiCard;
