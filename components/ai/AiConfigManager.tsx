"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AiModel, TeamAiConfig } from "@prisma/client";
import { toast } from "sonner";
import {
    Bot,
    Sparkles,
    Key,
    Check,
    Zap,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Settings,
    Shield,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    ExternalLink,
    Cpu,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApiKeyModal } from "@/components/modals/api-key-modal";
import { submitCustomModelRequest } from "@/actions/ai/manage-models";
import { HuggingFaceBrowser } from "@/components/ai/HuggingFaceBrowser";
import { Switch } from "@/components/ui/switch";
import {
    OpenAIIcon,
    AnthropicIcon,
    AzureIcon,
    GoogleIcon,
    GrokIcon,
    DeepSeekIcon,
    PerplexityIcon,
    MistralIcon
} from "@/components/ai/ProviderIcons";

// ─── Types ───

interface ModelRequest {
    id: string;
    provider: string;
    modelId: string;
    displayName: string;
    baseUrl: string | null;
    description: string | null;
    status: string;
    review_notes: string | null;
    createdAt: Date;
}

interface AiConfigManagerProps {
    teamId: string;
    currentConfig: TeamAiConfig | null;
    models: AiModel[];
    providersWithSystemKey: string[];
    // Phase 3: BYOK props (optional for backward compat)
    userId?: string;
    teamName?: string;
    modelRequests?: ModelRequest[];
    providerOptions?: { slug: string; name: string }[];
}

// ─── Provider metadata for beautiful cards ───

const PROVIDER_META: Record<string, { name: string; color: string; gradient: string; icon: React.ReactNode; url: string }> = {
    OPENAI: {
        name: "OpenAI",
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-green-500/20",
        icon: <OpenAIIcon className="w-8 h-8" />,
        url: "https://platform.openai.com/api-keys",
    },
    ANTHROPIC: {
        name: "Anthropic",
        color: "text-amber-400",
        gradient: "from-amber-500/20 to-orange-500/20",
        icon: <AnthropicIcon className="w-8 h-8" />,
        url: "https://console.anthropic.com/settings/keys",
    },
    AZURE: {
        name: "Azure OpenAI",
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/20",
        icon: <AzureIcon className="w-8 h-8" />,
        url: "https://portal.azure.com/",
    },
    GOOGLE: {
        name: "Google AI",
        color: "text-violet-400",
        gradient: "from-violet-500/20 to-purple-500/20",
        icon: <GoogleIcon className="w-7 h-7" />,
        url: "https://aistudio.google.com/apikey",
    },
    GROK: {
        name: "xAI Grok",
        color: "text-pink-400",
        gradient: "from-pink-500/20 to-rose-500/20",
        icon: <GrokIcon className="w-6 h-6" />,
        url: "https://console.x.ai/",
    },
    DEEPSEEK: {
        name: "DeepSeek",
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-cyan-500/20",
        icon: <DeepSeekIcon className="w-8 h-8" />,
        url: "https://platform.deepseek.com/",
    },
    PERPLEXITY: {
        name: "Perplexity",
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-blue-500/20",
        icon: <PerplexityIcon className="w-8 h-8" />,
        url: "https://docs.perplexity.ai/",
    },
    MISTRAL: {
        name: "Mistral AI",
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-red-500/20",
        icon: <MistralIcon className="w-8 h-8" />,
        url: "https://console.mistral.ai/api-keys",
    },
};

// Fallback metadata for custom/unknown providers
const getProviderMeta = (provider: string) => {
    if (PROVIDER_META[provider]) return PROVIDER_META[provider];
    return {
        name: provider.charAt(0) + provider.slice(1).toLowerCase(),
        color: "text-gray-400",
        gradient: "from-gray-500/20 to-slate-500/20",
        icon: <Bot className="w-7 h-7" />,
        url: "",
    };
};

// ─── Status badge helper ───

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    PENDING: {
        label: "Pending Review",
        icon: <Clock className="w-3 h-3" />,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    APPROVED: {
        label: "Approved",
        icon: <CheckCircle2 className="w-3 h-3" />,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    REJECTED: {
        label: "Rejected",
        icon: <XCircle className="w-3 h-3" />,
        className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
};

// ─── Component ───

export const AiConfigManager = ({
    teamId,
    currentConfig,
    models,
    providersWithSystemKey,
    userId,
    teamName,
    modelRequests = [],
    providerOptions = [],
}: AiConfigManagerProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProvider, setModalProvider] = useState<string | null>(null);

    // BYOK Request Modal State
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedModelId, setSelectedModelId] = useState<string | null>(
        currentConfig?.modelId || null
    );

    // Form inputs for pre-filling
    const [requestFormData, setRequestFormData] = useState({
        displayName: "",
        modelId: "",
        provider: "",
        description: ""
    });

    // Group models by provider
    const modelsByProvider = useMemo(() => {
        const grouped: Record<string, AiModel[]> = {};
        models.forEach((model) => {
            if (!grouped[model.provider]) {
                grouped[model.provider] = [];
            }
            grouped[model.provider]!.push(model);
        });
        return grouped;
    }, [models]);

    // Form State
    const [selectedProvider, setSelectedProvider] = useState<string>(
        currentConfig?.provider || "OPENAI"
    );
    const [useSystemKey, setUseSystemKey] = useState(
        currentConfig?.useSystemKey ?? true
    );
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(
        currentConfig?.apiKey ? { [currentConfig.provider]: currentConfig.apiKey } : {}
    );

    // Check if key is masked
    const isKeyMasked = (key?: string) => key === "********";

    // UI State
    const [expandedProviders, setExpandedProviders] = useState<string[]>([
        selectedProvider,
    ]);

    const toggleProvider = (provider: string) => {
        setExpandedProviders((prev) =>
            prev.includes(provider)
                ? prev.filter((p) => p !== provider)
                : [...prev, provider]
        );
    };

    const handleSelectModel = (model: AiModel) => {
        setSelectedModelId(model.modelId);
        setSelectedProvider(model.provider);
        if (model.provider !== selectedProvider) {
            const hasSysKey = providersWithSystemKey.includes(model.provider);
            setUseSystemKey(hasSysKey);
        }
    };

    const openKeyModal = (provider: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalProvider(provider);
        setModalOpen(true);
    };

    const handleKeySave = (key: string) => {
        if (modalProvider) {
            setApiKeys(prev => ({ ...prev, [modalProvider]: key }));
            setUseSystemKey(false);
            setSelectedProvider(modalProvider);
            const meta = getProviderMeta(modalProvider);
            toast.success(`API Key for ${meta.name} updated`);
        }
    };

    const hasCustomKey = (provider: string) => {
        const key = apiKeys[provider];
        return !!key && key.length > 0;
    };

    const handleSave = async () => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/ai-config`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: selectedProvider,
                        modelId: selectedModelId,
                        useSystemKey,
                        apiKey: useSystemKey ? null : apiKeys[selectedProvider],
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to save");
                }

                toast.success("AI Settings saved successfully!");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to save settings");
            }
        });
    };

    const handleHfSelect = (hfModel: any) => {
        setRequestFormData({
            displayName: `${hfModel.name} (HF)`,
            modelId: hfModel.id,
            provider: "HUGGINGFACE",
            description: `HuggingFace model by ${hfModel.author}. Downloads: ${hfModel.downloads}`
        });
        setRequestModalOpen(true);
    };

    const handleSubmitModelRequest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            formData.append("team_id", teamId);
            if (userId) formData.append("requested_by", userId);
            if (teamName) formData.append("team_name", teamName);

            await submitCustomModelRequest(formData);
            toast.success("Model request submitted for review!");
            setRequestModalOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error?.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasSystemKey = (provider: string) =>
        providersWithSystemKey.includes(provider);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Current Selection Summary */}
            {selectedModelId && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 backdrop-blur-md shadow-sm">
                    <div className="p-3 rounded-full bg-primary/20 text-primary animate-pulse-glow">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Configuration</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {models.find((m) => m.modelId === selectedModelId)?.name || selectedModelId}
                            </p>
                            {useSystemKey ? (
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex gap-1">
                                    <Shield className="w-3 h-3" /> Managed
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 flex gap-1">
                                    <Key className="w-3 h-3" /> Custom Key
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Badge variant="secondary" className={cn("px-3 py-1 text-sm font-semibold", getProviderMeta(selectedProvider)?.color)}>
                        {getProviderMeta(selectedProvider)?.name}
                    </Badge>
                </div>
            )}

            {/* Provider Sections */}
            <div className="space-y-4">
                {Object.entries(modelsByProvider).map(([provider, providerModels]) => {
                    const providerKey = provider as string;
                    const meta = getProviderMeta(providerKey);
                    const isExpanded = expandedProviders.includes(providerKey);
                    const sysKeyAvailable = hasSystemKey(providerKey);
                    const activeModel = (providerModels as any[])?.find((m) => m.modelId === selectedModelId);
                    const isCurrentProvider = selectedProvider === providerKey;

                    if (!meta || !providerModels) return null;

                    return (
                        <Card key={provider} className={cn(
                            "group bg-card/40 backdrop-blur-md border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-primary/5",
                            isCurrentProvider && "border-primary/30 shadow-md shadow-primary/5",
                            isExpanded ? "ring-1 ring-white/5" : ""
                        )}>
                            <CardHeader
                                onClick={() => toggleProvider(providerKey)}
                                className={cn(
                                    "cursor-pointer transition-colors px-6 py-4",
                                    isExpanded && "bg-white/5 border-b border-white/5"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.gradient} ${meta.color} text-2xl shadow-inner`}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {meta.name}
                                                {activeModel && (
                                                    <Badge className="bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <span>{(providerModels as any[]).length} models</span>
                                                {sysKeyAvailable && (
                                                    <span className="flex items-center gap-1 text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                        <Shield className="w-3 h-3" /> Managed Key Available
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "gap-2 hover:bg-white/10",
                                                hasCustomKey(providerKey) ? "text-amber-400" : "text-muted-foreground"
                                            )}
                                            onClick={(e) => openKeyModal(providerKey, e)}
                                        >
                                            <Key className="w-4 h-4" />
                                            {hasCustomKey(providerKey) ? (isKeyMasked(apiKeys[providerKey]) ? "Key Configured" : "Key Set") : "Set Custom Key"}
                                        </Button>

                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="p-6">
                                    {/* Key Configuration Toggle */}
                                    {isCurrentProvider && (
                                        <div className="mb-6 p-4 rounded-xl bg-muted/20 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium flex items-center gap-2">
                                                    <Settings className="w-4 h-4 text-primary" />
                                                    Configuration Mode
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Choose how this provider authenticates requests.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                                <Label htmlFor="sys-key-toggle" className="text-xs text-muted-foreground mr-2 cursor-pointer">
                                                    {useSystemKey ? "Managed Key Active" : "Using Custom Key"}
                                                </Label>
                                                <Switch
                                                    id="sys-key-toggle"
                                                    checked={useSystemKey}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            if (sysKeyAvailable) setUseSystemKey(true);
                                                            else toast.error("No managed key available for this provider");
                                                        } else {
                                                            setUseSystemKey(false);
                                                            if (!hasCustomKey(providerKey)) {
                                                                setModalProvider(providerKey);
                                                                setModalOpen(true);
                                                            }
                                                        }
                                                    }}
                                                    disabled={!sysKeyAvailable && useSystemKey}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Models Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(providerModels as any[]).map((model) => {
                                            const isSelected = selectedModelId === model.modelId;

                                            return (
                                                <div
                                                    key={model.id}
                                                    onClick={() => handleSelectModel(model)}
                                                    className={cn(
                                                        "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer group/card",
                                                        isSelected
                                                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] ring-1 ring-primary/30"
                                                            : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 animate-in zoom-in duration-200">
                                                            <div className="p-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${meta.gradient} ${meta.color} group-hover/card:scale-110 transition-transform`}>
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-sm truncate">{model.name}</h4>
                                                                <code className="text-[10px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
                                                                    {model.modelId}
                                                                </code>
                                                            </div>
                                                        </div>

                                                        {model.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {model.description}
                                                            </p>
                                                        )}

                                                        {/* Pricing (User Facing - Includes Markup) */}
                                                        <div className="flex items-center gap-3 pt-3 mt-1 border-t border-white/5">
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <DollarSign className="w-3 h-3 text-emerald-400" />
                                                                <span>In: ${((model.inputPrice || 0) * (1 + (model.defaultMarkup || 20) / 100)).toFixed(4)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Zap className="w-3 h-3 text-amber-400" />
                                                                <span>Out: ${((model.outputPrice || 0) * (1 + (model.defaultMarkup || 20) / 100)).toFixed(4)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {Object.keys(modelsByProvider).length === 0 && (
                <div className="text-center py-16 text-muted-foreground glass rounded-xl border border-white/5">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No AI models are currently available.</p>
                    <p className="text-sm mt-1 text-muted-foreground/60">Contact your platform administrator to enable models.</p>
                </div>
            )}

            {/* ─── BYOK: Request Custom Model Section ─── */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-background px-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Plus className="w-3 h-3" />
                        Bring Your Own Model
                    </span>
                </div>
            </div>

            <Card className="bg-card/40 backdrop-blur-md border border-white/5 overflow-hidden">
                <CardHeader className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400 shadow-inner">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Custom Model Request</CardTitle>
                                <CardDescription>
                                    Need a model not listed above? Submit a request to your platform admin.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HuggingFaceBrowser onSelect={handleHfSelect} />
                            <Button
                                onClick={() => {
                                    setRequestFormData({
                                        displayName: "",
                                        modelId: "",
                                        provider: "",
                                        description: ""
                                    });
                                    setRequestModalOpen(true);
                                }}
                                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20 transition-all duration-300"
                            >
                                <Plus className="w-4 h-4" />
                                Request Model
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Existing Requests */}
                {modelRequests.length > 0 && (
                    <CardContent className="px-6 pb-5 pt-0">
                        <p className="text-xs text-muted-foreground font-medium mb-3">Your Requests</p>
                        <div className="space-y-2">
                            {modelRequests.map(request => {
                                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-white/5"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-foreground">{request.displayName}</span>
                                                <code className="text-[10px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">{request.modelId}</code>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-muted-foreground">{request.provider}</span>
                                                {request.review_notes && (
                                                    <span className="text-[10px] text-muted-foreground italic">· {request.review_notes}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </span>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 px-2 gap-0.5", statusConfig.className)}>
                                                {statusConfig.icon}
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-6 pt-4">
                <div className="p-2 rounded-xl glass border border-white/10 shadow-2xl">
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !selectedModelId}
                        size="lg"
                        className="min-w-[180px] shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all font-semibold"
                    >
                        {isPending ? (
                            "Saving Configuration..."
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* ─── API Key Modal ─── */}
            <ApiKeyModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleKeySave}
                providerName={modalProvider ? getProviderMeta(modalProvider).name : ""}
                providerUrl={modalProvider ? getProviderMeta(modalProvider).url : undefined}
                initialKey={modalProvider && !isKeyMasked(apiKeys[modalProvider]) ? apiKeys[modalProvider] : ""}
                isMasked={modalProvider ? isKeyMasked(apiKeys[modalProvider]) : false}
            />

            {/* ─── Custom Model Request Modal ─── */}
            <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                                <Cpu className="w-5 h-5" />
                            </div>
                            Request Custom Model
                        </DialogTitle>
                        <DialogDescription>
                            Submit a request to add a new model. Your platform admin will review and approve it.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitModelRequest} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Name *</Label>
                                <Input
                                    name="displayName"
                                    placeholder="e.g. Llama 3.3 70B"
                                    required
                                    value={requestFormData.displayName}
                                    onChange={(e) => setRequestFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Model ID *</Label>
                                <Input
                                    name="modelId"
                                    placeholder="e.g. llama-3.3-70b"
                                    required
                                    className="font-mono text-sm"
                                    value={requestFormData.modelId}
                                    onChange={(e) => setRequestFormData(prev => ({ ...prev, modelId: e.target.value }))}
                                />
                                <p className="text-[10px] text-muted-foreground">Exact model identifier from the provider</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Provider *</Label>
                            {providerOptions.length > 0 ? (
                                <Select
                                    name="provider"
                                    required
                                    value={requestFormData.provider}
                                    onValueChange={(val) => setRequestFormData(prev => ({ ...prev, provider: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providerOptions.map(p => (
                                            <SelectItem key={p.slug} value={p.slug}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="OTHER">Other (specify in description)</SelectItem>
                                        <SelectItem value="HUGGINGFACE">Hugging Face</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    name="provider"
                                    placeholder="e.g. GROQ"
                                    required
                                    className="font-mono uppercase"
                                    value={requestFormData.provider}
                                    onChange={(e) => setRequestFormData(prev => ({ ...prev, provider: e.target.value }))}
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Base URL <span className="text-muted-foreground">(if custom endpoint)</span></Label>
                            <Input name="baseUrl" placeholder="https://api.groq.com/openai/v1" className="font-mono text-sm" />
                        </div>

                        <div className="space-y-2">
                            <Label>Reason / Description</Label>
                            <Textarea
                                name="description"
                                placeholder="Why do you need this model? Any specific use case?"
                                rows={3}
                                className="resize-none"
                                value={requestFormData.description}
                                onChange={(e) => setRequestFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-xs text-blue-400/80">
                            <p>
                                <strong className="text-blue-400">Note:</strong> Once approved, this model will be available for your team.
                                You may need to provide your own API key depending on the provider.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setRequestModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                            >
                                {isSubmitting ? (
                                    "Submitting..."
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        Submit Request
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
