"use client";

import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BillingModal } from "@/components/modals/BillingModal";

export function IntegrationLockedCard({
    title,
    planName = "Growth"
}: {
    title: string;
    planName?: string;
}) {
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col items-center justify-center p-8 text-center bg-card/40 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 relative z-10 shadow-lg border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-lg font-bold text-card-foreground mb-2 relative z-10">{title} Integrations</h4>
                <p className="text-xs text-muted-foreground mb-6 max-w-[250px] relative z-10">
                    Upgrade to the {planName} plan or higher to unlock this premium integration.
                </p>
                <Button 
                    onClick={() => setIsBillingModalOpen(true)}
                    className="relative z-10 bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary transition-colors border border-primary/20 w-full font-bold uppercase tracking-widest text-[10px]"
                >
                    <Zap className="w-3.5 h-3.5 mr-2" /> Upgrade to Unlock
                </Button>
            </div>
            <BillingModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
            />
        </>
    );
}
