"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, Fingerprint, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { startRegistration } from "@simplewebauthn/browser";

interface MfaSettingsProps {
    user: any;
}

export function MfaSettings({ user }: MfaSettingsProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [mfaData, setMfaData] = useState<any>(null);
    const [setupStep, setSetupStep] = useState<"idle" | "totp" | "sms" | "webauthn">("idle");
    const [totpCode, setTotpCode] = useState("");
    const [isMfaEnabled, setIsMfaEnabled] = useState(user.mfaEnabled);

    const fetchMfaSetup = async (type: string) => {
        setLoading(true);
        try {
            if (type === "totp") {
                const res = await axios.get("/api/user/mfa/setup");
                setMfaData(res.data);
                setSetupStep("totp");
            } else if (type === "webauthn") {
                const res = await axios.get("/api/user/mfa/webauthn/register-options");
                const options = res.data;
                const attResp = await startRegistration(options);
                await axios.post("/api/user/mfa/webauthn/register-verify", {
                    body: attResp,
                    currentOptions: options
                });
                toast({ title: "Success", description: "Biometric authentication registered successfully." });
                setIsMfaEnabled(true);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.error || "Failed to initiate MFA setup."
            });
        } finally {
            setLoading(false);
        }
    };

    const verifyTotp = async () => {
        if (totpCode.length !== 6) return;
        setLoading(true);
        try {
            await axios.post("/api/user/mfa/verify", {
                code: totpCode,
                secret: mfaData.secret
            });
            toast({ title: "MFA Enabled", description: "TOTP Authentication is now active." });
            setIsMfaEnabled(true);
            setSetupStep("idle");
            setTotpCode("");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Invalid Code",
                description: "The verification code is incorrect. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    const disableMfa = async () => {
        setLoading(true);
        try {
            await axios.post("/api/user/mfa/disable");
            toast({ title: "MFA Disabled", description: "Your account is now less secure." });
            setIsMfaEnabled(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to disable MFA." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-primary/10 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-primary/5 bg-primary/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Multi-Factor Authentication</CardTitle>
                            <CardDescription>Secure your account with NIST-compliant authentication factors.</CardDescription>
                        </div>
                    </div>
                    {isMfaEnabled ? (
                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Protected
                        </div>
                    ) : (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unprotected
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {setupStep === "idle" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TOTP Option */}
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Smartphone className="h-6 w-6 text-blue-400" />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchMfaSetup("totp")}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setup App"}
                                </Button>
                            </div>
                            <h4 className="font-bold text-lg mb-1">Authenticator App</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Use a mobile app like Google Authenticator, Authy, or Microsoft Authenticator to generate 6-digit codes.
                            </p>
                        </div>

                        {/* WebAuthn Option */}
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Fingerprint className="h-6 w-6 text-emerald-400" />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchMfaSetup("webauthn")}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
                                </Button>
                            </div>
                            <h4 className="font-bold text-lg mb-1">Biometrics / Passkey</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Use your device's fingerprint, face ID, or hardware security key for the fastest and most secure login.
                            </p>
                        </div>
                    </div>
                ) : setupStep === "totp" ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
                        <div className="mb-6 relative">
                            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                            <img src={mfaData?.qrCode} alt="Security QR" className="relative h-48 w-48 rounded-xl border-4 border-white inline-block" />
                        </div>

                        <div className="text-center mb-6 max-w-sm">
                            <h4 className="text-lg font-bold mb-2">Scan with Authenticator</h4>
                            <p className="text-sm text-muted-foreground">
                                Scan the QR code above, then enter the 6-digit verification code generated by your app.
                            </p>
                        </div>

                        <div className="w-full max-w-[200px] mb-6">
                            <Input
                                placeholder="000 000"
                                className="text-center text-2xl font-mono tracking-[0.5em] h-12"
                                maxLength={6}
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setSetupStep("idle")}>Cancel</Button>
                            <Button onClick={verifyTotp} disabled={totpCode.length !== 6 || loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Complete Setup
                            </Button>
                        </div>
                    </div>
                ) : null}

                {isMfaEnabled && setupStep === "idle" && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                            <div>
                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest">Danger Zone</h4>
                                <p className="text-xs text-muted-foreground mt-1">Disabling MFA will make your account significantly easier to compromise.</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={disableMfa} disabled={loading}>
                                Disable MFA
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
