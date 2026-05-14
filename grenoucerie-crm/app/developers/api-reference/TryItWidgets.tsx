"use client";

import { useState, useCallback } from "react";
import { Play, Copy, Check, Send, ChevronDown, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EndpointDef {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    desc: string;
    tryable?: boolean;
    exampleBody?: Record<string, any>;
}

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    POST: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    PUT: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    DELETE: "bg-red-500/15 text-red-400 border border-red-500/20",
};

// ─── Try It Now Widget ──────────────────────────────────────────────────────

function TryItWidget({ endpoint }: { endpoint: EndpointDef }) {
    const [apiKey, setApiKey] = useState("");
    const [pathValue, setPathValue] = useState("");
    const [bodyJson, setBodyJson] = useState(endpoint.exampleBody ? JSON.stringify(endpoint.exampleBody, null, 2) : "{}");
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusCode, setStatusCode] = useState<number | null>(null);

    const buildUrl = useCallback(() => {
        let url = endpoint.path;
        // Replace bracketed params with user input
        if (pathValue) {
            url = url.replace(/\[[^\]]+\]/, pathValue);
        }
        return url;
    }, [endpoint.path, pathValue]);

    const handleExecute = async () => {
        if (!apiKey) return;
        setIsLoading(true);
        setResponse(null);
        setStatusCode(null);

        try {
            const url = buildUrl();
            const opts: RequestInit = {
                method: endpoint.method,
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            };

            if (["POST", "PUT"].includes(endpoint.method)) {
                opts.body = bodyJson;
            }

            const res = await fetch(url, opts);
            setStatusCode(res.status);
            const data = await res.json();
            setResponse(JSON.stringify(data, null, 2));
        } catch (err: any) {
            setResponse(JSON.stringify({ error: err.message }, null, 2));
            setStatusCode(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        const curlCmd = `curl -H "Authorization: Bearer ${apiKey || 'sk_live_...'}" ${endpoint.method === "GET" ? "" : `-X ${endpoint.method} `}${endpoint.exampleBody ? `-d '${JSON.stringify(endpoint.exampleBody)}' -H "Content-Type: application/json" ` : ""}${window.location.origin}${buildUrl()}`;
        navigator.clipboard.writeText(curlCmd);
    };

    const hasPathParam = /\[/.test(endpoint.path);

    return (
        <div className="mt-3 space-y-3 border border-white/5 rounded-xl p-4 bg-black/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">API Key</label>
                    <input
                        type="password"
                        placeholder="sk_live_..."
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 mt-1 font-mono text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    />
                </div>
                {hasPathParam && (
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ID Parameter</label>
                        <input
                            placeholder="e.g. 60a7b3f8e1b..."
                            value={pathValue}
                            onChange={e => setPathValue(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 mt-1 font-mono text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                        />
                    </div>
                )}
            </div>

            {["POST", "PUT"].includes(endpoint.method) && (
                <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Request Body (JSON)</label>
                    <textarea
                        value={bodyJson}
                        onChange={e => setBodyJson(e.target.value)}
                        rows={4}
                        className="w-full mt-1 bg-black/60 border border-white/10 rounded-lg p-3 font-mono text-xs text-emerald-300 resize-y focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    />
                </div>
            )}

            <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-gray-500 bg-black/40 px-3 py-2 rounded-lg border border-white/5 truncate font-mono">
                    {endpoint.method} {buildUrl()}
                </code>
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Copy cURL"
                >
                    <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={handleExecute}
                    disabled={!apiKey || isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Play className="w-3 h-3" />
                    {isLoading ? "..." : "Run"}
                </button>
            </div>

            {response && (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Response</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${statusCode && statusCode >= 200 && statusCode < 300 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                            {statusCode}
                        </span>
                    </div>
                    <pre className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-xs text-emerald-300/80 overflow-auto max-h-48">
                        {response}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Endpoint Row with Try It ────────────────────────────────────────────────

export function TryableEndpointRow({ endpoint, codeColor = "text-cyan-200/80" }: { endpoint: EndpointDef; codeColor?: string }) {
    const [showTryIt, setShowTryIt] = useState(false);

    return (
        <div className="border-b border-white/5 last:border-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider shrink-0 w-20 justify-center ${METHOD_COLORS[endpoint.method] || "bg-gray-500/15 text-gray-400"}`}>
                    {endpoint.method}
                </span>
                <code className={`text-sm font-mono ${codeColor} break-all flex-grow`}>
                    {endpoint.path}
                </code>
                <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors shrink-0">
                    {endpoint.desc}
                </p>
                {endpoint.tryable && (
                    <button
                        onClick={() => setShowTryIt(!showTryIt)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors shrink-0"
                    >
                        <Send className="w-3 h-3" />
                        {showTryIt ? "Hide" : "Try It"}
                    </button>
                )}
            </div>
            {showTryIt && endpoint.tryable && (
                <div className="px-6 pb-4">
                    <TryItWidget endpoint={endpoint} />
                </div>
            )}
        </div>
    );
}

// ─── Collapsible Entity Group ────────────────────────────────────────────────

export function TryableEntityGroup({
    name,
    icon,
    desc,
    routes,
    codeColor = "text-cyan-200/80"
}: {
    name: string;
    icon: React.ReactNode;
    desc: string;
    routes: EndpointDef[];
    codeColor?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full text-left group"
            >
                {icon}
                <h3 className="text-xl font-bold">{name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {routes.length} endpoints
                </span>
                <span className="h-px flex-grow bg-white/5" />
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
            {isOpen && (
                <>
                    <p className="text-gray-500 text-sm mb-4">{desc}</p>
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                        {routes.map((route, i) => (
                            <TryableEndpointRow key={i} endpoint={route} codeColor={codeColor} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
