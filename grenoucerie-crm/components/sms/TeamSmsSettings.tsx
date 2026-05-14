"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TeamSmsSettingsProps {
    teamId: string;
    planSlug?: string;
}

export function TeamSmsSettings({ teamId, planSlug }: TeamSmsSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Status
    const [brandStatus, setBrandStatus] = useState<string>("NOT_STARTED");
    const [phoneNumber, setPhoneNumber] = useState<string>("");

    // Form fields
    const [brandName, setBrandName] = useState("");
    const [brandEin, setBrandEin] = useState("");
    const [brandWebsite, setBrandWebsite] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [useCase, setUseCase] = useState("ACCOUNT_NOTIFICATION");

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/sms-config`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setBrandName(data.brand_name || "");
                    setBrandEin(data.brand_ein || "");
                    setBrandWebsite(data.brand_website_url || "");
                    setContactEmail(data.brand_contact_email || "");
                    setContactPhone(data.brand_contact_phone || "");
                    setUseCase(data.campaign_use_case || "ACCOUNT_NOTIFICATION");

                    setBrandStatus(data.brand_status || "PENDING");
                    setPhoneNumber(data.phone_number || "");
                }
            }
        } catch (error) {
            console.error("Failed to fetch SMS config", error);
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (!teamId) return;
        fetchConfig();
    }, [teamId, fetchConfig]);

    const handleSave = async () => {
        if (!teamId || !brandName || !brandEin || !brandWebsite || !contactEmail || !contactPhone) {
            toast.error("Please fill out all fields to register your brand.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                brand_name: brandName,
                brand_ein: brandEin,
                brand_website_url: brandWebsite,
                brand_contact_email: contactEmail,
                brand_contact_phone: contactPhone,
                campaign_use_case: useCase,
                brand_status: brandStatus === "NOT_STARTED" ? "PENDING" : brandStatus,
            };

            const res = await fetch(`/api/teams/${teamId}/sms-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to save SMS configuration");
            }

            toast.success("SMS Configuration submitted successfully. Our team will review your 10DLC application.");
            setBrandStatus("PENDING");
        } catch (error: any) {
            toast.error(error.message || "Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent italic tracking-tight uppercase flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-orange-500" />
                            Team SMS Activation
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Provide your company details to activate compliant SMS outreach (10DLC).
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Registration Status</h4>
                                <p className="text-xs text-zinc-400 mt-1">We need this to comply with carrier rules.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {brandStatus === "APPROVED" && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold uppercase">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                                    </Badge>
                                )}
                                {brandStatus === "PENDING" && (
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold uppercase">
                                        <Clock className="w-3 h-3 mr-1" /> Pending Review
                                    </Badge>
                                )}
                                {brandStatus === "NOT_STARTED" && (
                                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-bold uppercase">
                                        Unregistered
                                    </Badge>
                                )}
                                {phoneNumber && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
                                        {phoneNumber}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Legal Business Name</Label>
                                <Input
                                    placeholder="Acme Inc"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax ID (EIN)</Label>
                                <Input
                                    placeholder="12-3456789"
                                    value={brandEin}
                                    onChange={(e) => setBrandEin(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Company Website</Label>
                                <Input
                                    placeholder="https://acme.com"
                                    value={brandWebsite}
                                    onChange={(e) => setBrandWebsite(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Use Case</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={useCase}
                                    onChange={(e) => setUseCase(e.target.value)}
                                >
                                    <option value="ACCOUNT_NOTIFICATION">Account Notifications</option>
                                    <option value="MARKETING">Marketing / Sales Outreach</option>
                                    <option value="CUSTOMER_CARE">Customer Care</option>
                                    <option value="MIXED">Mixed / Multiple Uses</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input
                                    placeholder="admin@acme.com"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Phone</Label>
                                <Input
                                    placeholder="+1234567890"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-zinc-800">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-orange-600 hover:bg-orange-700 font-bold uppercase tracking-wider"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Submit Registration
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

