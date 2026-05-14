"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EmailVerificationModalProps {
    isOpen: boolean;
    userEmail?: string;
}

const EmailVerificationModal = ({ isOpen, userEmail }: EmailVerificationModalProps) => {
    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);
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
                    router.refresh();
                    window.location.reload();
                }, 1200);
            } else {
                toast.error("Email not yet verified. Please check your inbox and click the verification link.");
            }
        } catch (error) {
            toast.error("Failed to check verification status");
        } finally {
            setIsChecking(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const res = await fetch("/api/user/verify-email", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Verification email resent! Check your inbox.");
            } else {
                toast.error(data.error || "Failed to resend verification email");
            }
        } catch {
            toast.error("Failed to resend verification email");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} modal>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-in fade-in duration-300" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-1 focus:outline-none"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="relative h-32 w-full bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent flex items-center justify-center border-b border-white/5">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={cn(
                                    "h-16 w-16 rounded-full border flex items-center justify-center shadow-inner mb-2 transition-colors duration-500",
                                    verified
                                        ? "bg-emerald-500/20 border-emerald-500/30"
                                        : "bg-blue-500/20 border-blue-500/30"
                                )}>
                                    {verified ? (
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    ) : (
                                        <Mail className="h-8 w-8 text-blue-400 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <Dialog.Title className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-400 to-blue-400/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2 text-center mb-2">
                                {verified ? "Email Verified!" : "Verify Your Email"}
                            </Dialog.Title>
                            <Dialog.Description className="text-muted-foreground text-center text-sm mb-6">
                                {verified ? (
                                    "Your email has been successfully verified. Redirecting..."
                                ) : (
                                    <>
                                        A verification email has been sent to{" "}
                                        <strong className="text-white">{userEmail || "your email"}</strong>.
                                        <br />
                                        Please open the email and click the verification link, then come back here and click &quot;Check Status&quot;.
                                    </>
                                )}
                            </Dialog.Description>

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
                                </div>
                            )}
                        </div>
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default EmailVerificationModal;
