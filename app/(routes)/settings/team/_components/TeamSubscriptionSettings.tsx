"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { BillingModal } from "@/components/modals/BillingModal";

interface TeamSubscriptionSettingsProps {
    planName: string;
    planSlug: string;
}

export const TeamSubscriptionSettings = ({ planName, planSlug }: TeamSubscriptionSettingsProps) => {
    const [isBillingOpen, setIsBillingOpen] = useState(false);

    return (
        <>
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-colors">
                <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase">
                                Subscription Plan
                            </CardTitle>
                            <CardDescription className="text-zinc-500">
                                View your current tier and upgrade options.
                            </CardDescription>
                        </div>
                        <CreditCard className="w-8 h-8 text-zinc-800 group-hover:text-primary/20 transition-colors" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Current Tier</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                            {planName}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-mono bg-primary/5 uppercase">
                                            {planSlug}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Billing</div>
                                    <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Managed via Portal</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto flex flex-col gap-3">
                            <Button
                                onClick={() => setIsBillingOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-tighter px-8 h-12 shadow-xl shadow-primary/20"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Upgrade My Team
                            </Button>
                            <p className="text-[9px] text-zinc-500 text-center uppercase tracking-widest font-bold">
                                Unlock high-limit infrastructure
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BillingModal
                isOpen={isBillingOpen}
                onClose={() => setIsBillingOpen(false)}
            />
        </>
    );
};
