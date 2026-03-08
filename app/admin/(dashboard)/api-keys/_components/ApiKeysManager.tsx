"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Key, Copy, Trash2, Plus, AlertCircle } from "lucide-react";

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    status: string;
    last_used: Date | null;
    createdAt: Date;
}

export function ApiKeysManager({ initialKeys, teamId, hasPlan = true }: { initialKeys: ApiKey[], teamId: string, hasPlan?: boolean }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [showNewKey, setShowNewKey] = useState<string | null>(null);

    const onGenerateKey = async () => {
        if (!hasPlan) {
            toast.error("You must select a plan before generating API keys.");
            return;
        }
        if (!newKeyName.trim()) {
            toast.error("Please provide a name for this API key.");
            return;
        }
        
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            
            if (!response.ok) throw new Error("Failed to generate API Key");
            
            const data = await response.json();
            
            // Show plain text key ONLY ONCE
            setShowNewKey(data.plainTextKey);
            setNewKeyName("");
            toast.success("API Key generated successfully.");
            
            router.refresh();
        } catch (error) {
            toast.error("An error occurred creating the key.");
        } finally {
            setIsLoading(false);
        }
    };

    const onRevokeKey = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this key? This action will break any integrations using it.")) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/api-keys/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error("Failed to revoke API Key");
            
            toast.success("API Key revoked successfully.");
            router.refresh();
        } catch (error) {
            toast.error("An error occurred revoking the key.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="bg-[#18181b] border border-primary/20 rounded-2xl flex flex-col h-full items-start justify-start p-6 space-y-4">
            {showNewKey && (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mb-4 text-emerald-300 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                        <AlertCircle className="w-5 h-5 text-emerald-400" />
                        <p>Store this key securely now. You won't be able to see it again.</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 bg-black/40 p-2 rounded-lg border border-emerald-500/20">
                        <code className="text-emerald-100 font-mono tracking-wider break-all text-sm flex-1 ml-2">
                            {showNewKey}
                        </code>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 hover:bg-emerald-500/20 text-emerald-400"
                            onClick={() => copyToClipboard(showNewKey)}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
                        onClick={() => setShowNewKey(null)}
                    >
                        I have copied this key
                    </Button>
                </div>
            )}

            {!hasPlan ? (
                <div className="w-full bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl mb-6 text-orange-400 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>Plan required. Please select a plan in the billing section to enable API key generation.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row w-full gap-3 mb-6 items-start xl:items-center">
                    <Input 
                        placeholder="E.g., Next.js Headless Production" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-black/40 border-primary/20 flex-1"
                    />
                    <Button 
                        onClick={onGenerateKey} 
                        disabled={isLoading || !newKeyName}
                        className="w-full xl:w-auto bg-primary text-black hover:bg-primary/90 rounded-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Key
                    </Button>
                </div>
            )}

            <div className="w-full space-y-3">
                {initialKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No API keys found for this team.</p>
                ) : (
                    initialKeys.map((key) => (
                        <div key={key.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-black/20 hover:bg-black/40 transition-colors border border-primary/10 rounded-xl space-y-3 md:space-y-0">
                            <div className="flex flex-col gap-1 w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-primary opacity-60" />
                                    <span className="font-semibold">{key.name}</span>
                                    {key.status === "ACTIVE" ? (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 rounded font-medium ml-2">ACTIVE</span>
                                    ) : (
                                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded font-medium ml-2">REVOKED</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono bg-black/40 px-2 py-0.5 rounded w-fit mt-1 border border-white/5">
                                    {key.key_prefix}••••••••••••
                                </div>
                            </div>
                            <div className="flex flex-row items-center justify-between w-full md:w-auto gap-6 md:gap-4">
                                <div className="flex flex-col text-[11px] text-muted-foreground align-right w-full md:w-32 truncate">
                                    <span className="truncate">Created: {format(new Date(key.createdAt), "MMM d, yyyy")}</span>
                                    <span className="truncate">Last Used: {key.last_used ? format(new Date(key.last_used), "MMM d, hh:mm a") : "Never"}</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={key.status !== "ACTIVE" || isLoading}
                                    onClick={() => onRevokeKey(key.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
