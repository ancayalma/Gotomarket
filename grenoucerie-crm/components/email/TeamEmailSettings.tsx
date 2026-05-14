"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Loader2, Mail, CheckCircle2, AlertCircle, ShieldCheck, Globe, Copy, Send, Inbox, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmailProvider = "PLATFORM_SES" | "AWS_SES" | "RESEND" | "SENDGRID" | "MAILGUN" | "POSTMARK" | "SMTP" | "GOOGLE_GMAIL";
type EmailPurpose = "GENERAL" | "OUTREACH" | "INBOUND";

interface EmailConfig {
    id: string;
    purpose: EmailPurpose;
    provider: EmailProvider;
    from_email: string;
    from_name?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    aws_region?: string;
    resend_api_key?: string;
    sendgrid_api_key?: string;
    mailgun_api_key?: string;
    mailgun_domain?: string;
    mailgun_region?: string;
    postmark_api_token?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    verification_status: "PENDING" | "VERIFIED" | "FAILED" | "NOT_STARTED";
}

interface TeamEmailSettingsProps {
    teamId: string;
    planSlug?: string;
}

const PURPOSE_META: Record<EmailPurpose, { label: string; description: string; icon: React.ReactNode; color: string }> = {
    GENERAL: {
        label: "General",
        description: "Invoices, quotes, feedback, workflow notifications, and system emails.",
        icon: <Mail className="w-4 h-4" />,
        color: "text-primary",
    },
    OUTREACH: {
        label: "Outreach",
        description: "Sales outreach, campaigns, and automated prospecting emails.",
        icon: <Megaphone className="w-4 h-4" />,
        color: "text-orange-500",
    },
    INBOUND: {
        label: "Inbound",
        description: "Form submission notifications, auto-replies, and inbound lead responses.",
        icon: <Inbox className="w-4 h-4" />,
        color: "text-emerald-500",
    },
};

// ─── Per-Purpose Config Form ───────────────────────────────────────────────
function PurposeConfigForm({
    teamId,
    purpose,
    config,
    planSlug,
    onRefresh,
}: {
    teamId: string;
    purpose: EmailPurpose;
    config: EmailConfig | null;
    planSlug?: string;
    onRefresh: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const meta = PURPOSE_META[purpose];

    // Form state
    const [provider, setProvider] = useState<EmailProvider>(config?.provider || "PLATFORM_SES");
    const [emailInput, setEmailInput] = useState(config?.from_email || "");
    const [nameInput, setNameInput] = useState(config?.from_name || "");

    // AWS
    const [awsAccessKey, setAwsAccessKey] = useState("");
    const [awsSecretKey, setAwsSecretKey] = useState("");
    const [awsRegion, setAwsRegion] = useState(config?.aws_region || "us-east-1");

    // Resend
    const [resendApiKey, setResendApiKey] = useState("");

    // SendGrid
    const [sendgridApiKey, setSendgridApiKey] = useState("");

    // Mailgun
    const [mailgunApiKey, setMailgunApiKey] = useState("");
    const [mailgunDomain, setMailgunDomain] = useState(config?.mailgun_domain || "");
    const [mailgunRegion, setMailgunRegion] = useState(config?.mailgun_region || "us");

    // Postmark
    const [postmarkApiToken, setPostmarkApiToken] = useState("");

    // SMTP
    const [smtpHost, setSmtpHost] = useState(config?.smtp_host || "");
    const [smtpPort, setSmtpPort] = useState(config?.smtp_port ? String(config.smtp_port) : "587");
    const [smtpUser, setSmtpUser] = useState(config?.smtp_user || "");
    const [smtpPassword, setSmtpPassword] = useState("");

    // Test
    const [testEmail, setTestEmail] = useState("");

    // Modal
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

    // Domain (GENERAL only)
    const [domainInput, setDomainInput] = useState("");
    const [domainStatus, setDomainStatus] = useState<string | null>(null);
    const [domainDkimTokens, setDomainDkimTokens] = useState<string[]>([]);
    const [domainLoading, setDomainLoading] = useState(false);

    // Domain verification is a core deliverability requirement for AWS SES, so we allow it for all plans
    const isDomainEligible = purpose === "GENERAL";

    // Sync config into form when config changes
    useEffect(() => {
        if (config) {
            setProvider(config.provider || "PLATFORM_SES");
            setEmailInput(config.from_email || "");
            setNameInput(config.from_name || "");
            setAwsRegion(config.aws_region || "us-east-1");
            setMailgunDomain(config.mailgun_domain || "");
            setMailgunRegion(config.mailgun_region || "us");
            setSmtpHost(config.smtp_host || "");
            setSmtpPort(config.smtp_port ? String(config.smtp_port) : "587");
            setSmtpUser(config.smtp_user || "");
        }
    }, [config]);

    const fetchDomainInfo = useCallback(async () => {
        if (!isDomainEligible) return;
        setDomainLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config/domain`);
            if (res.ok) {
                const data = await res.json();
                if (data.domain) {
                    setDomainInput(data.domain);
                    setDomainStatus(data.status);
                    setDomainDkimTokens(data.dkimTokens || []);
                    if (data.status === "VERIFIED") {
                        toast.success("Domain verified successfully!");
                    }
                }
            }
        } catch { /* ignore */ }
        finally {
            setDomainLoading(false);
        }
    }, [teamId, isDomainEligible]);

    // Fetch domain info for GENERAL purpose
    useEffect(() => {
        fetchDomainInfo();
    }, [fetchDomainInfo]);

    const handleSave = async () => {
        if (!emailInput || !emailInput.includes("@")) {
            toast.error("Valid email address is required");
            return;
        }

        // Provider-specific validation
        if (provider === "AWS_SES" && !config && (!awsAccessKey || !awsSecretKey)) {
            toast.error("AWS Credentials are required for new setup"); return;
        }
        if (provider === "RESEND" && !config && !resendApiKey) {
            toast.error("Resend API Key is required"); return;
        }
        if (provider === "SENDGRID" && !config && !sendgridApiKey) {
            toast.error("SendGrid API Key is required"); return;
        }
        if (provider === "MAILGUN" && !config && (!mailgunApiKey || !mailgunDomain)) {
            toast.error("Mailgun API Key and Domain are required"); return;
        }
        if (provider === "POSTMARK" && !config && !postmarkApiToken) {
            toast.error("Postmark API Token is required"); return;
        }
        if (provider === "SMTP" && !config && (!smtpHost || !smtpPort || !smtpUser || !smtpPassword)) {
            toast.error("All SMTP fields are required"); return;
        }

        setLoading(true);
        try {
            const payload = {
                purpose,
                provider,
                from_email: emailInput,
                from_name: nameInput,
                ...(awsAccessKey && { aws_access_key_id: awsAccessKey }),
                ...(awsSecretKey && { aws_secret_access_key: awsSecretKey }),
                ...(awsRegion && { aws_region: awsRegion }),
                ...(resendApiKey && { resend_api_key: resendApiKey }),
                ...(sendgridApiKey && { sendgrid_api_key: sendgridApiKey }),
                ...(mailgunApiKey && { mailgun_api_key: mailgunApiKey }),
                mailgun_domain: mailgunDomain,
                mailgun_region: mailgunRegion,
                ...(postmarkApiToken && { postmark_api_token: postmarkApiToken }),
                smtp_host: smtpHost,
                smtp_port: parseInt(smtpPort),
                smtp_user: smtpUser,
                ...(smtpPassword && { smtp_password: smtpPassword }),
            };

            const res = await fetch(`/api/teams/${teamId}/email-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save configuration");
            }

            // Clear secrets
            setAwsAccessKey(""); setAwsSecretKey(""); setResendApiKey("");
            setSendgridApiKey(""); setMailgunApiKey(""); setPostmarkApiToken(""); setSmtpPassword("");

            toast.success(provider === "AWS_SES" || provider === "PLATFORM_SES"
                ? "Configuration saved. Check inbox for verification link."
                : "Configuration saved successfully.");
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config?purpose=${purpose}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove config");
            setEmailInput(""); setNameInput("");
            toast.success(`${meta.label} email configuration removed.`);
            onRefresh();
        } catch {
            toast.error("Failed to remove configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: testEmail, purpose }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to send test email");
            }
            toast.success("Test email sent!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send test email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Purpose Description */}
            <div className={cn("flex items-center gap-2 p-3 rounded-lg border bg-muted/30")}>
                <span className={meta.color}>{meta.icon}</span>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
                {!config && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                        {purpose === "GENERAL" ? "Required" : "Falls back to General if not set"}
                    </Badge>
                )}
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={provider} onValueChange={(val) => setProvider(val as EmailProvider)} disabled={loading}>
                    <SelectTrigger><SelectValue placeholder="Select Provider" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PLATFORM_SES">BasaltCRM Email (Recommended)</SelectItem>
                        <SelectItem value="AWS_SES">AWS SES (Bring Your Own)</SelectItem>
                        <SelectItem value="RESEND">Resend.com</SelectItem>
                        <SelectItem value="SENDGRID">Twilio SendGrid</SelectItem>
                        <SelectItem value="MAILGUN">Mailgun</SelectItem>
                        <SelectItem value="POSTMARK">Postmark</SelectItem>
                        <SelectItem value="SMTP">Custom SMTP</SelectItem>
                        <SelectItem value="GOOGLE_GMAIL">Google Gmail (OAuth)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Common Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Sender Name (Optional)</Label>
                    <Input placeholder="Acme Sales Team" value={nameInput} onChange={(e) => setNameInput(e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                    <Label>Sender Email Address</Label>
                    <Input placeholder="sales@yourcompany.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={loading} />
                </div>
            </div>

            {/* Provider-Specific Settings */}
            {provider === "PLATFORM_SES" && (
                <div className="space-y-3 p-4 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">Platform Email Service</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Uses <strong>BasaltCRM&apos;s managed infrastructure</strong>. Enter your email, save, then verify via the link sent to your inbox.
                    </p>
                </div>
            )}

            {provider === "AWS_SES" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-medium">AWS Credentials</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Access Key ID</Label>
                            <Input type="password" placeholder={config?.aws_access_key_id ? "••••••••" : "AKI..."} value={awsAccessKey} onChange={(e) => setAwsAccessKey(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label>AWS Region</Label>
                            <Select value={awsRegion} onValueChange={setAwsRegion} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                                    <SelectItem value="us-east-2">US East (Ohio)</SelectItem>
                                    <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                                    <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                                    <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                                    <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                    <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Secret Access Key</Label>
                            <Input type="password" placeholder={config?.aws_secret_access_key ? "••••••••" : "Secret..."} value={awsSecretKey} onChange={(e) => setAwsSecretKey(e.target.value)} disabled={loading} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">IAM user needs `ses:SendEmail` and `ses:VerifyEmailIdentity` permissions.</p>
                </div>
            )}

            {provider === "RESEND" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /><h4 className="text-sm font-medium">Resend Configuration</h4></div>
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder={config?.resend_api_key ? "re_••••••••" : "re_123..."} value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} disabled={loading} />
                    </div>
                </div>
            )}

            {provider === "SENDGRID" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /><h4 className="text-sm font-medium">SendGrid Configuration</h4></div>
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder={config?.sendgrid_api_key ? "SG.••••••••" : "SG..."} value={sendgridApiKey} onChange={(e) => setSendgridApiKey(e.target.value)} disabled={loading} />
                    </div>
                </div>
            )}

            {provider === "MAILGUN" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-red-500" /><h4 className="text-sm font-medium">Mailgun Configuration</h4></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label>API Key</Label>
                            <Input type="password" placeholder={config?.mailgun_api_key ? "key-••••••••" : "key-..."} value={mailgunApiKey} onChange={(e) => setMailgunApiKey(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label>Domain</Label>
                            <Input placeholder="mg.yourdomain.com" value={mailgunDomain} onChange={(e) => setMailgunDomain(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Select value={mailgunRegion} onValueChange={setMailgunRegion} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="us">US</SelectItem>
                                    <SelectItem value="eu">EU</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {provider === "POSTMARK" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-yellow-500" /><h4 className="text-sm font-medium">Postmark Configuration</h4></div>
                    <div className="space-y-2">
                        <Label>Server API Token</Label>
                        <Input type="password" placeholder={config?.postmark_api_token ? "••••-••••" : "token..."} value={postmarkApiToken} onChange={(e) => setPostmarkApiToken(e.target.value)} disabled={loading} />
                    </div>
                </div>
            )}

            {provider === "SMTP" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /><h4 className="text-sm font-medium">Custom SMTP</h4></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Host</Label><Input placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} disabled={loading} /></div>
                        <div className="space-y-2"><Label>Port</Label><Input placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} disabled={loading} /></div>
                        <div className="space-y-2"><Label>Username</Label><Input placeholder="user@example.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} disabled={loading} /></div>
                        <div className="space-y-2"><Label>Password</Label><Input type="password" placeholder={config?.smtp_password ? "••••••••" : "password"} value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} disabled={loading} /></div>
                    </div>
                </div>
            )}

            {provider === "GOOGLE_GMAIL" && (
                <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /><h4 className="text-sm font-medium">Google OAuth</h4></div>
                    <p className="text-sm text-muted-foreground">Uses your connected Google Account. Ensure the sender email matches your connected Gmail.</p>
                </div>
            )}

            {/* Domain Verification (GENERAL only) */}
            {isDomainEligible && (
                <div className="space-y-4 p-4 border rounded-lg bg-indigo-500/5 border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-sm font-semibold">Custom Domain Verification</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Verify your domain to send from <strong>any address</strong> under it.
                    </p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="yourdomain.com"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            disabled={domainLoading || domainStatus === "VERIFIED"}
                            className="max-w-xs"
                        />
                        {!domainStatus || domainStatus === "FAILED" ? (
                            <Button
                                variant="outline"
                                className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                                disabled={domainLoading || !domainInput}
                                onClick={async () => {
                                    if (!domainInput.includes(".")) { toast.error("Enter a valid domain"); return; }
                                    setDomainLoading(true);
                                    try {
                                        const res = await fetch(`/api/teams/${teamId}/email-config/domain`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ domain: domainInput })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error);
                                        setDomainStatus(data.status);
                                        toast.success(data.message || "Domain verification requested!");
                                    } catch (err: any) {
                                        toast.error(err.message || "Failed");
                                    } finally {
                                        setDomainLoading(false);
                                    }
                                }}
                            >
                                {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-1" />}
                                Request Verification
                            </Button>
                        ) : domainStatus === "PENDING_APPROVAL" ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending Admin Review</Badge>
                        ) : domainStatus === "DNS_PENDING" ? (
                            <div className="flex items-center gap-2">
                                <Badge className="h-9 px-3 bg-amber-500/20 text-amber-400 border-amber-500/30">Action Required: Add DNS</Badge>
                                <Button variant="outline" size="sm" onClick={fetchDomainInfo} disabled={domainLoading} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                                    {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Status"}
                                </Button>
                            </div>
                        ) : domainStatus === "VERIFIED" ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>
                        ) : null}
                    </div>

                    {domainStatus === "DNS_PENDING" && domainDkimTokens.length > 0 && (
                        <div className="mt-3 p-3 bg-white/5 border border-blue-500/10 rounded-md">
                            <p className="text-xs font-semibold text-blue-400 mb-2">DNS Records:</p>
                            <div className="space-y-2">
                                {domainDkimTokens.map((token, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/30 p-3 rounded border border-white/5">
                                        <div className="flex items-center gap-2 w-20 shrink-0">
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-white/10">CNAME</Badge>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-10">Name:</span>
                                                <code className="text-xs text-blue-300 truncate flex-1">{token}._domainkey.{domainInput}</code>
                                                <button className="text-muted-foreground hover:text-white shrink-0 p-1 bg-white/5 rounded" onClick={() => { navigator.clipboard.writeText(`${token}._domainkey.${domainInput}`); toast.success("Copied Name!"); }}>
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-10">Value:</span>
                                                <code className="text-xs text-green-300 truncate flex-1">{token}.dkim.amazonses.com</code>
                                                <button className="text-muted-foreground hover:text-white shrink-0 p-1 bg-white/5 rounded" onClick={() => { navigator.clipboard.writeText(`${token}.dkim.amazonses.com`); toast.success("Copied Value!"); }}>
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Actions & Status */}
            <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Configuration
                    </Button>

                    {config && (
                        <>
                            <Button
                                variant="outline"
                                className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 font-semibold"
                                onClick={() => setIsRemoveDialogOpen(true)}
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                            </Button>

                            <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                                <AlertDialogContent className="bg-[#0B1120] border-white/10 shadow-2xl">
                                    <AlertDialogHeader>
                                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                                            <AlertCircle className="w-6 h-6 text-rose-500" />
                                        </div>
                                        <AlertDialogTitle className="text-xl font-bold text-center text-white">
                                            Remove {meta.label} Email Config?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription asChild className="text-center text-slate-400 font-medium pt-2">
                                            <div>
                                                This will disconnect the <span className="text-white font-bold">{config.provider}</span> integration for <span className="text-white font-bold">{meta.label}</span> emails.
                                                {purpose !== "GENERAL" && (
                                                    <p className="mt-2 text-xs text-amber-400">Emails will fall back to the General configuration.</p>
                                                )}
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="pt-6 sm:justify-center gap-3">
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white w-28">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemove} className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg w-32">
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>

                {config?.verification_status === "VERIFIED" && (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-primary/5">
                        <div className="flex-1 space-y-1">
                            <Label>Send Test Email</Label>
                            <div className="flex gap-2">
                                <Input placeholder="test@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} disabled={loading} />
                                <Button variant="outline" onClick={handleSendTest} disabled={loading || !testEmail}>
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send Test
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Status Banner */}
            {config && (
                <div className={cn(
                    "p-3 rounded-md border flex items-center gap-3",
                    config.verification_status === "VERIFIED" ? "bg-green-500/10 border-green-500/20" :
                        config.verification_status === "PENDING" ? "bg-amber-500/10 border-amber-500/20" :
                            "bg-red-500/10 border-red-500/20"
                )}>
                    {config.verification_status === "VERIFIED" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {config.verification_status === "PENDING" && <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                    {config.verification_status === "FAILED" && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <div className="flex-1">
                        <p className="text-sm font-medium">Status: {config.verification_status} ({config.provider})</p>
                        {config.verification_status === "PENDING" && (config.provider === "AWS_SES" || config.provider === "PLATFORM_SES") && (
                            <p className="text-xs text-muted-foreground">Check your inbox at <strong>{config.from_email}</strong> for the verification link.</p>
                        )}
                    </div>
                    {config.verification_status === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>Check Status</Button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Reply Domain Panel ────────────────────────────────────────────────────
function ReplyDomainPanel({ teamId }: { teamId: string }) {
    const [domain, setDomain] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [mxRecord, setMxRecord] = useState<{ type: string; name: string; value: string; priority: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    // Fetch existing reply domain config
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/email-config/reply-domain`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.domain) {
                        setDomain(data.domain);
                        setStatus(data.status);
                        setMxRecord(data.mxRecord || null);
                    }
                }
            } catch { /* ignore */ }
            setFetched(true);
        })();
    }, [teamId]);

    const handleSetup = async () => {
        if (!domain || !domain.includes(".")) {
            toast.error("Enter a valid reply domain (e.g. reply.yourcompany.com)");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config/reply-domain`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus(data.status);
            setMxRecord(data.mxRecord || null);
            toast.success(data.message || "Reply domain configured!");
        } catch (err: any) {
            toast.error(err.message || "Failed to set up reply domain");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config/reply-domain`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove");
            setDomain("");
            setStatus(null);
            setMxRecord(null);
            toast.success("Reply domain removed.");
        } catch (err: any) {
            toast.error(err.message || "Failed to remove reply domain");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config/reply-domain`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                setMxRecord(data.mxRecord || null);
                if (data.status === "VERIFIED") {
                    toast.success("Reply domain verified!");
                } else {
                    toast("Domain not yet verified. Ensure MX record is configured.", { icon: "⏳" });
                }
            }
        } catch { /* ignore */ }
        setLoading(false);
    };

    if (!fetched) return null;

    return (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Custom Reply Domain
                </CardTitle>
                <CardDescription className="text-xs">
                    Route campaign reply-to addresses through your own branded subdomain instead of the platform default.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-xs">Reply Domain</Label>
                        <Input
                            placeholder="reply.yourcompany.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            disabled={loading || status === "VERIFIED"}
                            className="bg-black/20 border-white/10"
                        />
                    </div>
                    {!status ? (
                        <Button
                            onClick={handleSetup}
                            disabled={loading || !domain}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
                            Set Up
                        </Button>
                    ) : status === "VERIFIED" ? (
                        <Badge className="h-9 px-3 bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                    ) : (
                        <Button variant="outline" onClick={handleCheckStatus} disabled={loading} className="border-cyan-500/30 text-cyan-400">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Status"}
                        </Button>
                    )}
                </div>

                {/* MX Record Instructions */}
                {mxRecord && status !== "VERIFIED" && (
                    <div className="p-3 rounded-md bg-blue-500/5 border border-blue-500/15 space-y-2">
                        <p className="text-xs font-semibold text-blue-400">Add this MX record to your DNS:</p>
                        <div className="flex items-center gap-2 text-[11px] font-mono bg-black/30 p-2 rounded">
                            <span className="text-muted-foreground">MX</span>
                            <span className="text-blue-300">{mxRecord.name}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-green-300">{mxRecord.value}</span>
                            <span className="text-amber-300 ml-1">Priority: {mxRecord.priority}</span>
                            <button
                                className="ml-auto text-muted-foreground hover:text-white"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${mxRecord.name} MX ${mxRecord.priority} ${mxRecord.value}`);
                                    toast.success("Copied!");
                                }}
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Verified state with remove option */}
                {status === "VERIFIED" && (
                    <div className="flex items-center justify-between p-3 rounded-md bg-green-500/5 border border-green-500/15">
                        <p className="text-xs text-green-400">
                            Outreach replies will be routed through <strong>{domain}</strong>
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                            onClick={handleRemove}
                            disabled={loading}
                        >
                            Remove
                        </Button>
                    </div>
                )}

                {status === "PENDING_MX" && (
                    <p className="text-[11px] text-amber-400/80">
                        ⏳ Waiting for MX record to propagate. This can take up to 72 hours. Click &quot;Check Status&quot; to verify.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function TeamEmailSettings({ teamId, planSlug, title }: TeamEmailSettingsProps & { title?: string }) {
    const [configs, setConfigs] = useState<Record<EmailPurpose, EmailConfig | null>>({
        GENERAL: null,
        OUTREACH: null,
        INBOUND: null,
    });
    const [activeTab, setActiveTab] = useState<EmailPurpose>("GENERAL");

    const fetchAllConfigs = useCallback(async () => {
        if (!teamId) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`);
            if (res.ok) {
                const data: EmailConfig[] = await res.json();
                const mapped: Record<EmailPurpose, EmailConfig | null> = { GENERAL: null, OUTREACH: null, INBOUND: null };
                if (Array.isArray(data)) {
                    for (const c of data) {
                        const p = (c.purpose || "GENERAL") as EmailPurpose;
                        if (mapped.hasOwnProperty(p)) mapped[p] = c;
                    }
                }
                setConfigs(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch email configs", error);
        }
    }, [teamId]);

    useEffect(() => { fetchAllConfigs(); }, [fetchAllConfigs]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                    <Mail className="w-5 h-5 text-primary" />
                    {title || "Company Email Settings"}
                </CardTitle>
                <CardDescription>
                    Configure separate email identities for different purposes. Outreach and Inbound fall back to General if not configured.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmailPurpose)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        {(["GENERAL", "OUTREACH", "INBOUND"] as EmailPurpose[]).map((p) => {
                            const meta = PURPOSE_META[p];
                            const hasConfig = !!configs[p];
                            return (
                                <TabsTrigger key={p} value={p} className="flex items-center gap-2">
                                    <span className={meta.color}>{meta.icon}</span>
                                    {meta.label}
                                    {hasConfig ? (
                                        <span className="w-2 h-2 rounded-full bg-green-500 ml-1" />
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30 ml-1" />
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {(["GENERAL", "OUTREACH", "INBOUND"] as EmailPurpose[]).map((p) => (
                        <TabsContent key={p} value={p}>
                            <div className="space-y-6">
                                <PurposeConfigForm
                                    teamId={teamId}
                                    purpose={p}
                                    config={configs[p]}
                                    planSlug={planSlug}
                                    onRefresh={fetchAllConfigs}
                                />
                                {p === "INBOUND" && (
                                    <ReplyDomainPanel teamId={teamId} />
                                )}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

