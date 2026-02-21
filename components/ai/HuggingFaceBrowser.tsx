"use client";

import { useState, useTransition, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createAiModel } from "@/actions/ai/manage-models";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Search,
    Download,
    Heart,
    ArrowRight,
    Loader2,
    ExternalLink,
    Sparkles,
    Box,
    TrendingUp,
} from "lucide-react";

interface HfModel {
    id: string;
    author: string;
    name: string;
    downloads: number;
    likes: number;
    tags: string[];
    pipeline_tag: string;
    lastModified: string;
    private: boolean;
}

interface HuggingFaceBrowserProps {
    onModelAdded?: () => void;
    onSelect?: (model: HfModel) => void;
}

export const HuggingFaceBrowser = ({ onModelAdded, onSelect }: HuggingFaceBrowserProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [models, setModels] = useState<HfModel[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedModel, setSelectedModel] = useState<HfModel | null>(null);
    const [isPending, startTransition] = useTransition();
    const [hasSearched, setHasSearched] = useState(false);

    const searchModels = useCallback(async (searchQuery?: string) => {
        setIsSearching(true);
        setHasSearched(true);
        try {
            const q = searchQuery ?? query;
            const res = await fetch(`/api/ai/huggingface/models?search=${encodeURIComponent(q)}&limit=24`);
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            setModels(data);
        } catch {
            toast.error("Failed to search HuggingFace models");
        } finally {
            setIsSearching(false);
        }
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        searchModels();
    };

    const handleAddModel = (model: HfModel) => {
        if (onSelect) {
            onSelect(model);
            setOpen(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", `${model.name} (HF)`);
        formData.append("modelId", model.id);
        formData.append("provider", "HUGGINGFACE");
        formData.append("description", `${model.author}/${model.name} — ${formatNumber(model.downloads)} downloads`);
        formData.append("inputPrice", "0");
        formData.append("outputPrice", "0");
        formData.append("maxContext", "4096");
        formData.append("defaultMarkup", "20");

        startTransition(async () => {
            try {
                await createAiModel(formData);
                toast.success(`${model.name} added to Model Registry!`);
                setSelectedModel(null);
                onModelAdded?.();
            } catch (error: any) {
                toast.error(error?.message || "Failed to add model");
            }
        });
    };

    const formatNumber = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toString();
    };

    const handleOpen = () => {
        setOpen(true);
        if (!hasSearched) {
            searchModels(""); // Load trending models on first open
        }
    };

    return (
        <>
            <Button
                onClick={handleOpen}
                variant="outline"
                className="gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all duration-300"
            >
                <img
                    src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
                    alt="Hugging Face"
                    className="w-5 h-5 flex-shrink-0"
                />
                Browse HuggingFace
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] bg-card border-border/50 flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <img
                                src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
                                alt="Hugging Face"
                                className="w-6 h-6 flex-shrink-0"
                            />
                            HuggingFace Model Hub
                        </DialogTitle>
                        <DialogDescription>
                            Search and add text-generation models from the HuggingFace Hub.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search Bar */}
                    <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search models... (e.g. llama, mistral, phi)"
                                className="pl-10 bg-muted/20 border-border/30"
                            />
                        </div>
                        <Button type="submit" disabled={isSearching} className="gap-2 shrink-0">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </Button>
                    </form>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
                        {isSearching && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Searching HuggingFace Hub...</span>
                            </div>
                        )}

                        {!isSearching && hasSearched && models.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No models found. Try a different search term.</p>
                            </div>
                        )}

                        {!isSearching && models.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                {models.map(model => {
                                    const isSelected = selectedModel?.id === model.id;

                                    return (
                                        <div
                                            key={model.id}
                                            onClick={() => setSelectedModel(isSelected ? null : model)}
                                            className={cn(
                                                "group relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200",
                                                isSelected
                                                    ? "border-yellow-500/40 bg-yellow-500/5 ring-1 ring-yellow-500/20"
                                                    : "border-border/30 bg-muted/10 hover:border-border/60 hover:bg-muted/20"
                                            )}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-muted-foreground truncate">{model.author}</p>
                                                    <h4 className="font-semibold text-sm text-foreground truncate">{model.name}</h4>
                                                </div>
                                                {isSelected && (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 gap-1 text-[11px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddModel(model);
                                                        }}
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                                        Add
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Model ID */}
                                            <code className="text-[10px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded block truncate mb-2">
                                                {model.id}
                                            </code>

                                            {/* Stats + Tags */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                    <span className="flex items-center gap-0.5">
                                                        <Download className="w-3 h-3" />
                                                        {formatNumber(model.downloads)}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Heart className="w-3 h-3" />
                                                        {formatNumber(model.likes)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1 overflow-hidden">
                                                    {model.tags.slice(0, 3).map(tag => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className="text-[9px] h-4 px-1 border-border/20 text-muted-foreground/70 shrink-0"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!isSearching && !hasSearched && (
                            <div className="text-center py-12 text-muted-foreground">
                                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Search for models or browse trending text-generation models.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/20 shrink-0">
                        <a
                            href="https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                            Open HuggingFace Hub
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-[10px] text-muted-foreground">
                            {models.length > 0 ? `${models.length} results` : ""}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
