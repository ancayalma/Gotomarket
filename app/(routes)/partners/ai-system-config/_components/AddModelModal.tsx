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
import { Textarea } from "@/components/ui/textarea";
import { createAiModel } from "@/actions/ai/manage-models";
import { toast } from "sonner";
import { Plus, Box } from "lucide-react";

interface AddModelModalProps {
    providers: { slug: string; name: string }[];
}

export const AddModelModal = ({ providers }: AddModelModalProps) => {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            try {
                await createAiModel(formData);
                toast.success("Model added successfully!");
                setOpen(false);
            } catch (error: any) {
                toast.error(error?.message || "Failed to add model");
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
                Add Model
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border/50">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                            <Box className="w-5 h-5 text-primary" />
                            Add New AI Model
                        </DialogTitle>
                        <DialogDescription>
                            Add a new model to the platform. It will be available to all teams.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Name *</Label>
                                <Input name="name" placeholder="e.g. GPT-4o Mini" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Model ID *</Label>
                                <Input name="modelId" placeholder="e.g. gpt-4o-mini" required className="font-mono text-sm" />
                                <p className="text-[10px] text-muted-foreground">Exact model identifier from the provider</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Provider *</Label>
                            <Select name="provider" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map(p => (
                                        <SelectItem key={p.slug} value={p.slug}>
                                            {p.name} ({p.slug})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea name="description" placeholder="Brief description of this model's capabilities" rows={2} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Input Price ($/1M tokens)</Label>
                                <Input name="inputPrice" type="number" step="0.001" placeholder="0.00" defaultValue="0" />
                            </div>
                            <div className="space-y-2">
                                <Label>Output Price ($/1M tokens)</Label>
                                <Input name="outputPrice" type="number" step="0.001" placeholder="0.00" defaultValue="0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Context (tokens)</Label>
                                <Input name="maxContext" type="number" placeholder="128000" defaultValue="128000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Markup (%)</Label>
                                <Input name="defaultMarkup" type="number" step="0.1" placeholder="20" defaultValue="20" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending ? "Adding..." : "Add Model"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
