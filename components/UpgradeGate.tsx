"use client";

import { useSession } from "next-auth/react";
import { checkTeamFeature } from "@/lib/subscription";
import { Lock, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BillingModal } from "./modals/BillingModal";

export function UpgradeGate({
    featureId,
    children,
    title = "Premium Feature Locked",
    description = "Upgrade your workspace plan to unlock this powerful capability and scale your outreach operations."
}: {
    featureId: string,
    children: React.ReactNode,
    title?: string,
    description?: string,
}) {
    const { data: session } = useSession();
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    // allow while loading or fallback
    if (!session?.user) return <>{children}</>;

    const user = session.user as any;
    if (!user.assigned_team) return <>{children}</>;

    const hasAccess = checkTeamFeature(user.assigned_team, featureId);

    if (hasAccess) return <>{children}</>;

    return (
        <>
            <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-8 mt-12">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="w-24 h-24 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-center relative shadow-2xl z-10">
                        <Lock className="w-10 h-10 text-primary" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center pointer-events-none shadow-lg">
                            <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-black tracking-tight mb-3 text-white relative z-10">{title}</h2>
                <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-8 relative z-10">
                    {description}
                </p>

                <Button
                    size="lg"
                    className="relative z-10 h-14 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-[color,background-color,border-color,box-shadow] rounded-xl gap-2 cursor-pointer"
                    onClick={() => setIsBillingModalOpen(true)}
                >
                    <Zap className="w-5 h-5 fill-current" />
                    Upgrade Now to Unlock
                </Button>

                <p className="mt-8 text-[11px] font-black tracking-[0.2em] text-zinc-600 uppercase relative z-10 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-zinc-800"></span>
                    Requires Individual Basic Plan or Higher
                    <span className="w-4 h-[1px] bg-zinc-800"></span>
                </p>
            </div>

            <BillingModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
            />
        </>
    );
}

