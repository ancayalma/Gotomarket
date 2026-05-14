"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RevenueTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTarget: number;
    onUpdate: (newTarget: number) => Promise<void>;
}

export const RevenueTargetModal = ({
    isOpen,
    onClose,
    currentTarget,
    onUpdate
}: RevenueTargetModalProps) => {
    const [target, setTarget] = useState(currentTarget.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(target.replace(/,/g, ""));

        if (isNaN(value) || value <= 0) {
            toast.error("Please enter a valid target amount");
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(value);
            toast.success("Revenue target updated successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to update target");
        } finally {
            setIsSubmitting(false);
        }
    };

    const presets = [5000, 10000, 25000, 50000, 100000];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#09090b] border-white/10 text-white shadow-2xl backdrop-blur-3xl">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        Set Revenue Target
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400">
                        Define your monthly revenue goal to track pacing and performance.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="target" className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                            Target Amount (USD)
                        </Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-focus-within:text-emerald-400 group-focus-within:border-emerald-500/30 transition-all">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <Input
                                id="target"
                                type="text"
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="pl-12 h-14 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-lg font-bold transition-all rounded-xl"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 ml-1">
                            Quick Presets
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setTarget(preset.toString())}
                                    className="py-2.5 rounded-lg bg-white/5 border border-white/5 text-xs font-semibold hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all active:scale-95"
                                >
                                    ${preset.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 border-white/5 hover:bg-white/5 text-zinc-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            {isSubmitting ? "Updating..." : "Update Target"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
