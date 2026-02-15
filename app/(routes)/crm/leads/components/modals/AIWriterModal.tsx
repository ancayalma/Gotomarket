"use client";

import { useState } from "react";
import { Sparkles, X, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

type AIWriterModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string) => void;
    initialPrompt?: string;
    context?: string;
};

export default function AIWriterModal({ isOpen, onClose, onInsert, initialPrompt = "", context = "content" }: AIWriterModalProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setResult(""); // Clear previous result

        try {
            const res = await fetch("/api/ai/generate-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, context }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data.text || "No content generated.");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate text");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-semibold text-foreground">AI Writer</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                            What should I write?
                        </label>
                        <textarea
                            className="w-full h-24 rounded-lg bg-background border border-input p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                            placeholder="e.g. Write a friendly follow-up email to a lead who hasn't responded in 3 days..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/10"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? "Generating..." : "Generate Draft"}
                    </button>

                    {/* Result Area */}
                    {result && (
                        <div className="mt-4 space-y-3 animate-in slide-in-from-bottom-2">
                            <div className="rounded-lg border bg-muted/30 p-4 relative group">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleGenerate}
                                        className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground"
                                        title="Regenerate"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{result}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 rounded-lg border border-input hover:bg-muted/50 text-sm font-medium transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => {
                                        onInsert(result);
                                        onClose();
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Check className="w-4 h-4" /> Insert
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
