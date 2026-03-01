
"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    CreditCard,
    ShieldCheck,
    Sparkles,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { saveSubscription } from "@/actions/billing/save-subscription";
import { PaymentModal } from "@/app/(routes)/invoice/detail/[invoiceId]/_components/PaymentModal";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { getMyTeamSubscription } from "@/actions/billing/get-my-subscription";

const PLANS_CONFIG = [
    {
        name: SUBSCRIPTION_PLANS.INDIVIDUAL_BASIC.name,
        slug: SUBSCRIPTION_PLANS.INDIVIDUAL_BASIC.slug,
        monthly: SUBSCRIPTION_PLANS.INDIVIDUAL_BASIC.price,
        annual: SUBSCRIPTION_PLANS.INDIVIDUAL_BASIC.price * 12 * 0.8,
        features: [
            "1,000 LeadGen Credits",
            "15,000 Emails / mo",
            "Standard AI Enrichment",
            "2 User Licenses"
        ]
    },
    {
        name: SUBSCRIPTION_PLANS.INDIVIDUAL_PRO.name,
        slug: SUBSCRIPTION_PLANS.INDIVIDUAL_PRO.slug,
        monthly: SUBSCRIPTION_PLANS.INDIVIDUAL_PRO.price,
        annual: SUBSCRIPTION_PLANS.INDIVIDUAL_PRO.price * 12 * 0.8,
        features: [
            "5,000 LeadGen Credits",
            "50,000 Emails / mo",
            "Full Agentic Research",
            "VoiceHub AI Calling",
            "4 User Licenses"
        ],
        popular: true
    },
    {
        name: SUBSCRIPTION_PLANS.ENTERPRISE.name,
        slug: SUBSCRIPTION_PLANS.ENTERPRISE.slug,
        monthly: 0,
        annual: 0,
        features: [
            "Unlimited Leads",
            "Custom Engineering",
            "White-label Options",
            "Dedicated Support"
        ],
        isContactSales: true
    }
];

const HIERARCHY = ["FREE", "INDIVIDUAL_BASIC", "INDIVIDUAL_PRO", "ENTERPRISE", "EXEMPT"];

export const BillingModal = ({ isOpen, onClose }: BillingModalProps) => {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState("");
    const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("FREE");

    const filteredPlans = useMemo(() => {
        return PLANS_CONFIG.filter((p: any) => {
            const currentIdx = HIERARCHY.indexOf(currentPlanSlug);
            const planIdx = HIERARCHY.indexOf(p.slug);
            return planIdx > currentIdx;
        });
    }, [currentPlanSlug]);

    const [selectedPlan, setSelectedPlan] = useState(filteredPlans[0] || PLANS_CONFIG[1]);

    // Update selected plan if currentPlanSlug changes (e.g. after fetch)
    useEffect(() => {
        if (filteredPlans.length > 0 && !filteredPlans.find((p: any) => p.slug === selectedPlan?.slug)) {
            setSelectedPlan(filteredPlans[0]);
        }
    }, [filteredPlans, selectedPlan?.slug]);

    // Fetch current subscription
    useEffect(() => {
        if (isOpen) {
            const fetchSub = async () => {
                const sub = await getMyTeamSubscription();
                if (sub) {
                    setCurrentPlanSlug(sub.plan_name);
                }
            };
            fetchSub();
        }
    }, [isOpen]);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

    // Calculate dynamic billing day
    const signupDay = new Date().getDate();
    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const billingDayStr = `${getOrdinal(signupDay)} of each month`;

    // Auto-switch to Crypto mode if wallet is entered AND valid
    const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setWallet(val);

        // Strict ETH address validation: 0x followed by 40 hex characters
        const isValidParams = val.startsWith("0x") && val.length === 42;

        if (isValidParams) {
            setPaymentMethod("crypto");
            setBillingCycle("annual");
        } else if (val.length === 0 && paymentMethod === "crypto") {
            setPaymentMethod("card");
        }
    };

    const monthlyPrice = selectedPlan?.monthly || 0;
    let finalPrice = monthlyPrice;
    let discountLabel = "";

    // Derived state for validation
    const isCryptoValid = wallet.startsWith("0x") && wallet.length === 42;

    if (billingCycle === "annual") {
        if (paymentMethod === "crypto" && isCryptoValid) {
            // 25% Discount for Crypto P2P (Annual) - ONLY if wallet is valid
            finalPrice = (monthlyPrice * 12) * 0.75;
            discountLabel = "Crypto P2P (-25%)";
        } else {
            // 20% Discount for Card/Standard (Annual)
            finalPrice = (monthlyPrice * 12) * 0.80;
            discountLabel = "Annual (-20%)";
        }
    } else {
        finalPrice = monthlyPrice;
    }


    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await saveSubscription({
                planName: selectedPlan.slug,
                amount: finalPrice,
                billingDay: signupDay,
                customerWallet: wallet.startsWith("0x") ? wallet : undefined,
                discountApplied: billingCycle === "annual", // Logic tracks if ANY annual discount applied
                interval: billingCycle
            });

            if (res.error) {
                toast.error(res.error);
                setLoading(false);
            } else if (res.url && res.invoiceId) {
                console.log("[BillingModal] Success, received URL:", res.url);
                toast.success("Opening Secure Portal...");

                // Set these first
                setPaymentUrl(res.url as string);
                setActiveInvoiceId(res.invoiceId as string);
                setPaymentModalOpen(true);

                // Small delay before closing the parent to avoid Radix overlay conflicts
                setTimeout(() => {
                    onClose();
                    setLoading(false);
                }, 300);
            } else {
                console.log("[BillingModal] No URL returned, showing success toast only.");
                toast.success(`Subscription Plan Updated!`);
                onClose();
                setLoading(false);
            }
        } catch (error) {
            toast.error("Subscription failed.");
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl bg-[#09090b] border-zinc-800 p-0 overflow-hidden text-white shadow-2xl">
                    <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                        {/* Sidebar / Plan Selector */}
                        <div className="w-full md:w-96 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800 p-8 flex flex-col relative overflow-hidden">
                            {/* Ambient Background Glow */}
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none opacity-50" />

                            <DialogHeader className="mb-8 relative z-10">
                                <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                                    <Sparkles className="text-cyan-400 w-6 h-6" />
                                    Subscriptions
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500 text-sm">
                                    Choose your tier. Scale dynamically.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Billing Toggle */}
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-xl mb-8 border border-zinc-800/50 relative z-10">
                                <button
                                    onClick={() => { setBillingCycle("monthly"); setPaymentMethod("card"); }}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors",
                                        billingCycle === "monthly" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle("annual")}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors relative overflow-hidden",
                                        billingCycle === "annual" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Annual
                                    <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]", billingCycle === "annual" ? "block" : "hidden")} />
                                    <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                                        (paymentMethod === 'crypto' && isCryptoValid) ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "bg-cyan-500/20 text-cyan-400")}>
                                        {(paymentMethod === 'crypto' && isCryptoValid) ? '-25%' : '-20%'}
                                    </span>
                                </button>
                            </div>

                            {/* Plans List */}
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 relative z-10">
                                {filteredPlans.length === 0 ? (
                                    <div className="text-center py-10">
                                        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold text-zinc-400">Maximum Tier Reached</p>
                                        <p className="text-xs text-zinc-600 mt-1">You are already on the highest plan.</p>
                                    </div>
                                ) : (
                                    filteredPlans.map((plan: any) => (
                                        <button
                                            key={plan.name}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-2xl border transition-colors duration-300 relative group overflow-hidden",
                                                selectedPlan?.name === plan.name
                                                    ? "border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                                                    : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <span className={cn("text-sm font-bold tracking-tight mb-1", selectedPlan?.name === plan.name ? "text-primary" : "text-zinc-300")}>
                                                        {plan.name}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.features.slice(0, 2).map((f: any, i: number) => (
                                                            <span key={i} className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">{f}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {plan.popular && (
                                                    <span className="text-[9px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-lg">PRO</span>
                                                )}
                                                {plan.isContactSales && (
                                                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-black tracking-wider uppercase">Enterprise</span>
                                                )}
                                            </div>
                                            {!plan.isContactSales && (
                                                <div className="mt-3 flex items-baseline gap-1">
                                                    <span className="text-2xl font-mono font-bold tracking-tighter text-white">
                                                        ${billingCycle === "monthly" ? plan.monthly : Math.round(billingCycle === "annual" ? (paymentMethod === 'crypto' ? plan.annual / 12 : (plan.monthly * 12 * 0.8) / 12) : plan.monthly)}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 font-medium">/mo</span>
                                                    {billingCycle === "annual" && (
                                                        <span className="ml-auto text-xs text-zinc-400 line-through decoration-zinc-600">
                                                            ${plan.monthly}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {plan.isContactSales && (
                                                <div className="mt-3 text-xs text-zinc-500 font-bold uppercase tracking-tight italic">
                                                    Contact Sales for Pricing
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="mt-6 relative z-10">
                                <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
                                    P2P Discount Activator
                                </Label>
                                <div className="relative group">
                                    <div className={cn("absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-20 transition duration-500", isCryptoValid ? "opacity-75 animate-pulse" : "group-hover:opacity-40")}></div>
                                    <Input
                                        placeholder="Paste Wallet Address (0x)..."
                                        value={wallet}
                                        onChange={handleWalletChange}
                                        className={cn(
                                            "bg-zinc-950 border-zinc-800 h-10 text-xs font-mono relative focus:ring-0 transition-colors pl-9",
                                            isCryptoValid ? "border-emerald-500/50 text-emerald-400" : "focus:border-emerald-500"
                                        )}
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <div className={cn("w-2 h-2 rounded-full transition-colors duration-300", isCryptoValid ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-zinc-700")} />
                                    </div>
                                </div>

                                <div className={cn("overflow-hidden transition-colors duration-500 ease-in-out", isCryptoValid ? "max-h-12 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0")}>
                                    <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <Sparkles className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                                            25% P2P Discount Unlocked
                                        </p>
                                    </div>
                                </div>
                                {!isCryptoValid && (
                                    <p className="text-[9px] text-zinc-500 mt-2 font-medium uppercase tracking-widest animate-pulse pl-1">
                                        Pay with Crypto • <span className="text-emerald-400">Save 25%</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Main Content / Payment Method */}
                        <div className="flex-1 p-8 md:p-10 bg-[#09090b] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="max-w-xl mx-auto w-full h-full flex flex-col z-10">
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold mb-3 flex items-center gap-3 tracking-tight text-white">
                                        {paymentMethod === 'crypto' ? (
                                            <>
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <Sparkles className="text-emerald-400 w-6 h-6" />
                                                </div>
                                                $USDC Peer to Peer
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                    <CreditCard className="text-indigo-400 w-6 h-6" />
                                                </div>
                                                Information
                                            </>
                                        )}
                                    </h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                                        {selectedPlan?.isContactSales
                                            ? "Enterprise deployments require a tailored architecture. Speak with our infrastructure team to design your dedicated instance."
                                            : paymentMethod === 'crypto'
                                                ? "Direct wallet-to-wallet transfer. No intermediaries. No automated pull. Pure P2P settlement."
                                                : "Secure automated billing via BasaltSURGE Hybrid Rails. Funds settled in USDC on Base."}
                                    </p>
                                </div>

                                <Card className={cn("bg-zinc-900/50 border-zinc-800 mb-8 overflow-hidden transition-colors duration-500", selectedPlan?.isContactSales ? "border-primary/30" : paymentMethod === 'crypto' ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "")}>
                                    <div className="flex flex-row md:items-center p-6 gap-6">
                                        <div className={cn("hidden md:flex w-12 h-12 rounded-full items-center justify-center flex-shrink-0", selectedPlan?.isContactSales ? "bg-primary/10" : paymentMethod === 'crypto' ? "bg-emerald-500/10" : "bg-indigo-500/10")}>
                                            {selectedPlan?.isContactSales ? <Zap className="w-6 h-6 text-primary" /> : paymentMethod === 'crypto' ? <Sparkles className="w-6 h-6 text-emerald-400" /> : <ShieldCheck className="w-6 h-6 text-indigo-400" />}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                                {selectedPlan?.isContactSales ? "Request Enterprise Access" : paymentMethod === 'crypto' ? "PEER-TO-PEER SETTLEMENT" : "Secure Payment Portal"}
                                            </h4>
                                            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                                                {selectedPlan?.isContactSales
                                                    ? "Includes unlimited leads, custom AI modules, and specialized service level agreements (SLAs)."
                                                    : paymentMethod === 'crypto'
                                                        ? "Direct P2P Transfer. Must be settled in USDC on Base Network to qualify for the 25% discount."
                                                        : "Redirects to BasaltSURGE Safe Portal for PCI-compliant card vaulting."}
                                            </p>
                                        </div>
                                    </div>
                                    {!selectedPlan?.isContactSales && paymentMethod !== 'crypto' && (
                                        <div className="bg-zinc-950/50 px-6 py-2 flex items-center justify-between border-t border-zinc-800/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] text-zinc-400 font-medium">Results: Encryption Active</span>
                                            </div>
                                            <Clock className="text-zinc-600 w-3 h-3" />
                                        </div>
                                    )}
                                </Card>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-zinc-500 w-4 h-4" />
                                            <span className="font-medium text-zinc-300">Next Billing Day</span>
                                        </div>
                                        <span className="font-mono font-bold text-cyan-400">{billingDayStr}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <div className="flex items-center gap-3 relative z-10">
                                            <CheckCircle2 className="text-zinc-500 w-4 h-4" />
                                            <span className="font-medium text-zinc-300">Total Due Today</span>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <div className="text-[10px] text-zinc-500 mb-0.5 text-right uppercase tracking-wider font-bold">
                                                {selectedPlan.name} • {billingCycle}
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                {discountLabel && (
                                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", paymentMethod === 'crypto' ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400")}>
                                                        {discountLabel}
                                                    </span>
                                                )}
                                                <span className="font-mono font-bold text-2xl text-white tracking-tight">
                                                    ${finalPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <Button
                                        className={cn(
                                            "w-full h-16 rounded-2xl text-lg font-bold shadow-2xl transition-colors group overflow-hidden relative",
                                            selectedPlan?.isContactSales
                                                ? "bg-primary hover:bg-primary/90"
                                                : paymentMethod === 'crypto'
                                                    ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                                                    : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
                                        )}
                                        onClick={handleSave}
                                        disabled={loading || !selectedPlan}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? "Processing..." : selectedPlan?.isContactSales ? (
                                                <>
                                                    Speak with Enterprise Sales
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            ) : (
                                                <>
                                                    {paymentMethod === 'crypto' ? "Confirm P2P Transfer (USDC Only)" : `Activate ${selectedPlan?.name}`}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                    <p className="text-center text-[10px] text-zinc-600 mt-6 leading-relaxed px-8">
                                        {selectedPlan?.isContactSales
                                            ? "By clicking, our sales team will reach out to the organization owner within 24 hours."
                                            : paymentMethod === 'crypto'
                                                ? "P2P Transactions must be in USDC on Base Network. Volatility protection ensures your rate is locked."
                                                : "By subscribing, you enable BasaltSURGE Hybrid Rails. Charges are processed in USDC via Base network automation."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {paymentUrl && activeInvoiceId && (
                <PaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    url={paymentUrl}
                    amount={finalPrice.toString()}
                    currency="USDC"
                    invoiceId={activeInvoiceId}
                />
            )}
        </>
    );
};
