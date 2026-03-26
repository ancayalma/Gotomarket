"use client";

import { Check, Zap, Server, Shield, ExternalLink } from "lucide-react";

interface ApiUsageQuotaProps {
    currentPlan: string;
}

export function ApiUsageQuota({ currentPlan }: ApiUsageQuotaProps) {
    const plans = [
        {
            name: "Starter",
            slug: "STARTER",
            price: "$0/mo",
            limits: "100 calls",
            features: "Basic API Access. One-touch CSV exports.",
            value: "Perfect for testing headless Next.js, very low volume."
        },
        {
            name: "Growth",
            slug: "GROWTH",
            price: "$29/user/mo",
            limits: "1,500 calls",
            features: "Surge API sync for Physical Products. Product Inventory syncing.",
            value: "Ideal for startups doing a moderate amount of product sales."
        },
        {
            name: "Scale",
            slug: "SCALE",
            price: "$79/user/mo",
            limits: "5,000 calls",
            features: "Subscription Management Integration. Automates coaching and service fulfillment.",
            value: "Next.js Customer Portal headless access. Full ecosystem automation."
        },
        {
            name: "Enterprise",
            slug: "ENTERPRISE",
            price: "Custom",
            limits: "Uncapped/Custom",
            features: "Priority Webhooks. SLA.",
            value: "Custom solutions for high-volume merchants."
        }
    ];

    return (
        <div className="bg-[#18181b] border border-primary/20 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" /> 
                    SaaS Monetization & Tiering Strategy
                </h3>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Current Plan:</span>
                    <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        {currentPlan || "FREE"}
                    </span>
                </div>
            </div>

            <div className="text-sm text-muted-foreground mb-6 relative z-10">
                The API is free-flowing but gated purely by volume and advanced resource access. Users generate API keys in the CRM Settings -&gt; API & Integrations.
            </div>

            <div className="overflow-x-auto relative z-10 rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-black/40 border-b border-white/10">
                            <th className="p-4 font-semibold text-white">Tier</th>
                            <th className="p-4 font-semibold text-white">Pricing</th>
                            <th className="p-4 font-semibold text-white whitespace-nowrap">API Limits / mo</th>
                            <th className="p-4 font-semibold text-white">E-Commerce Focus Features</th>
                            <th className="p-4 font-semibold text-white">Added Values</th>
                            <th className="p-4 font-semibold text-white text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {plans.map((plan) => {
                            const isCurrent = (currentPlan || "STARTER").toUpperCase() === (plan as any).slug?.toUpperCase()
                                || (currentPlan || "STARTER").toUpperCase() === plan.name.toUpperCase();
                            return (
                                <tr 
                                    key={plan.name} 
                                    className={`transition-colors ${isCurrent ? 'bg-primary/5 hover:bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
                                >
                                    <td className="p-4 font-bold text-white">
                                        <div className="flex items-center gap-2">
                                            {plan.name}
                                            {isCurrent && <Zap className="w-3 h-3 text-primary fill-primary" />}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-muted-foreground">{plan.price}</td>
                                    <td className="p-4 font-mono font-bold text-primary">{plan.limits}</td>
                                    <td className="p-4 text-muted-foreground leading-relaxed max-w-xs">{plan.features}</td>
                                    <td className="p-4 text-muted-foreground leading-relaxed max-w-xs">{plan.value}</td>
                                    <td className="p-4 text-right">
                                        {isCurrent ? (
                                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/20 whitespace-nowrap">
                                                <Check className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <a href={plan.name === "Enterprise" ? "mailto:sales@yourdomain.com" : "/admin/billing"} className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-bold tracking-widest uppercase border border-white/10 transition-colors whitespace-nowrap">
                                                {plan.name === "Free" ? "Select Plan" : plan.name === "Enterprise" ? "Contact Team" : "Upgrade"} 
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
