
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
import { SUBSCRIPTION_PLANS, SURGE_DISCOUNT_PERCENT } from "@/config/subscriptions";
import { getMyTeamSubscription } from "@/actions/billing/get-my-subscription";

const PLANS_CONFIG = [
    {
        name: SUBSCRIPTION_PLANS.GROWTH.name,
        slug: SUBSCRIPTION_PLANS.GROWTH.slug,
        monthly: SUBSCRIPTION_PLANS.GROWTH.price,
        annual: SUBSCRIPTION_PLANS.GROWTH.price * 12 * 0.8,
        features: [
            "5M AI Tokens / mo",
            "1,000 LeadGen Credits",
            "Max 750 Accounts",
            "Billed Per Seat"
        ]
    },
    {
        name: SUBSCRIPTION_PLANS.SCALE.name,
        slug: SUBSCRIPTION_PLANS.SCALE.slug,
        monthly: SUBSCRIPTION_PLANS.SCALE.price,
        annual: SUBSCRIPTION_PLANS.SCALE.price * 12 * 0.8,
        features: [
            "20M AI Tokens / mo",
            "5,000 LeadGen Credits",
            "1,000 SMS / mo",
            "100 Voice Minutes / mo",
            "10 User Licenses"
        ],
        popular: true
    },
    {
        name: SUBSCRIPTION_PLANS.ENTERPRISE.name,
        slug: SUBSCRIPTION_PLANS.ENTERPRISE.slug,
        monthly: 0,
        annual: 0,
        features: [
            "Unlimited AI Tokens",
            "Custom Engineering",
            "White-label Options",
            "Dedicated Support"
        ],
        isContactSales: true
    }
];

const HIERARCHY = ["STARTER", "GROWTH", "SCALE", "ENTERPRISE", "EXEMPT"];

export const BillingModal = ({ isOpen, onClose }: BillingModalProps) => {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [paymentProvider, setPaymentProvider] = useState<"STRIPE" | "SURGE">("STRIPE");
    const [loading, setLoading] = useState(false);
    const [currentPlanSlug, setCurrentPlanSlug] = useState<string>("FREE");

    // Hard opt-in: Surge billing is only available when explicitly enabled
    const surgeAvailable = process.env.NEXT_PUBLIC_SURGE_BILLING_ENABLED === "true";

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

    // Payment Modal State (for Surge flow)
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

    // Price calculations
    const monthlyPrice = selectedPlan?.monthly || 0;
    let finalPrice = monthlyPrice;
    let discountLabel = "";

    if (billingCycle === "annual") {
        finalPrice = (monthlyPrice * 12) * 0.80;
        discountLabel = "Annual (-20%)";
    }

    // Surge gets the 5% discount on top
    if (paymentProvider === "SURGE") {
        finalPrice = finalPrice * (1 - SURGE_DISCOUNT_PERCENT / 100);
        discountLabel = discountLabel
            ? `${discountLabel} + Surge (-${SURGE_DISCOUNT_PERCENT}%)`
            : `Surge (-${SURGE_DISCOUNT_PERCENT}%)`;
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await saveSubscription({
                planName: selectedPlan.slug,
                amount: billingCycle === "annual" ? (monthlyPrice * 12) * 0.80 : monthlyPrice,
                billingDay: signupDay,
                discountApplied: paymentProvider === "SURGE",
                interval: billingCycle,
                paymentProvider,
            });

            if (res.error) {
                toast.error(res.error);
                setLoading(false);
            } else if (res.url) {
                toast.success("Opening Payment Portal...");

                if (res.provider === "STRIPE" || paymentProvider === "STRIPE") {
                    // Stripe: redirect to Stripe Checkout
                    window.location.href = res.url;
                } else {
                    // Surge: open in-app PaymentModal
                    setPaymentUrl(res.url as string);
                    setActiveInvoiceId((res as any).invoiceId as string);
                    setPaymentModalOpen(true);

                    setTimeout(() => {
                        onClose();
                        setLoading(false);
                    }, 300);
                }
            } else {
                toast.success(`Subscription Plan Updated!`);
                onClose();
                setLoading(false);
            }
        } catch (error) {
            toast.error("Subscription failed.");
            setLoading(false);
        }
    };

    const isStripe = paymentProvider === "STRIPE";
    const isSurge = paymentProvider === "SURGE";

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
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-xl mb-4 border border-zinc-800/50 relative z-10">
                                <button
                                    onClick={() => setBillingCycle("monthly")}
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
                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">-20%</span>
                                </button>
                            </div>

                            {/* Payment Provider Toggle */}
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-xl mb-8 border border-zinc-800/50 relative z-10">
                                <button
                                    onClick={() => setPaymentProvider("STRIPE")}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                                        isStripe ? "bg-indigo-600/30 text-indigo-300 shadow-lg border border-indigo-500/30" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <CreditCard className="w-3 h-3" />
                                    Stripe
                                </button>
                                <button
                                    onClick={() => surgeAvailable && setPaymentProvider("SURGE")}
                                    disabled={!surgeAvailable}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors relative flex items-center justify-center gap-1.5",
                                        !surgeAvailable
                                            ? "text-zinc-600 cursor-not-allowed opacity-50"
                                            : isSurge ? "bg-emerald-600/30 text-emerald-300 shadow-lg border border-emerald-500/30" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    <Zap className="w-3 h-3" />
                                    BasaltSurge
                                    {surgeAvailable ? (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black">-{SURGE_DISCOUNT_PERCENT}%</span>
                                    ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-500 font-black uppercase tracking-wider">Coming Soon</span>
                                    )}
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
                                        <div
                                            key={plan.name}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-2xl border transition-colors duration-300 relative group overflow-hidden cursor-pointer",
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
                                                    <div className="flex flex-wrap gap-1 mt-1">
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
                                                        ${billingCycle === "monthly" ? plan.monthly : Math.round((plan.monthly * 12 * 0.8) / 12)}
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
                                            
                                            <div className="mt-3 flex justify-end">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-7 text-[10px] bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open("/pricing", "_blank");
                                                    }}
                                                >
                                                    View details
                                                    <ArrowRight className="w-3 h-3 ml-1 opacity-50" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Surge Discount Info */}
                            {isSurge && (
                                <div className="mt-6 relative z-10">
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                                                {SURGE_DISCOUNT_PERCENT}% Surge Discount Active
                                            </p>
                                            <p className="text-[9px] text-emerald-400/60 mt-0.5">
                                                Manual monthly billing via BasaltSurge portal
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Content / Payment Method */}
                        <div className="flex-1 p-8 md:p-10 bg-[#09090b] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="max-w-xl mx-auto w-full h-full flex flex-col z-10">
                                <div className="mb-8">
                                    <h3 className="text-3xl font-bold mb-3 flex items-center gap-3 tracking-tight text-white">
                                        {isSurge ? (
                                            <>
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <Zap className="text-emerald-400 w-6 h-6" />
                                                </div>
                                                BasaltSurge Portal
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                    <CreditCard className="text-indigo-400 w-6 h-6" />
                                                </div>
                                                Stripe Checkout
                                            </>
                                        )}
                                    </h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                                        {selectedPlan?.isContactSales
                                            ? "Enterprise deployments require a tailored architecture. Speak with our infrastructure team to design your dedicated instance."
                                            : isSurge
                                                ? `Manual monthly billing via BasaltSurge Hybrid Rails. Save ${SURGE_DISCOUNT_PERCENT}% — funds settled in USDC on Base.`
                                                : "Automated recurring billing via Stripe. Card or bank payments with instant activation."}
                                    </p>
                                </div>

                                <Card className={cn("bg-zinc-900/50 border-zinc-800 mb-8 overflow-hidden transition-colors duration-500", selectedPlan?.isContactSales ? "border-primary/30" : isSurge ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "border-indigo-500/30 ring-1 ring-indigo-500/20")}>
                                    <div className="flex flex-row md:items-center p-6 gap-6">
                                        <div className={cn("hidden md:flex w-12 h-12 rounded-full items-center justify-center flex-shrink-0", selectedPlan?.isContactSales ? "bg-primary/10" : isSurge ? "bg-emerald-500/10" : "bg-indigo-500/10")}>
                                            {selectedPlan?.isContactSales ? <Zap className="w-6 h-6 text-primary" /> : isSurge ? <Sparkles className="w-6 h-6 text-emerald-400" /> : <ShieldCheck className="w-6 h-6 text-indigo-400" />}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                                {selectedPlan?.isContactSales
                                                    ? "Request Enterprise Access"
                                                    : isSurge
                                                        ? "BASALTSURGE HYBRID RAILS"
                                                        : "Automated Stripe Billing"}
                                            </h4>
                                            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                                                {selectedPlan?.isContactSales
                                                    ? "Includes unlimited AI tokens, custom AI modules, and specialized service level agreements (SLAs)."
                                                    : isSurge
                                                        ? `Pay manually each month via the Surge payment portal. ${SURGE_DISCOUNT_PERCENT}% discount applied automatically.`
                                                        : "Stripe manages recurring charges automatically. Cancel or modify anytime via the Customer Portal."}
                                            </p>
                                        </div>
                                    </div>
                                    {!selectedPlan?.isContactSales && (
                                        <div className="bg-zinc-950/50 px-6 py-2 flex items-center justify-between border-t border-zinc-800/50">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", isSurge ? "bg-emerald-500" : "bg-indigo-500")} />
                                                <span className="text-[10px] text-zinc-400 font-medium">
                                                    {isSurge ? "Manual Payment • Surge Portal" : "Auto-Billing • Stripe Secure"}
                                                </span>
                                            </div>
                                            <Clock className="text-zinc-600 w-3 h-3" />
                                        </div>
                                    )}
                                </Card>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-zinc-500 w-4 h-4" />
                                            <span className="font-medium text-zinc-300">
                                                {isStripe ? "Billing Frequency" : "Next Billing Day"}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-cyan-400">
                                            {isStripe ? (billingCycle === "annual" ? "Annually" : "Monthly (Auto)") : billingDayStr}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <div className="flex items-center gap-3 relative z-10">
                                            <CheckCircle2 className="text-zinc-500 w-4 h-4" />
                                            <span className="font-medium text-zinc-300">Total Due Today</span>
                                        </div>
                                        <div className="text-right relative z-10">
                                            <div className="text-[10px] text-zinc-500 mb-0.5 text-right uppercase tracking-wider font-bold">
                                                {selectedPlan.name} • {billingCycle} • {paymentProvider}
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                {discountLabel && (
                                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", isSurge ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400")}>
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
                                                : isSurge
                                                    ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                                                    : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
                                        )}
                                        onClick={handleSave}
                                        disabled={loading || !selectedPlan || (isSurge && !surgeAvailable)}
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
                                                    {isSurge ? `Activate via Surge (Save ${SURGE_DISCOUNT_PERCENT}%)` : `Activate ${selectedPlan?.name} via Stripe`}
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                    <p className="text-center text-[10px] text-zinc-600 mt-6 leading-relaxed px-8">
                                        {selectedPlan?.isContactSales
                                            ? "By clicking, our sales team will reach out to the organization owner within 24 hours."
                                            : isSurge
                                                ? `BasaltSurge processes manual monthly payments. ${SURGE_DISCOUNT_PERCENT}% discount applied. Settled in USDC on Base.`
                                                : "Stripe securely handles your payment information. You can manage your subscription anytime via the Customer Portal."}
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
