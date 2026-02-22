"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Check, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purchaseLeadGenCredits } from "@/actions/ai/purchase-credits";
import { cn } from "@/lib/utils";

// Correcting Dialog import
import {
    Dialog as ShcnDialog,
    DialogContent as ShcnDialogContent,
    DialogDescription as ShcnDialogDescription,
    DialogHeader as ShcnDialogHeader,
    DialogTitle as ShcnDialogTitle,
    DialogFooter as ShcnDialogFooter,
} from "@/components/ui/dialog";

const PACKAGES = [
    {
        id: "starter",
        name: "Starter Pack",
        credits: 1000,
        price: 10,
        popular: false,
        description: "Perfect for small outreach campaigns."
    },
    {
        id: "pro",
        name: "Growth Pack",
        credits: 5000,
        price: 45,
        popular: true,
        description: "Best for scaling your lead generation."
    },
    {
        id: "enterprise",
        name: "Scale Pack",
        credits: 10000,
        price: 80,
        popular: false,
        description: "Maximum efficiency for large teams."
    }
];

interface LeadGenPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeadGenPurchaseModal({ isOpen, onClose }: LeadGenPurchaseModalProps) {
    const [selectedId, setSelectedId] = useState("pro");
    const [loading, setLoading] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const res = await purchaseLeadGenCredits(selectedId);
            if (res.success && res.url) {
                toast.success(`Payment link generated! Opening Surge secure checkout...`);
                window.open(res.url, '_blank');
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || "Purchase failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ShcnDialog open={isOpen} onOpenChange={onClose}>
            <ShcnDialogContent className="sm:max-w-2xl bg-[#09090b] border-[#27272a] p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

                <ShcnDialogHeader className="p-8 pb-4">
                    <ShcnDialogTitle className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Zap className="w-6 h-6 fill-amber-500/20" />
                        </div>
                        Universal Top-Up
                    </ShcnDialogTitle>
                    <ShcnDialogDescription className="text-lg text-muted-foreground pt-2">
                        Secure more Intelligence Credits for your LeadGen Wizard.
                    </ShcnDialogDescription>
                </ShcnDialogHeader>

                <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            onClick={() => setSelectedId(pkg.id)}
                            className={cn(
                                "relative group cursor-pointer rounded-2xl border p-5 transition-all duration-300",
                                selectedId === pkg.id
                                    ? "bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                                    : "bg-white/5 border-white/5 hover:border-white/10"
                            )}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-[10px] font-black text-black tracking-tighter uppercase">
                                    Best Value
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-white mb-1">{pkg.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-amber-500">{pkg.credits.toLocaleString()}</span>
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Credits</span>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground line-clamp-2 h-10">
                                    {pkg.description}
                                </div>

                                <div className="pt-2">
                                    <div className="text-2xl font-bold text-white">
                                        ${pkg.price}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">USD</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "w-full h-10 rounded-xl flex items-center justify-center transition-all",
                                    selectedId === pkg.id
                                        ? "bg-amber-500 text-black font-black"
                                        : "bg-white/5 text-muted-foreground group-hover:bg-white/10"
                                )}>
                                    {selectedId === pkg.id ? <Check className="w-5 h-5" /> : "Select"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-8 py-4 bg-white/5 border-t border-white/5 mt-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Secure payment processed via Surge Platform.
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Credits are added instantly to your team balance.
                        </div>
                    </div>
                </div>

                <ShcnDialogFooter className="p-8 pt-4">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-6 font-bold hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={loading}
                        className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg rounded-xl shadow-xl shadow-amber-500/10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay $${PACKAGES.find(p => p.id === selectedId)?.price} Now`
                        )}
                    </Button>
                </ShcnDialogFooter>
            </ShcnDialogContent>
        </ShcnDialog>
    );
}
