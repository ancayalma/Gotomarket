"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MailX, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FreemailNoticeClientProps {
    userEmail: string;
}

export default function FreemailNoticeClient({ userEmail }: FreemailNoticeClientProps) {
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const router = useRouter();

    const handleAcknowledge = async () => {
        setIsAcknowledging(true);
        try {
            const res = await fetch("/api/user/freemail-acknowledge", { method: "POST" });
            if (res.ok) {
                toast.success("Welcome to BasaltCRM!");
                setTimeout(() => {
                    router.push("/");
                }, 800);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch {
            toast.error("Failed to continue. Please try again.");
        } finally {
            setIsAcknowledging(false);
        }
    };

    return (
        <div className="flex items-center justify-center w-full px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl"
            >
                {/* Header */}
                <div className="relative h-36 w-full bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent flex items-center justify-center border-b border-white/5">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-inner mb-2">
                            <MailX className="h-10 w-10 text-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-400/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 text-center mb-2">
                        Personal Email Detected
                    </h1>
                    <p className="text-muted-foreground text-center text-sm mb-6">
                        You registered with a personal email address{" "}
                        <strong className="text-white">{userEmail}</strong>.
                        <br />
                        Personal email addresses are <strong className="text-amber-400">not eligible</strong> for
                        our outbound email services.
                    </p>

                    <div className="space-y-4">
                        {/* Info Card */}
                        <div className="p-4 rounded-xl bg-amber-500/5 space-y-3 border border-amber-500/10">
                            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                What This Means
                            </p>
                            <div className="space-y-2">
                                {[
                                    { icon: "✓", color: "emerald", text: "Full CRM access — contacts, leads, pipelines, analytics, and AI tools" },
                                    { icon: "✗", color: "red", text: "Email outreach, campaigns, and automated sending will be unavailable" },
                                    { icon: "→", color: "blue", text: "To unlock email services, update your account to a workspace email in Team Settings" }
                                ].map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className={cn(
                                            "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                            point.color === "emerald" ? "bg-emerald-500/20 border border-emerald-500/30" :
                                            point.color === "red" ? "bg-red-500/20 border border-red-500/30" :
                                            "bg-blue-500/20 border border-blue-500/30"
                                        )}>
                                            <span className={cn(
                                                "text-[10px] font-bold",
                                                point.color === "emerald" ? "text-emerald-400" :
                                                point.color === "red" ? "text-red-400" : "text-blue-400"
                                            )}>{point.icon}</span>
                                        </div>
                                        <span className="text-[12px] text-white/60">{point.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={handleAcknowledge}
                            disabled={isAcknowledging}
                            className={cn(
                                "w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
                                "bg-amber-600 text-white shadow-lg shadow-amber-900/25 hover:bg-amber-500 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isAcknowledging ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    I Understand, Continue to Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-white/20 text-center leading-relaxed">
                            You can upgrade to a workspace email at any time from your Team Settings.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
