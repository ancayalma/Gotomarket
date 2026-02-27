
"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck } from "lucide-react";
import { verifySurgePayment } from "@/actions/invoice/verify-payment";
import { toast } from "sonner";

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    amount: string | null;
    currency: string | null;
    /** The invoice ID — required so we can verify payment on gateway-card-success */
    invoiceId?: string;
}

export const PaymentModal = ({ open, onOpenChange, url, amount, currency, invoiceId }: PaymentModalProps) => {
    const [loading, setLoading] = React.useState(true);
    const [iframeHeight, setIframeHeight] = React.useState<number | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Auto-proxy legacy links to ensure they work in-modal
    const proxiedUrl = React.useMemo(() => {
        if (!url) {
            console.log("[PaymentModal] No URL provided");
            return "";
        }

        // SURGE_USE_PROXY=false → point directly at surge.basalthq.com
        const useProxy = process.env.NEXT_PUBLIC_SURGE_USE_PROXY !== 'false';

        if (url.startsWith("/api/surge-portal")) {
            console.log("[PaymentModal] Using internal proxy URL:", url);
            return url;
        }

        // Convert any external surge link to our internal proxy ONLY if enabled
        if (useProxy && url.includes("surge.basalthq.com")) {
            const matches = url.match(/\/(pay|portal|p|checkout|widget)\/([^?]+)/);
            if (matches && matches[2]) {
                const receiptId = matches[2];
                const params = url.split("?")[1] || "";
                const newUrl = `/api/surge-portal/${receiptId}${params ? `?${params}` : ""}`;
                console.log("[PaymentModal] Proxied external URL to:", newUrl);
                return newUrl;
            }
        }
        console.log("[PaymentModal] Using original URL:", url);
        return url;
    }, [url]);

    // Safety timeout: If the portal is slow or onLoad is blocked, show anyway after 6s
    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setLoading(false), 6000);
            return () => clearTimeout(timer);
        } else {
            setLoading(true);
            setIframeHeight(null);
        }
    }, [open]);

    // ── PostMessage bridge ──────────────────────────────────────────────────
    // Surge emits three events from the embedded portal iFrame:
    //   gateway-card-success  → payment completed
    //   gateway-card-cancel   → user cancelled
    //   gateway-preferred-height → responsive height hint
    React.useEffect(() => {
        if (open) {
            console.log("[PaymentModal] Modal opened for invoice:", invoiceId);
        }
        if (!open) return;

        const handleMessage = async (event: MessageEvent) => {
            // Only accept messages from surge.basalthq.com
            if (!event.origin.includes("surge.basalthq.com")) return;

            const { type, height } = (event.data ?? {}) as { type?: string; height?: number };

            switch (type) {
                case "gateway-card-success": {
                    console.log("[PaymentModal] gateway-card-success received");
                    onOpenChange(false);
                    if (invoiceId) {
                        try {
                            const result = await verifySurgePayment(invoiceId);
                            if (result.success) {
                                toast.success("Payment verified! Thank you.");
                            } else {
                                toast.warning(result.message || "Payment received — verification pending.");
                            }
                        } catch {
                            toast.warning("Payment received. Verification will update shortly.");
                        }
                    } else {
                        toast.success("Payment completed!");
                    }
                    break;
                }

                case "gateway-card-cancel": {
                    console.log("[PaymentModal] gateway-card-cancel received");
                    onOpenChange(false);
                    toast.info("Payment cancelled.");
                    break;
                }

                case "gateway-preferred-height": {
                    if (typeof height === "number" && height > 0) {
                        console.log(`[PaymentModal] gateway-preferred-height: ${height}px`);
                        setIframeHeight(height);
                    }
                    break;
                }

                default:
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [open, invoiceId, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] p-0 overflow-hidden bg-black border-zinc-800 flex flex-col shadow-2xl">
                <DialogHeader className="p-4 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Secure Settlement Layer</DialogTitle>
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
                            ref={iframeRef}
                            src={proxiedUrl}
                            className="flex-1 w-full border-none transition-[height] duration-300"
                            style={{ height: iframeHeight ? `${iframeHeight}px` : "100%" }}
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
