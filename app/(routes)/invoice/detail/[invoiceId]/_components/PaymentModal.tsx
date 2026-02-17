
"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, ArrowUpRight } from "lucide-react";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    amount: string | null;
    currency: string | null;
}

export const PaymentModal = ({ open, onOpenChange, url, amount, currency }: PaymentModalProps) => {
    const [loading, setLoading] = React.useState(true);

    // Auto-proxy legacy links to ensure they work in-modal
    const proxiedUrl = React.useMemo(() => {
        if (!url) return "";

        // Check if we should use the proxy (Gold Standard check)
        const useProxy = process.env.NEXT_PUBLIC_SURGE_USE_PROXY !== 'false';

        if (url.startsWith("/api/surge-portal")) return url;

        // Convert any external surge link to our internal proxy ONLY if enabled
        if (useProxy && url.includes("surge.basalthq.com")) {
            const matches = url.match(/\/(pay|portal|p|checkout|widget)\/([^?]+)/);
            if (matches && matches[2]) {
                const receiptId = matches[2];
                const params = url.split("?")[1] || "";
                return `/api/surge-portal/${receiptId}${params ? `?${params}` : ""}`;
            }
        }
        return url;
    }, [url]);

    // Safety timeout: If the portal is slow or onLoad is blocked, show anyway after 6s
    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                setLoading(false);
            }, 6000);
            return () => clearTimeout(timer);
        } else {
            setLoading(true);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] p-0 overflow-hidden bg-black border-zinc-800 flex flex-col shadow-2xl">
                <DialogHeader className="p-4 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white leading-tight uppercase tracking-tight">Secure Settlement Layer</DialogTitle>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                Paying {amount} {currency || "USDC"} via Basalt Surge
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative bg-[#0a0a0a] flex flex-col">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] z-50 transition-opacity duration-500">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <div className="text-center">
                                <p className="text-sm font-bold text-white uppercase tracking-[0.2em]">Securing Connection</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-tighter mt-1 font-mono">ENCRYPTING SETTLEMENT LAYER 0x402</p>
                            </div>
                        </div>
                    )}

                    {proxiedUrl && (
                        <iframe
                            src={proxiedUrl}
                            className="flex-1 w-full h-full border-none"
                            allow="payment; publickey-credentials-get; clipboard-write; camera"
                            onLoad={() => {
                                console.log("[PaymentModal] iFrame loaded, releasing UI");
                                setLoading(false);
                            }}
                        />
                    )}
                </div>

                <div className="p-3 border-t border-zinc-900 bg-zinc-950/80 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 opacity-40">
                            <ShieldCheck className="w-3 h-3 text-zinc-400" />
                            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">SAQ-A Compliant</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-40">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Powered by Basalt Surge</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${process.env.NEXT_PUBLIC_SURGE_USE_PROXY !== 'false' ? 'bg-blue-500' : 'bg-green-500'}`} />
                        <span className="text-[8px] uppercase tracking-[0.2em] font-black text-zinc-600">
                            {process.env.NEXT_PUBLIC_SURGE_USE_PROXY !== 'false' ? "Secure Handshake Active" : "Direct Settlement Active"}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
