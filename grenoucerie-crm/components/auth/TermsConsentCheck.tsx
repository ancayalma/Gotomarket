"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function TermsConsentCheck() {
    const { data: session, update } = useSession();
    const [open, setOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Only bother checking if we have a fully authenticated session
        if (session?.user) {
            if ((session.user as any).termsAccepted === false) {
                setOpen(true);
            }
        }
    }, [session]);

    const handleAcceptTerms = async () => {
        if (!accepted) return;

        setLoading(true);
        try {
            await axios.post("/api/user/accept-terms");
            await update({ termsAccepted: true }); // trigger NextAuth session refresh
            setOpen(false);
            toast({
                title: "Terms Accepted",
                description: "Thank you for accepting the latest Terms of Service and Privacy Policy.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save your preferences. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-zinc-950/95 backdrop-blur-md z-[99999]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Action Required</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        To continue using BasaltCRM and to comply with data compliance regulations (SOC2), you must accept our latest Terms of Service and Privacy Policy.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 my-4">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="terms"
                            checked={accepted}
                            onCheckedChange={(checked) => setAccepted(checked as boolean)}
                            disabled={loading}
                            className="mt-1 flex-shrink-0"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-normal cursor-pointer"
                            >
                                I have read and agree to the <Link href="/terms" target="_blank" className="text-primary hover:underline italic font-bold">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-primary hover:underline italic font-bold">Privacy Policy</Link>.
                            </label>
                            <p className="text-xs text-muted-foreground">
                                You acknowledge how your platform data is stored, processed, and secured.
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        className="w-full"
                        disabled={!accepted || loading}
                        onClick={handleAcceptTerms}
                    >
                        {loading ? "Saving..." : "Acknowledge & Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
