
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runCronJob } from "@/actions/cron/get-invoice-from-mail";

// Duplicate of the CardContent style to ensure consistency
const CardContent = ({ card, loading = false }: { card: any, loading?: boolean }) => (
    <div className="group relative w-full p-3 overflow-hidden transition-colors duration-300 bg-background border border-border hover:border-primary/50 rounded-2xl h-[110px] cursor-pointer">
        {/* Giant Watermark Icon - Positioned Right */}
        <Loader2
            className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-[color,background-color,border-color,transform] duration-700 pointer-events-none opacity-10 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-0 group-hover:text-primary ${card.iconColor} ${loading ? "animate-spin" : ""}`}
        />

        <div className="relative z-10 w-full h-full flex flex-col items-start pl-1 justify-center">
            <h3 className="font-black text-[11px] uppercase tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent py-0.5 px-2 leading-tight mb-0.5">
                {card.title}
            </h3>
            <span className="block text-xl font-bold tracking-tight text-foreground mt-0.5 px-2">
                {card.description}
            </span>
        </div>

        {/* Subtle Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
);

type SyncInvoiceCardProps = {
    card: any;
};

export const SyncInvoiceCard = ({ card }: SyncInvoiceCardProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const runCron = async () => {
        try {
            setIsLoading(true);
            const response = await runCronJob();
            // Also invoke our invoice refetch logic locally (for recent documents not picked up)
            try {
                await fetch("/api/invoice/refetch", { method: "POST" });
                toast.success("Sync & Processing triggered.");
            } catch (e) { console.warn("Refetch trigger failed", e); }

            toast.success(response.message);
        } catch (error) {
            console.log(error);
            toast.error("Failed to sync invoices");
        } finally {
            setIsLoading(false);
            router.refresh();
        }
    };

    return (
        <div onClick={runCron} className="h-full">
            <CardContent card={card} loading={isLoading} />
        </div>
    );
};
