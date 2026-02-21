"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ForcePasswordChangeModalProps {
    isOpen: boolean;
}

const ForcePasswordChangeModal = ({ isOpen }: ForcePasswordChangeModalProps) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const passwordRequirements = [
        { label: "At least 8 characters", met: newPassword.length >= 8 },
        { label: "Matches confirmation", met: newPassword.length > 0 && newPassword === confirmPassword },
    ];

    const allMet = passwordRequirements.every(req => req.met);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allMet) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/user/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                toast.success("Password updated successfully");
                // Refresh to update session/state
                router.refresh();
                window.location.reload();
            } else {
                const error = await response.text();
                toast.error(error || "Failed to update password");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-1 focus:outline-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="relative h-32 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center border-b border-white/5">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner mb-2">
                                    <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <Dialog.Title className="text-2xl font-bold text-white text-center mb-2">
                                Secure Your Account
                            </Dialog.Title>
                            <Dialog.Description className="text-muted-foreground text-center text-sm mb-8">
                                You are using a temporary password. Please set a unique, strong password to continue.
                            </Dialog.Description>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-white/50 uppercase tracking-widest ml-1">
                                            New Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-white/50 uppercase tracking-widest ml-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="p-4 rounded-xl bg-white/5 space-y-2 border border-white/5">
                                    {passwordRequirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-1.5 w-1.5 rounded-full transition-colors",
                                                req.met ? "bg-emerald-400" : "bg-white/20"
                                            )} />
                                            <span className={cn(
                                                "text-[12px] font-medium transition-colors",
                                                req.met ? "text-emerald-400" : "text-white/40"
                                            )}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!allMet || isLoading}
                                    className={cn(
                                        "w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300",
                                        allMet
                                            ? "bg-primary text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                                            : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Update Password
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ForcePasswordChangeModal;
