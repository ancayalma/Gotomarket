
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, CheckCircle2 } from "lucide-react";
import { generateSurgeLink } from "@/actions/invoice/generate-surge-link";
import { PaymentModal } from "./PaymentModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
    invoiceId: string;
    paymentLink?: string | null;
    paymentStatus?: string | null;
    amount?: string | null;
    currency?: string | null;
}

export const SurgeButton = ({ invoiceId, paymentLink, paymentStatus, amount, currency }: Props) => {
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeLink, setActiveLink] = useState<string | null>(paymentLink || null);

    // Sync activeLink if props change (e.g. from server revalidation)
    if (paymentLink && paymentLink !== activeLink) {
        setActiveLink(paymentLink);
    }

    if (paymentStatus === "PAID") {
        return (
            <div className="flex items-center gap-2 text-green-500 font-medium p-2 border border-green-500/20 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Paid via Crypto
            </div>
        );
    }

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateSurgeLink(invoiceId);
            if (result.success && result.url) {
                setActiveLink(result.url);
                setModalOpen(true);
                toast.success("Payment session initialized");
            } else {
                toast.error(result.error || "Failed to generate link.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={() => activeLink ? setModalOpen(true) : handleGenerate()}
                disabled={loading}
                variant="default"
                className={cn(
                    "font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-lg",
                    activeLink
                        ? "bg-[#0052FF] hover:bg-[#0052FF]/90 text-white shadow-blue-600/20"
                        : "bg-blue-600/10 border border-blue-500/50 text-blue-400 hover:bg-blue-600/20 shadow-none"
                )}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                    <Coins className="w-5 h-5 mr-2" />
                )}
                {activeLink ? `Pay ${amount} ${currency || "USDC"}` : "Pay Invoice (Surge/Crypto)"}
            </Button>

            {activeLink && (
                <PaymentModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    url={activeLink}
                    amount={amount || "0"}
                    currency={currency || "USDC"}
                    invoiceId={invoiceId}
                />
            )}
        </>
    );
};
