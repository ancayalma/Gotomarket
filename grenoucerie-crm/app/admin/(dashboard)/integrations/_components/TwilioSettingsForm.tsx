"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, Phone } from "lucide-react";
import { saveIntegrationSettings } from "@/actions/admin/save-integration-settings";
import { useRouter } from "next/navigation";

interface Props {
    initialData: any;
}

export const TwilioSettingsForm = ({ initialData }: Props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [enabled, setEnabled] = useState(initialData?.twilio_enabled || false);
    const [accountSid, setAccountSid] = useState(initialData?.twilio_account_sid || "");
    const [authToken, setAuthToken] = useState(initialData?.twilio_auth_token || "");
    const [phoneNumber, setPhoneNumber] = useState(initialData?.twilio_phone_number || "");
    const [agentName, setAgentName] = useState(initialData?.voice_agent_name || "");
    const [elApiKey, setElApiKey] = useState(initialData?.elevenlabs_api_key || "");
    const [elAgentId, setElAgentId] = useState(initialData?.elevenlabs_agent_id || "");
    const [tokenVisible, setTokenVisible] = useState(false);
    const [elKeyVisible, setElKeyVisible] = useState(false);

    const onSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (enabled) formData.append("twilio_enabled", "on");
        formData.append("twilio_account_sid", accountSid);
        formData.append("twilio_auth_token", authToken);
        formData.append("twilio_phone_number", phoneNumber);
        formData.append("voice_agent_name", agentName);
        formData.append("elevenlabs_api_key", elApiKey);
        formData.append("elevenlabs_agent_id", elAgentId);

        const result = await saveIntegrationSettings(formData);

        if (result?.success) {
            toast.success("Twilio settings saved!");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to save.");
        }
        setLoading(false);
    };

    return (
        <Card className="border border-red-500/20 bg-red-500/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent tracking-tight uppercase leading-relaxed py-2 px-2 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-red-500" />
                        Twilio Voice
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Outbound dialing via Twilio + ElevenLabs AI agents.
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="twilio-mode" checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                {enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-2">
                            <Label htmlFor="twilio-sid">Account SID</Label>
                            <Input
                                id="twilio-sid"
                                type="text"
                                value={accountSid}
                                onChange={(e) => setAccountSid(e.target.value)}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="bg-background/50 border-red-500/20 font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="twilio-token">Auth Token</Label>
                            <div className="relative">
                                <Input
                                    id="twilio-token"
                                    type={tokenVisible ? "text" : "password"}
                                    value={authToken}
                                    onChange={(e) => setAuthToken(e.target.value)}
                                    placeholder="Your Twilio Auth Token"
                                    className="bg-background/50 border-red-500/20 font-mono text-sm pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setTokenVisible(!tokenVisible)}
                                >
                                    {tokenVisible ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="twilio-phone">Phone Number (E.164)</Label>
                            <Input
                                id="twilio-phone"
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+18444848234"
                                className="bg-background/50 border-red-500/20 font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="voice-agent-name">AI Agent Name</Label>
                            <Input
                                id="voice-agent-name"
                                type="text"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                placeholder="e.g., Sarah, Alex, Jordan"
                                className="bg-background/50 border-red-500/20 text-sm"
                            />
                            <p className="text-[10px] text-muted-foreground/60">Name the AI uses to introduce itself on calls.</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                            Import this number in the ElevenLabs dashboard under Phone Numbers → Twilio, then assign your AI agent to it. 
                            ElevenLabs will auto-configure the Twilio webhooks.
                        </p>

                        {/* Self-service ElevenLabs section */}
                        <div className="mt-3 pt-3 border-t border-red-500/10 space-y-3">
                            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Custom ElevenLabs Agent (Optional)</p>
                            <p className="text-[10px] text-muted-foreground/60">Bring your own ElevenLabs API key and agent to override the platform default.</p>
                            <div className="grid gap-2">
                                <Label htmlFor="el-api-key">ElevenLabs API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="el-api-key"
                                        type={elKeyVisible ? "text" : "password"}
                                        value={elApiKey}
                                        onChange={(e) => setElApiKey(e.target.value)}
                                        placeholder="sk_xxxxxxxx (leave blank to use platform key)"
                                        className="bg-background/50 border-red-500/20 font-mono text-xs pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setElKeyVisible(!elKeyVisible)}
                                    >
                                        {elKeyVisible ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="el-agent-id">ElevenLabs Agent ID</Label>
                                <Input
                                    id="el-agent-id"
                                    type="text"
                                    value={elAgentId}
                                    onChange={(e) => setElAgentId(e.target.value)}
                                    placeholder="agent_xxxxx (leave blank to use platform agent)"
                                    className="bg-background/50 border-red-500/20 font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://console.twilio.com", "_blank")}
                        className="border-red-500/20 hover:bg-red-500/10 text-xs py-1 h-8"
                    >
                        Twilio Console
                        <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 h-8 font-semibold"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
