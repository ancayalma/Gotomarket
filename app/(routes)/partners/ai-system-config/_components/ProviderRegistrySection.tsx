"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateAiProvider } from "@/actions/ai/manage-models";
import { toast } from "sonner";
import {
    Globe,
    Key,
    ExternalLink,
    Cpu,
    ToggleLeft,
    ChevronDown,
    ChevronRight,
    Wrench,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
    id: string;
    slug: string;
    name: string;
    sdkType: string;
    baseUrl: string | null;
    apiKeyUrl: string | null;
    color: string | null;
    gradient: string | null;
    description: string | null;
    isBuiltIn: boolean;
    isActive: boolean;
    createdAt: Date;
}

interface Model {
    id: string;
    name: string;
    modelId: string;
    provider: string;
    isActive: boolean;
}

interface ProviderRegistryProps {
    providers: Provider[];
    models: Model[];
}

const SDK_TYPE_LABELS: Record<string, { label: string; badge: string }> = {
    OPENAI_COMPATIBLE: { label: "OpenAI Compatible", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    ANTHROPIC: { label: "Anthropic SDK", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    GOOGLE: { label: "Google SDK", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    AZURE: { label: "Azure SDK", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    MISTRAL: { label: "Mistral SDK", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    CUSTOM: { label: "Custom", badge: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

export const ProviderRegistrySection = ({ providers, models }: ProviderRegistryProps) => {
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const getModelCount = (slug: string) => models.filter(m => m.provider === slug).length;
    const getActiveModelCount = (slug: string) => models.filter(m => m.provider === slug && m.isActive).length;

    const handleToggleActive = (provider: Provider) => {
        const formData = new FormData();
        formData.append("id", provider.id);
        formData.append("name", provider.name);
        formData.append("sdkType", provider.sdkType);
        if (provider.baseUrl) formData.append("baseUrl", provider.baseUrl);
        if (provider.apiKeyUrl) formData.append("apiKeyUrl", provider.apiKeyUrl);
        if (!provider.isActive) formData.append("isActive", "on");

        startTransition(async () => {
            try {
                await updateAiProvider(formData);
                toast.success(`${provider.name} ${provider.isActive ? "disabled" : "enabled"}`);
            } catch {
                toast.error("Failed to update provider");
            }
        });
    };

    return (
        <div className="space-y-3">
            {providers.map((provider) => {
                const sdkMeta = SDK_TYPE_LABELS[provider.sdkType] || SDK_TYPE_LABELS.CUSTOM;
                const modelCount = getModelCount(provider.slug);
                const activeModelCount = getActiveModelCount(provider.slug);
                const isExpanded = expandedProvider === provider.id;
                const providerModels = models.filter(m => m.provider === provider.slug);

                return (
                    <div
                        key={provider.id}
                        className={cn(
                            "group rounded-xl border transition-all duration-300",
                            provider.isActive
                                ? "border-border/50 bg-card/80 hover:border-border"
                                : "border-border/20 bg-card/30 opacity-60 hover:opacity-80"
                        )}
                    >
                        {/* Provider Header */}
                        <div
                            className="flex items-center gap-4 p-4 cursor-pointer"
                            onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                        >
                            {/* Color dot */}
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0",
                                provider.gradient || "from-gray-500/20 to-slate-500/20"
                            )}>
                                <Cpu className={cn("w-5 h-5", provider.color || "text-gray-400")} />
                            </div>

                            {/* Provider info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-foreground">{provider.name}</h3>
                                    {provider.isBuiltIn && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-muted-foreground/20 text-muted-foreground">
                                            Built-in
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", sdkMeta.badge)}>
                                        {sdkMeta.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-muted-foreground font-mono">{provider.slug}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {activeModelCount}/{modelCount} models active
                                    </span>
                                    {provider.baseUrl && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {new URL(provider.baseUrl).hostname}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 shrink-0">
                                {provider.apiKeyUrl && (
                                    <a
                                        href={provider.apiKeyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        <Key className="w-3 h-3" />
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={provider.isActive}
                                        onCheckedChange={() => handleToggleActive(provider)}
                                        disabled={isPending}
                                    />
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-3">
                                {/* Provider Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-muted/20 rounded-lg p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">SDK Type</p>
                                        <p className="text-xs font-medium">{sdkMeta.label}</p>
                                    </div>
                                    <div className="bg-muted/20 rounded-lg p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Base URL</p>
                                        <p className="text-xs font-mono truncate">{provider.baseUrl || "Default"}</p>
                                    </div>
                                    <div className="bg-muted/20 rounded-lg p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Models</p>
                                        <p className="text-xs font-medium">{modelCount} total, {activeModelCount} active</p>
                                    </div>
                                    <div className="bg-muted/20 rounded-lg p-3">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Source</p>
                                        <p className="text-xs font-medium">{provider.isBuiltIn ? "Built-in" : "Custom"}</p>
                                    </div>
                                </div>

                                {/* Models List */}
                                {providerModels.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">Registered Models</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {providerModels.map(model => (
                                                <div
                                                    key={model.id}
                                                    className={cn(
                                                        "flex items-center gap-2 py-1.5 px-3 rounded-md text-xs",
                                                        model.isActive
                                                            ? "bg-muted/30 text-foreground"
                                                            : "bg-muted/10 text-muted-foreground line-through"
                                                    )}
                                                >
                                                    <Check className={cn("w-3 h-3 shrink-0", model.isActive ? "text-emerald-400" : "text-muted-foreground/30")} />
                                                    <span className="font-medium">{model.name}</span>
                                                    <span className="font-mono text-muted-foreground ml-auto">{model.modelId}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {providerModels.length === 0 && (
                                    <div className="text-center py-4 text-xs text-muted-foreground bg-muted/10 rounded-lg">
                                        <Wrench className="w-4 h-4 mx-auto mb-1" />
                                        No models registered. Add one from the Model Registry below.
                                    </div>
                                )}

                                {provider.description && (
                                    <p className="text-xs text-muted-foreground italic">{provider.description}</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
