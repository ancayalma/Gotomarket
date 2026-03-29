"use client";

import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { BillingModal } from "@/components/modals/BillingModal";

export function UpgradeTag({
    planName = "Growth",
    className = ""
}: {
    planName?: string;
    className?: string;
}) {
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsBillingModalOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest mt-4 hover:bg-primary/20 transition-colors cursor-pointer ${className}`}
            >
                <Lock className="w-3 h-3" /> {planName} or Above
            </button>
            <BillingModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
            />
        </>
    );
}
