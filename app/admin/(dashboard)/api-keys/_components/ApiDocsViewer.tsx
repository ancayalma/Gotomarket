"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Play, Copy, Check, Zap, Send, Users, Building2, Target, ClipboardList, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EndpointDef {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    description: string;
    params?: { name: string; in: "query" | "body" | "path"; required?: boolean; type: string; description: string }[];
    exampleBody?: Record<string, any>;
    exampleResponse?: Record<string, any>;
}

interface EndpointGroup {
    name: string;
    icon: React.ReactNode;
    color: string;
    endpoints: EndpointDef[];
}

// ─── Endpoint Definitions ────────────────────────────────────────────────────

const ENDPOINT_GROUPS: EndpointGroup[] = [
    {
        name: "Contacts",
        icon: <Users className="w-4 h-4" />,
        color: "blue",
        endpoints: [
            {
                method: "GET", path: "/api/v1/contacts",
                description: "List contacts for your team. Supports pagination and filtering.",
                params: [
                    { name: "page", in: "query", type: "number", description: "Page number (default: 1)" },
                    { name: "pageSize", in: "query", type: "number", description: "Results per page (default: 25, max: 100)" },
                    { name: "email", in: "query", type: "string", description: "Filter by email (partial match)" },
                    { name: "search", in: "query", type: "string", description: "Search across name and email" },
                ],
                exampleResponse: { data: [{ id: "abc123", first_name: "Jane", last_name: "Doe", email: "jane@example.com", status: true, type: "Customer" }], meta: { total: 1, page: 1, pageSize: 25, hasMore: false } }
            },
            {
                method: "POST", path: "/api/v1/contacts",
                description: "Create or upsert a contact. Deduplicates by email — ideal for ecommerce customer tracking.",
                params: [
                    { name: "last_name", in: "body", required: true, type: "string", description: "Last name (required)" },
                    { name: "first_name", in: "body", type: "string", description: "First name" },
                    { name: "email", in: "body", type: "string", description: "Email address (used for dedup)" },
                    { name: "mobile_phone", in: "body", type: "string", description: "Mobile phone" },
                    { name: "tags", in: "body", type: "string[]", description: "Tags array" },
                ],
                exampleBody: { first_name: "Jane", last_name: "Doe", email: "jane@shop.com", mobile_phone: "+1234567890", tags: ["vip", "ecommerce"] },
                exampleResponse: { data: { id: "abc123", first_name: "Jane", last_name: "Doe", email: "jane@shop.com" } }
            },
            {
                method: "GET", path: "/api/v1/contacts/{contactId}",
                description: "Get a single contact by ID.",
                params: [{ name: "contactId", in: "path", required: true, type: "string", description: "Contact ID" }],
            },
            {
                method: "PUT", path: "/api/v1/contacts/{contactId}",
                description: "Update a contact. Only pass fields you want to change.",
                params: [{ name: "contactId", in: "path", required: true, type: "string", description: "Contact ID" }],
                exampleBody: { first_name: "Jane", tags: ["vip", "returning"] },
            },
            {
                method: "DELETE", path: "/api/v1/contacts/{contactId}",
                description: "Soft-delete a contact (sets status to inactive).",
                params: [{ name: "contactId", in: "path", required: true, type: "string", description: "Contact ID" }],
            },
        ],
    },
    {
        name: "Leads",
        icon: <Target className="w-4 h-4" />,
        color: "emerald",
        endpoints: [
            {
                method: "GET", path: "/api/v1/leads",
                description: "List leads. Filterable by status, email, company, pipeline stage.",
                params: [
                    { name: "status", in: "query", type: "string", description: "Filter by status (NEW, CONTACTED, QUALIFIED, LOST)" },
                    { name: "email", in: "query", type: "string", description: "Filter by email" },
                    { name: "company", in: "query", type: "string", description: "Filter by company name" },
                    { name: "search", in: "query", type: "string", description: "Search across name, email, company" },
                ],
            },
            {
                method: "POST", path: "/api/v1/leads",
                description: "Create or upsert a lead. Deduplicates by email.",
                exampleBody: { firstName: "John", lastName: "Smith", email: "john@acme.com", company: "Acme Corp", lead_source: "Website" },
            },
            { method: "GET", path: "/api/v1/leads/{leadId}", description: "Get a single lead by ID." },
            { method: "PUT", path: "/api/v1/leads/{leadId}", description: "Update a lead." },
            { method: "DELETE", path: "/api/v1/leads/{leadId}", description: "Soft-delete a lead." },
        ],
    },
    {
        name: "Accounts",
        icon: <Building2 className="w-4 h-4" />,
        color: "purple",
        endpoints: [
            { method: "GET", path: "/api/v1/accounts", description: "List company accounts." },
            {
                method: "POST", path: "/api/v1/accounts",
                description: "Create or upsert an account. Deduplicates by name.",
                exampleBody: { name: "Acme Corp", email: "info@acme.com", type: "Customer", website: "https://acme.com" },
            },
            { method: "GET", path: "/api/v1/accounts/{accountId}", description: "Get account with linked contacts and leads." },
            { method: "PUT", path: "/api/v1/accounts/{accountId}", description: "Update an account." },
            { method: "DELETE", path: "/api/v1/accounts/{accountId}", description: "Soft-delete an account." },
        ],
    },
    {
        name: "Messages",
        icon: <MessageSquare className="w-4 h-4" />,
        color: "orange",
        endpoints: [
            {
                method: "GET", path: "/api/v1/messages",
                description: "List messages. Filter by contactId, leadId, direction, channel.",
                params: [
                    { name: "contactId", in: "query", type: "string", description: "Filter messages for this contact" },
                    { name: "leadId", in: "query", type: "string", description: "Filter messages for this lead" },
                    { name: "direction", in: "query", type: "string", description: "INBOUND or OUTBOUND" },
                    { name: "conversation_id", in: "query", type: "string", description: "Filter by conversation thread" },
                ],
            },
            {
                method: "POST", path: "/api/v1/messages",
                description: "Send an outbound message. Optionally delivers via email.",
                exampleBody: { to: { email: "jane@shop.com" }, subject: "Order Update", body: "Your order has shipped!", channel: "email" },
                exampleResponse: { data: { id: "msg_123", conversation_id: "conv_456", direction: "OUTBOUND", channel: "EMAIL" } },
            },
            {
                method: "POST", path: "/api/v1/messages/inbound",
                description: "Webhook: push inbound customer messages into the CRM. Auto-creates contacts for unknown emails.",
                exampleBody: { email: "customer@shop.com", body: "Where is my order?", subject: "Order Question", metadata: { orderId: "ORD-789" } },
            },
            {
                method: "GET", path: "/api/v1/messages/{messageId}",
                description: "Get a single message with full conversation thread.",
            },
            {
                method: "GET", path: "/api/v1/messages/threads/{threadId}",
                description: "Get an entire conversation thread by ID.",
            },
        ],
    },
    {
        name: "Opportunities",
        icon: <Zap className="w-4 h-4" />,
        color: "yellow",
        endpoints: [
            { method: "GET", path: "/api/v1/opportunities", description: "List opportunities." },
            {
                method: "POST", path: "/api/v1/opportunities",
                description: "Create an opportunity.",
                exampleBody: { name: "Enterprise Deal", budget: 50000, sales_stage: "Negotiation" },
            },
            { method: "GET", path: "/api/v1/opportunities/{opportunityId}", description: "Get a single opportunity." },
            { method: "PUT", path: "/api/v1/opportunities/{opportunityId}", description: "Update an opportunity." },
        ],
    },
    {
        name: "Tasks",
        icon: <ClipboardList className="w-4 h-4" />,
        color: "cyan",
        endpoints: [
            { method: "GET", path: "/api/v1/tasks", description: "List tasks." },
            {
                method: "POST", path: "/api/v1/tasks",
                description: "Create a task.",
                exampleBody: { title: "Follow up with Jane", priority: "HIGH", status: "TODO" },
            },
            { method: "GET", path: "/api/v1/tasks/{taskId}", description: "Get a single task." },
            { method: "PUT", path: "/api/v1/tasks/{taskId}", description: "Update a task." },
        ],
    },
];

// ─── Method Colors ───────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ─── Try It Now Widget ──────────────────────────────────────────────────────

function TryItWidget({ endpoint }: { endpoint: EndpointDef }) {
    const [apiKey, setApiKey] = useState("");
    const [pathParams, setPathParams] = useState<Record<string, string>>({});
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});
    const [bodyJson, setBodyJson] = useState(endpoint.exampleBody ? JSON.stringify(endpoint.exampleBody, null, 2) : "{}");
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusCode, setStatusCode] = useState<number | null>(null);

    const buildUrl = useCallback(() => {
        let url = endpoint.path;
        // Replace path params
        for (const [key, value] of Object.entries(pathParams)) {
            url = url.replace(`{${key}}`, value || `{${key}}`);
        }
        // Add query params
        const qp = new URLSearchParams();
        for (const [key, value] of Object.entries(queryParams)) {
            if (value) qp.set(key, value);
        }
        const qs = qp.toString();
        return qs ? `${url}?${qs}` : url;
    }, [endpoint.path, pathParams, queryParams]);

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

    const pathParamNames = endpoint.params?.filter(p => p.in === "path") || [];
    const queryParamDefs = endpoint.params?.filter(p => p.in === "query") || [];

    return (
        <div className="mt-3 space-y-3 border border-white/5 rounded-xl p-4 bg-black/20">
            {/* API Key */}
            <div>
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">API Key</label>
                <Input
                    type="password"
                    placeholder="sk_live_..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="bg-black/40 border-white/10 mt-1 font-mono text-xs"
                />
            </div>

            {/* Path Params */}
            {pathParamNames.length > 0 && (
                <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Path Parameters</label>
                    {pathParamNames.map(p => (
                        <div key={p.name} className="flex items-center gap-2">
                            <code className="text-[11px] text-primary/70 w-28 shrink-0">{p.name}</code>
                            <Input
                                placeholder={p.description}
                                value={pathParams[p.name] || ""}
                                onChange={e => setPathParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                                className="bg-black/40 border-white/10 text-xs"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Query Params */}
            {queryParamDefs.length > 0 && (
                <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Query Parameters</label>
                    {queryParamDefs.map(p => (
                        <div key={p.name} className="flex items-center gap-2">
                            <code className="text-[11px] text-primary/70 w-28 shrink-0">{p.name}</code>
                            <Input
                                placeholder={p.description}
                                value={queryParams[p.name] || ""}
                                onChange={e => setQueryParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                                className="bg-black/40 border-white/10 text-xs"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Request Body */}
            {["POST", "PUT"].includes(endpoint.method) && (
                <div>
                    <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Request Body (JSON)</label>
                    <textarea
                        value={bodyJson}
                        onChange={e => setBodyJson(e.target.value)}
                        rows={5}
                        className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-xs text-emerald-300 resize-y focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                </div>
            )}

            {/* URL Preview + Execute */}
            <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-muted-foreground bg-black/40 px-3 py-2 rounded-lg border border-white/5 truncate">
                    {endpoint.method} {buildUrl()}
                </code>
                <Button
                    onClick={handleExecute}
                    disabled={!apiKey || isLoading}
                    size="sm"
                    className="bg-primary text-black hover:bg-primary/90 rounded-full shrink-0 gap-1.5"
                >
                    <Play className="w-3 h-3" />
                    {isLoading ? "Running..." : "Execute"}
                </Button>
            </div>

            {/* Response */}
            {response && (
                <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Response</span>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${statusCode && statusCode >= 200 && statusCode < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {statusCode}
                        </span>
                    </div>
                    <pre className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-xs text-emerald-300 overflow-auto max-h-64">
                        {response}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Endpoint Row ────────────────────────────────────────────────────────────

function EndpointRow({ endpoint }: { endpoint: EndpointDef }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showTryIt, setShowTryIt] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const curlCmd = `curl -H "Authorization: Bearer sk_live_..." ${endpoint.method === "GET" ? "" : `-X ${endpoint.method} `}${endpoint.exampleBody ? `-d '${JSON.stringify(endpoint.exampleBody)}' -H "Content-Type: application/json" ` : ""}${window.location.origin}${endpoint.path}`;
        navigator.clipboard.writeText(curlCmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
            >
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${METHOD_COLORS[endpoint.method]}`}>
                    {endpoint.method}
                </span>
                <code className="text-sm font-mono text-primary/80 flex-1">{endpoint.path}</code>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>

                    {/* Params Table */}
                    {endpoint.params && endpoint.params.length > 0 && (
                        <div className="overflow-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/5 text-muted-foreground">
                                        <th className="text-left py-1.5 pr-3">Name</th>
                                        <th className="text-left py-1.5 pr-3">In</th>
                                        <th className="text-left py-1.5 pr-3">Type</th>
                                        <th className="text-left py-1.5">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {endpoint.params.map(p => (
                                        <tr key={p.name} className="border-b border-white/[0.03]">
                                            <td className="py-1.5 pr-3 font-mono text-primary/70">{p.name}{p.required && <span className="text-red-400 ml-0.5">*</span>}</td>
                                            <td className="py-1.5 pr-3 text-muted-foreground">{p.in}</td>
                                            <td className="py-1.5 pr-3 text-muted-foreground">{p.type}</td>
                                            <td className="py-1.5 text-muted-foreground">{p.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Example Response */}
                    {endpoint.exampleResponse && (
                        <div>
                            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Example Response</span>
                            <pre className="mt-1 bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-[11px] text-emerald-300/80 overflow-auto max-h-40">
                                {JSON.stringify(endpoint.exampleResponse, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTryIt(!showTryIt)}
                            className="text-primary hover:text-primary hover:bg-primary/10 rounded-full gap-1.5 text-xs"
                        >
                            <Send className="w-3 h-3" />
                            {showTryIt ? "Hide" : "Try It Now"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-full gap-1.5 text-xs"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Copied!" : "Copy cURL"}
                        </Button>
                    </div>

                    {/* Try It Widget */}
                    {showTryIt && <TryItWidget endpoint={endpoint} />}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
    blue: "border-blue-500/20 from-blue-500/5",
    emerald: "border-emerald-500/20 from-emerald-500/5",
    purple: "border-purple-500/20 from-purple-500/5",
    orange: "border-orange-500/20 from-orange-500/5",
    yellow: "border-yellow-500/20 from-yellow-500/5",
    cyan: "border-cyan-500/20 from-cyan-500/5",
};

const BADGE_MAP: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export function ApiDocsViewer() {
    const [expandedGroup, setExpandedGroup] = useState<string | null>("Contacts");

    return (
        <div className="bg-[#18181b] border border-primary/20 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="text-primary">{"< >"}</span> API Reference
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                            v1
                        </span>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Full REST API documentation with interactive testing.
                    </p>
                </div>
            </div>

            {/* Auth Guide */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Authentication
                </h4>
                <p className="text-xs text-muted-foreground">
                    Include your API key in every request header:
                </p>
                <code className="block bg-black/40 border border-white/5 rounded-lg px-3 py-2 font-mono text-xs text-emerald-300">
                    Authorization: Bearer sk_live_your_api_key_here
                </code>
                <p className="text-xs text-muted-foreground">
                    Generate keys in the <strong>API Keys</strong> section above. Keys are only shown once — store securely in your <code>.env</code> file.
                </p>
            </div>

            {/* Response Format */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold">Response Format</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <span className="text-[11px] text-emerald-400 font-medium">Success</span>
                        <pre className="mt-1 bg-black/40 border border-white/5 rounded-lg p-2 font-mono text-[11px] text-emerald-300/80">
                            {`{
  "data": { ... },
  "meta": {
    "total": 42,
    "page": 1,
    "pageSize": 25,
    "hasMore": true
  }
}`}
                        </pre>
                    </div>
                    <div>
                        <span className="text-[11px] text-red-400 font-medium">Error</span>
                        <pre className="mt-1 bg-black/40 border border-white/5 rounded-lg p-2 font-mono text-[11px] text-red-300/80">
                            {`{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Endpoint Groups */}
            <div className="space-y-4">
                {ENDPOINT_GROUPS.map(group => (
                    <div key={group.name} className={`border rounded-xl overflow-hidden bg-gradient-to-r to-transparent ${COLOR_MAP[group.color]}`}>
                        <button
                            onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                            className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                        >
                            <span className={`flex items-center gap-2 text-sm font-semibold flex-1`}>
                                {group.icon}
                                {group.name}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BADGE_MAP[group.color]}`}>
                                {group.endpoints.length} endpoints
                            </span>
                            {expandedGroup === group.name ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </button>

                        {expandedGroup === group.name && (
                            <div className="px-4 pb-4 space-y-2">
                                {group.endpoints.map((ep, i) => (
                                    <EndpointRow key={`${ep.method}-${ep.path}-${i}`} endpoint={ep} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Error Codes Reference */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold">Error Codes</h4>
                <div className="overflow-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-muted-foreground">
                                <th className="text-left py-1.5 pr-4">Status</th>
                                <th className="text-left py-1.5 pr-4">Code</th>
                                <th className="text-left py-1.5">Description</th>
                            </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                            <tr className="border-b border-white/[0.03]"><td className="py-1.5 pr-4 font-mono text-red-400">401</td><td className="py-1.5 pr-4">UNAUTHORIZED</td><td className="py-1.5">Missing or invalid API key</td></tr>
                            <tr className="border-b border-white/[0.03]"><td className="py-1.5 pr-4 font-mono text-amber-400">400</td><td className="py-1.5 pr-4">VALIDATION_ERROR</td><td className="py-1.5">Invalid request body or missing required fields</td></tr>
                            <tr className="border-b border-white/[0.03]"><td className="py-1.5 pr-4 font-mono text-amber-400">404</td><td className="py-1.5 pr-4">NOT_FOUND</td><td className="py-1.5">Resource not found or doesn't belong to your tenant</td></tr>
                            <tr><td className="py-1.5 pr-4 font-mono text-red-400">500</td><td className="py-1.5 pr-4">INTERNAL_ERROR</td><td className="py-1.5">Unexpected server error</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
