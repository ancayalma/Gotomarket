"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, UserPlus } from "lucide-react";

export function ListMethodModal({
    isOpen,
    onClose,
    onSelectWizard,
    onSelectManual
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectWizard: () => void;
    onSelectManual: () => void;
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-xl border-white/5 shadow-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black italic tracking-tight uppercase bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        Create New List
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Choose how you would like to construct your new List or Lead Pool.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            onSelectWizard();
                            onClose();
                        }}
                        className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all gap-4 text-center cursor-pointer"
                    >
                        <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Bot className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold uppercase tracking-wider text-sm mb-1">AI Lead Gen</h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-3">
                                Generate a brand new Lead Pool of contacts and accounts using the autonomous Agentic AI Scraper based on ICP criteria.
                            </p>
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            onSelectManual();
                            onClose();
                        }}
                        className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all gap-4 text-center cursor-pointer"
                    >
                        <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold uppercase tracking-wider text-sm mb-1">Manual Selection</h3>
                            <p className="text-[10px] text-muted-foreground line-clamp-3">
                                Select from your existing Accounts and Contacts database natively to organize targets for outreach and tasks.
                            </p>
                        </div>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
