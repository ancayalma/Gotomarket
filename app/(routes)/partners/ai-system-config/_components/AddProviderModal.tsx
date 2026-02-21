"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAiProvider } from "@/actions/ai/manage-models";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";

interface AddProviderModalProps {
    userId?: string;
}

const SDK_TYPES = [
    { value: "OPENAI_COMPATIBLE", label: "OpenAI Compatible", description: "Most providers (Groq, Together, HuggingFace, etc.)" },
    { value: "ANTHROPIC", label: "Anthropic", description: "Claude models" },
    { value: "GOOGLE", label: "Google", description: "Gemini / Vertex AI" },
    { value: "AZURE", label: "Azure OpenAI", description: "Azure-hosted OpenAI deployments" },
    { value: "MISTRAL", label: "Mistral", description: "Mistral AI models" },
    { value: "CUSTOM", label: "Custom", description: "Custom OpenAI-compatible endpoint" },
];

const COLOR_PRESETS = [
    { value: "text-emerald-400", label: "Emerald", gradient: "from-emerald-500/20 to-green-500/20" },
    { value: "text-blue-400", label: "Blue", gradient: "from-blue-500/20 to-cyan-500/20" },
    { value: "text-purple-400", label: "Purple", gradient: "from-purple-500/20 to-violet-500/20" },
    { value: "text-orange-400", label: "Orange", gradient: "from-orange-500/20 to-amber-500/20" },
    { value: "text-rose-400", label: "Rose", gradient: "from-rose-500/20 to-pink-500/20" },
    { value: "text-cyan-400", label: "Cyan", gradient: "from-cyan-500/20 to-teal-500/20" },
    { value: "text-yellow-400", label: "Yellow", gradient: "from-yellow-500/20 to-orange-500/20" },
    { value: "text-indigo-400", label: "Indigo", gradient: "from-indigo-500/20 to-violet-500/20" },
];

export const AddProviderModal = ({ userId }: AddProviderModalProps) => {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append("color", selectedColor.value);
        formData.append("gradient", selectedColor.gradient);
        if (userId) formData.append("createdBy", userId);

        startTransition(async () => {
            try {
                await createAiProvider(formData);
                toast.success("Provider added successfully!");
                setOpen(false);
            } catch (error: any) {
                toast.error(error?.message || "Failed to add provider");
            }
        });
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Provider
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Add New AI Provider
                        </DialogTitle>
                        <DialogDescription>
                            Register a new AI provider. Most LLM providers are OpenAI-compatible.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Provider Name *</Label>
                                <Input name="name" placeholder="e.g. Groq" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Provider Slug *</Label>
                                <Input name="slug" placeholder="e.g. GROQ" required className="uppercase font-mono" />
                                <p className="text-[10px] text-muted-foreground">Uppercase, no spaces</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>SDK Type *</Label>
                            <Select name="sdkType" defaultValue="OPENAI_COMPATIBLE">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SDK_TYPES.map(sdk => (
                                        <SelectItem key={sdk.value} value={sdk.value}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{sdk.label}</span>
                                                <span className="text-xs text-muted-foreground">{sdk.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Base URL</Label>
                            <Input name="baseUrl" placeholder="https://api.example.com/v1" />
                            <p className="text-[10px] text-muted-foreground">Required for OpenAI-compatible providers</p>
                        </div>

                        <div className="space-y-2">
                            <Label>API Key Documentation URL</Label>
                            <Input name="apiKeyUrl" placeholder="https://example.com/api-keys" />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input name="description" placeholder="Brief description of this provider" />
                        </div>

                        <div className="space-y-2">
                            <Label>Theme Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${selectedColor.value === color.value
                                            ? "border-white scale-110 ring-2 ring-primary/50"
                                            : "border-transparent hover:border-white/30"
                                            }`}
                                    >
                                        <div className={`w-full h-full rounded-full bg-gradient-to-br ${color.gradient}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending ? "Adding..." : "Add Provider"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
