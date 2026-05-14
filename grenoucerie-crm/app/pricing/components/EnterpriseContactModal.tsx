"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Turnstile } from '@marsidev/react-turnstile';
import { useToast } from "@/components/ui/use-toast";
import { Building2, Mail, User, Users, Cuboid as Cube, ArrowRight, CheckCircle2 } from "lucide-react";

export function EnterpriseContactModal({ trigger }: { trigger: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !turnstileToken) {
            toast({ title: "Verification required", description: "Please complete the captcha.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/contact/enterprise", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("name"),
                    email: formData.get("email"),
                    company: formData.get("company"),
                    size: formData.get("size"),
                    seats: formData.get("seats"),
                    interest: formData.getAll("interest"),
                    comments: formData.get("comments"),
                    turnstile_token: turnstileToken
                })
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                toast({ title: "Submission Failed", description: "Please try again later.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Submission Failed", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="sm:max-w-[500px] border-emerald-500/20 bg-zinc-950 p-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white">Request Received</h3>
                        <p className="text-zinc-400">Thank you! Our Enterprise team will review your inquiry and be in touch shortly.</p>
                        <Button onClick={() => setOpen(false)} variant="outline" className="mt-6 border-zinc-800 hover:bg-zinc-900">
                            Close Window
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-zinc-800 bg-zinc-950/95 backdrop-blur-xl gap-0 p-0 overflow-hidden">
                <div className="p-6 md:p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase">Enterprise Solutions</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base">
                            Get in touch to build a custom infrastructure tailored for your team's scale.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input id="name" name="name" required placeholder="Jane Doe" className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-primary/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Work Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input id="email" name="email" type="email" required placeholder="jane@company.com" className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-primary/50" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-zinc-300">Company Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input id="company" name="company" required placeholder="Acme Corp" className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-primary/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="size" className="text-zinc-300">Company Size</Label>
                                <Select name="size" required>
                                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus:ring-primary/50 text-left">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-zinc-500" />
                                            <SelectValue placeholder="Select size" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        <SelectItem value="1-50">1-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                                        <SelectItem value="1000+">1,000+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seats" className="text-zinc-300">Expected CRM Seats</Label>
                            <Input id="seats" name="seats" type="number" min="1" placeholder="e.g. 150" className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-primary/50" />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-zinc-300">Primary Interests</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {["Synthesis Layer", "Voice Agents", "Sales Campaigns", "Quests", "Custom Roles (RBAC)", "Custom Integrations"].map((interest) => (
                                    <label key={interest} className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800/50 p-2 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors">
                                        <input type="checkbox" name="interest" value={interest} className="rounded border-zinc-700 text-primary focus:ring-primary/50 bg-zinc-950" />
                                        <span>{interest}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comments" className="text-zinc-300">Additional Details / Goals</Label>
                            <Textarea id="comments" name="comments" placeholder="Tell us about your current stack, pain points, or specific compliance needs (e.g., SOC2, HIPAA)..." className="resize-none h-24 bg-zinc-900/50 border-zinc-800 focus-visible:ring-primary/50" />
                        </div>

                        {process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
                            <div className="flex justify-center pt-2">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                                    onSuccess={(token) => setTurnstileToken(token)}
                                    options={{ theme: 'dark' }}
                                />
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold flex items-center justify-center gap-2 group">
                            {isSubmitting ? "Submitting..." : (
                                <>
                                    Request Enterprise Access
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
