"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    title: string;
    description: string;
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    loading,
    title,
    description
}: ConfirmModalProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[400px] bg-[#0c0c0e]/95 border-primary/20 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2 text-red-500">
                        <div className="p-2 rounded-full bg-red-500/10">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white tracking-tight">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 pt-6">
                    <Button
                        disabled={loading}
                        variant="ghost"
                        onClick={onClose}
                        className="hover:bg-white/5 text-muted-foreground hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={onConfirm}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 shadow-lg shadow-red-500/20"
                    >
                        {loading ? "Deleting..." : "Confirm Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
