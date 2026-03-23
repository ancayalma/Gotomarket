"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, RefreshCw, Save, Sparkles, Loader2 } from "lucide-react";

/**
 * ElevenLabsAgentEditor
 * Admin panel for viewing and editing the ElevenLabs AI agent's
 * system prompt, first message, and voice configuration.
 */
export const ElevenLabsAgentEditor = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fetched, setFetched] = useState(false);

    const [agentName, setAgentName] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [firstMessage, setFirstMessage] = useState("");
    const [voiceId, setVoiceId] = useState("");
    const [stability, setStability] = useState(0.5);
    const [similarityBoost, setSimilarityBoost] = useState(0.75);
    const [speed, setSpeed] = useState(1.0);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/voice/elevenlabs/agent-config");
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to fetch");

            setAgentName(data.name || "");
            setSystemPrompt(data.system_prompt || "");
            setFirstMessage(data.first_message || "");
            setVoiceId(data.voice_id || "");
            setStability(data.stability ?? 0.5);
            setSimilarityBoost(data.similarity_boost ?? 0.75);
            setSpeed(data.speed ?? 1.0);
            setFetched(true);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load agent config");
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    const onSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/voice/elevenlabs/agent-config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: agentName,
                    system_prompt: systemPrompt,
                    first_message: firstMessage,
                    voice_id: voiceId || undefined,
                    stability,
                    similarity_boost: similarityBoost,
                    speed,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Save failed");
            toast.success("Agent configuration updated!");
        } catch (e: any) {
            toast.error(e?.message || "Failed to save");
        }
        setSaving(false);
    };

    const injectPlaceholders = async () => {
        // Ensure the system prompt contains all dynamic variable placeholders
        const requiredVars = [
            "{{agent_name}}", "{{company_name}}", "{{company_context}}",
            "{{lead_first_name}}", "{{lead_last_name}}", "{{business_facts}}",
            "{{campaign_context}}", "{{campaign_instruction}}"
        ];

        const missingInPrompt = requiredVars.filter(v => !systemPrompt.includes(v));
        const missingInFirstMsg = ["{{agent_name}}", "{{lead_first_name}}", "{{company_name}}"]
            .filter(v => !firstMessage.includes(v));

        if (missingInPrompt.length === 0 && missingInFirstMsg.length === 0) {
            toast.info("All dynamic variable placeholders are already present!");
            return;
        }

        // Add missing vars to prompt as a context section
        let updatedPrompt = systemPrompt;
        if (missingInPrompt.length > 0) {
            const contextBlock = `

## Dynamic Context (auto-injected by CRM)
Your name is {{agent_name}}. You are calling on behalf of {{company_name}}.

### About the Company
{{company_context}}

### About the Lead
Name: {{lead_first_name}} {{lead_last_name}}
{{business_facts}}

### Campaign Context
{{campaign_context}}

### Your Objective
{{campaign_instruction}}`;
            updatedPrompt = updatedPrompt + contextBlock;
        }

        let updatedFirst = firstMessage;
        if (missingInFirstMsg.length > 0 && !firstMessage.includes("{{lead_first_name}}")) {
            updatedFirst = `Hi {{lead_first_name}}, this is {{agent_name}} from {{company_name}}. How are you doing today?`;
        }

        setSystemPrompt(updatedPrompt);
        setFirstMessage(updatedFirst);
        toast.success("Dynamic variable placeholders injected — review and save when ready.");
    };

    if (!fetched && loading) {
        return (
            <Card className="border border-violet-500/20 bg-violet-500/5 shadow-none w-full">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-400 mr-2" />
                    <span className="text-sm text-muted-foreground">Loading agent configuration...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-violet-500/20 bg-violet-500/5 shadow-none w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent tracking-tight uppercase leading-relaxed py-2 px-2 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-violet-500" />
                        ElevenLabs AI Agent
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Configure your AI agent's personality, first message, and voice settings.
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchConfig}
                    disabled={loading}
                    className="hover:bg-violet-500/10"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
                {/* Agent Name */}
                <div className="grid gap-2">
                    <Label htmlFor="el-agent-name">Agent Name (ElevenLabs)</Label>
                    <Input
                        id="el-agent-name"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="My Sales Agent"
                        className="bg-background/50 border-violet-500/20 text-sm"
                    />
                </div>

                {/* System Prompt */}
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="el-system-prompt">System Prompt</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={injectPlaceholders}
                            className="h-7 text-[10px] border-violet-500/20 hover:bg-violet-500/10 gap-1"
                        >
                            <Sparkles className="w-3 h-3" />
                            Inject CRM Variables
                        </Button>
                    </div>
                    <Textarea
                        id="el-system-prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="You are a helpful sales assistant..."
                        className="bg-background/50 border-violet-500/20 text-sm min-h-[200px] font-mono text-xs leading-relaxed"
                        rows={12}
                    />
                    <p className="text-[10px] text-muted-foreground/60">
                        Use <code className="text-violet-400">{`{{variable_name}}`}</code> for dynamic variables.
                        Available: agent_name, company_name, company_context, lead_first_name, lead_last_name, business_facts, campaign_context, campaign_instruction.
                    </p>
                </div>

                {/* First Message */}
                <div className="grid gap-2">
                    <Label htmlFor="el-first-message">First Message</Label>
                    <Textarea
                        id="el-first-message"
                        value={firstMessage}
                        onChange={(e) => setFirstMessage(e.target.value)}
                        placeholder="Hi {{lead_first_name}}, this is {{agent_name}} from {{company_name}}..."
                        className="bg-background/50 border-violet-500/20 text-sm min-h-[80px] font-mono text-xs"
                        rows={3}
                    />
                </div>

                {/* Voice Settings */}
                <div className="space-y-3 rounded-md border border-violet-500/10 p-3 bg-background/30">
                    <p className="text-xs font-semibold text-violet-400">Voice Settings</p>
                    <div className="grid gap-2">
                        <Label htmlFor="el-voice-id" className="text-xs">Voice ID</Label>
                        <Input
                            id="el-voice-id"
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                            placeholder="voice ID from ElevenLabs"
                            className="bg-background/50 border-violet-500/20 font-mono text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px]">Stability: {stability.toFixed(2)}</Label>
                            <input
                                type="range"
                                value={stability}
                                min={0} max={1} step={0.05}
                                onChange={(e) => setStability(parseFloat(e.target.value))}
                                className="w-full accent-violet-500 h-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px]">Similarity: {similarityBoost.toFixed(2)}</Label>
                            <input
                                type="range"
                                value={similarityBoost}
                                min={0} max={1} step={0.05}
                                onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                                className="w-full accent-violet-500 h-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px]">Speed: {speed.toFixed(2)}</Label>
                            <input
                                type="range"
                                value={speed}
                                min={0.5} max={2} step={0.05}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full accent-violet-500 h-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-2 pt-2">
                    <Button
                        onClick={onSave}
                        disabled={saving}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 h-8 font-semibold gap-1"
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saving ? "Saving..." : "Save to ElevenLabs"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
