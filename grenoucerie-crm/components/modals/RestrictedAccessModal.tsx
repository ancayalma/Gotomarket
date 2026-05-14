"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Lock, UserCheck, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface RestrictedAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    poolName?: string;
}

export default function RestrictedAccessModal({ isOpen, onClose, poolName }: RestrictedAccessModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-md bg-zinc-950 border-zinc-800/50 shadow-2xl p-0 overflow-hidden">
                <div className="relative p-8">
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 opacity-50" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[80px] rounded-full" />

                    <div className="relative space-y-6">
                        <div className="flex justify-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-xl shadow-red-500/5"
                            >
                                <Lock className="w-8 h-8 text-red-500" />
                            </motion.div>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">
                                Access Restricted
                            </h2>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Security Protocol 403</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 space-y-3">
                            <p className="text-sm text-zinc-400 text-center leading-relaxed">
                                Your clearance level is currently restricted for <span className="text-white font-bold italic">"{poolName || "this list"}"</span>.
                            </p>
                            <p className="text-[11px] text-zinc-500 text-center leading-tight">
                                To perform outreach on this cohort, you must be explicitly <span className="text-emerald-500 font-bold uppercase tracking-tighter">Assigned</span> as a member by your Team Administrator.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2">
                            <Button
                                onClick={onClose}
                                className="w-full bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-tighter italic h-10 rounded-xl"
                            >
                                Acknowledge Protocol
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-2 grayscale opacity-40">
                            <UserCheck className="w-3 h-3 text-zinc-500" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 uppercase">Basalt Auth v4.2 Active</span>
                        </div>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
