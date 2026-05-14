"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface VerifyEmailClientProps {
    userEmail: string;
    isPlatformAdmin?: boolean;
}

export default function VerifyEmailClient({ userEmail, isPlatformAdmin = false }: VerifyEmailClientProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [verified, setVerified] = useState(false);
    const router = useRouter();

    const handleCheckStatus = async () => {
        setIsChecking(true);
        try {
            const res = await fetch("/api/user/verify-email");
            const data = await res.json();

            if (data.verified) {
                setVerified(true);
                toast.success("Email verified successfully!");
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1200);
            } else {
                toast.error("Email not yet verified. Please check your inbox and click the verification link.");
            }
        } catch {
            toast.error("Failed to check verification status");
        } finally {
            setIsChecking(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const res = await fetch("/api/user/verify-email", { method: "POST" });
            if (res.ok) {
                toast.success("Verification email resent! Check your inbox.");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to resend verification email");
            }
        } catch {
            toast.error("Failed to resend verification email");
        } finally {
            setIsResending(false);
        }
    };

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            const res = await fetch("/api/user/verify-email", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skip: true })
            });
            if (res.ok) {
                toast.success("Email verification skipped");
                router.push("/admin");
            } else {
                toast.error("Failed to skip verification");
            }
        } catch {
            toast.error("Failed to skip verification");
        } finally {
            setIsSkipping(false);
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
                <div className="relative h-36 w-full bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent flex items-center justify-center border-b border-white/5">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className={cn(
                            "h-20 w-20 rounded-full border flex items-center justify-center shadow-inner mb-2 transition-colors duration-500",
                            verified
                                ? "bg-emerald-500/20 border-emerald-500/30"
                                : "bg-blue-500/20 border-blue-500/30"
                        )}>
                            {verified ? (
                                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                            ) : (
                                <Mail className="h-10 w-10 text-blue-400 animate-pulse" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-400 to-blue-400/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 text-center mb-2">
                        {verified ? "Email Verified!" : "Verify Your Email"}
                    </h1>
                    <p className="text-muted-foreground text-center text-sm mb-6">
                        {verified ? (
                            "Your email has been successfully verified. Redirecting to dashboard..."
                        ) : (
                            <>
                                A verification email has been sent to{" "}
                                <strong className="text-white">{userEmail}</strong>.
                                <br />
                                Please open the email and click the verification link, then come back here and click &quot;Check Status&quot;.
                            </>
                        )}
                    </p>

                    {!verified && (
                        <div className="space-y-4">
                            {/* Instructions */}
                            <div className="p-4 rounded-xl bg-white/5 space-y-3 border border-white/5">
                                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">How it works</p>
                                <div className="space-y-2">
                                    {[
                                        "Check your inbox for an email from Amazon Web Services",
                                        "Click the verification link in the email",
                                        "Come back here and click \"Check Status\" below"
                                    ].map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-[10px] font-bold text-blue-400">{idx + 1}</span>
                                            </div>
                                            <span className="text-[12px] text-white/60">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className={cn(
                                    "w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
                                    "bg-blue-600 text-white shadow-lg shadow-blue-900/25 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
                                )}
                            >
                                {isChecking ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Check Status
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="w-full h-10 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 flex items-center justify-center gap-2 transition-colors bg-white/5 border border-white/5 hover:border-white/10"
                            >
                                {isResending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Resend Verification Email
                                    </>
                                )}
                            </button>

                            <p className="text-[11px] text-white/20 text-center leading-relaxed">
                                The email may take a few minutes to arrive. Check your spam folder if you don&apos;t see it.
                            </p>

                            {isPlatformAdmin && (
                                <button
                                    onClick={handleSkip}
                                    disabled={isSkipping}
                                    className="w-full h-9 rounded-xl text-xs font-medium text-amber-400/60 hover:text-amber-400 flex items-center justify-center gap-2 transition-colors border border-amber-500/10 hover:border-amber-500/30 mt-2"
                                >
                                    {isSkipping ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        "Skip for Now (Admin)"
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
