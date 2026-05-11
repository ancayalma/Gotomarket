import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import Link from "next/link";
import { ArrowLeft, Server, Database, Globe, Code, Zap, ChevronRight, Copy, Lock, Package, Users, Building, Target, FileText, Bot, PhoneCall, LifeBuoy, BookOpen, Calendar as CalendarIcon, ShoppingCart, MessageSquare, ClipboardList } from "lucide-react";
import { TryableEntityGroup } from "./TryItWidgets";

export const metadata = {
    title: "API Reference - BasaltCRM Developers",
    description: "Complete REST API reference for BasaltCRM. Detailed documentation for Leads, Contacts, Accounts, Opportunities, and more.",
};

/* ------------------------------------------------------------------ */
/* Shared Styles                                                      */
/* ------------------------------------------------------------------ */
const cardClass = "group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors hover:bg-white/[0.07]";
const badgeClass = (color: string) => `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${color}`;
const codeBlockClass = "bg-[#0a0a0a] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-x-auto text-gray-300 leading-relaxed";

/* ------------------------------------------------------------------ */
/* Detailed Endpoint Breakdown                                        */
/* ------------------------------------------------------------------ */

const CORE_ENTITIES = [
    {
        name: "Leads",
        icon: <Target className="w-5 h-5 text-cyan-400" />,
        desc: "Manage potential customers and prospecting data.",
        routes: [
            { method: "GET", path: "/api/crm/leads", desc: "List all leads for the current team" },
            { method: "POST", path: "/api/crm/leads", desc: "Create or merge a new lead record" },
            { method: "GET", path: "/api/crm/leads/[leadId]", desc: "Retrieve detailed lead data" },
            { method: "PUT", path: "/api/crm/leads/[leadId]", desc: "Update lead status and attributes" },
            { method: "DELETE", path: "/api/crm/leads/[leadId]", desc: "Remove a lead record (SOC2 Compliant)" },
            { method: "POST", path: "/api/crm/leads/[leadId]/activities", desc: "Log call/email activity" },
            { method: "GET", path: "/api/crm/leads/list", desc: "Paginated lead list with advanced filters" },
        ]
    },
    {
        name: "Accounts",
        icon: <Building className="w-5 h-5 text-emerald-400" />,
        desc: "Organizations and companies linked to contacts and deals.",
        routes: [
            { method: "GET", path: "/api/crm/account", desc: "List all company accounts" },
            { method: "POST", path: "/api/crm/account", desc: "Create a new organization profile" },
            { method: "PUT", path: "/api/crm/account", desc: "Bulk update company attributes" },
            { method: "DELETE", path: "/api/crm/account/[accountId]", desc: "Archive or delete a company profile" },
            { method: "GET", path: "/api/crm/account/[accountId]", desc: "Get account and linked contacts" },
        ]
    },
    {
        name: "Contacts",
        icon: <Users className="w-5 h-5 text-purple-400" />,
        desc: "Individual people belonging to accounts.",
        routes: [
            { method: "GET", path: "/api/crm/contacts", desc: "List all individual contacts" },
            { method: "POST", path: "/api/crm/contacts", desc: "Create contact with account linking" },
            { method: "GET", path: "/api/crm/contacts/[contactId]", desc: "Retrieve individual contact profile" },
            { method: "DELETE", path: "/api/crm/contacts/[contactId]", desc: "Purge contact data" },
        ]
    }
];

const SALES_REVENUE = [
    {
        name: "Opportunities",
        icon: <Zap className="w-5 h-5 text-amber-400" />,
        desc: "Deal pipeline and revenue forecasting.",
        routes: [
            { method: "GET", path: "/api/crm/opportunity", desc: "List all deals in the pipeline" },
            { method: "POST", path: "/api/crm/opportunity", desc: "Create a new deal opportunity" },
            { method: "PUT", path: "/api/crm/opportunity/[opportunityId]", desc: "Update deal stage or value" },
            { method: "DELETE", path: "/api/crm/opportunity/[opportunityId]", desc: "Discard lost or voided deals" },
        ]
    },
    {
        name: "Billing & Invoices",
        icon: <FileText className="w-5 h-5 text-rose-400" />,
        desc: "Invoicing and payment lifecycle.",
        routes: [
            { method: "GET", path: "/api/invoice", desc: "List all team invoices" },
            { method: "POST", path: "/api/invoice", desc: "Generate a new invoice" },
            { method: "GET", path: "/api/invoice/[id]", desc: "Retrieve invoice payment status" },
        ]
    }
];

const SUPPORT_SUCCESS = [
    {
        name: "Cases & Tickets",
        icon: <LifeBuoy className="w-5 h-5 text-blue-400" />,
        desc: "Post-sale support and issue tracking.",
        routes: [
            { method: "GET", path: "/api/crm/cases", desc: "List team support cases" },
            { method: "POST", path: "/api/crm/cases", desc: "Create new support ticket" },
            { method: "PUT", path: "/api/crm/cases", desc: "Update case status or assignment" },
            { method: "GET", path: "/api/crm/cases/[caseId]", desc: "Get full case history" },
        ]
    },
    {
        name: "Knowledge Base",
        icon: <BookOpen className="w-5 h-5 text-orange-400" />,
        desc: "Self-service documentation and help articles.",
        routes: [
            { method: "GET", path: "/api/crm/knowledge/articles", desc: "Fetch help center articles" },
            { method: "GET", path: "/api/crm/knowledge/categories", desc: "Browse article categories" },
        ]
    }
];

const GROWTH_HEAVY = [
    {
        name: "Lead Pools & LeadGen",
        icon: <Bot className="w-5 h-5 text-sky-400" />,
        desc: "Autonomous prospecting and lead intelligence.",
        routes: [
            { method: "GET", path: "/api/crm/leads/pools", desc: "Browse intelligence lead pools" },
            { method: "POST", path: "/api/crm/leads/autogen", desc: "Trigger LeadGen Wizard job" },
            { method: "DELETE", path: "/api/crm/leads/pools", desc: "Purge lead pool and associated data" },
        ]
    },
    {
        name: "Voice & AI (BasaltECHO)",
        icon: <PhoneCall className="w-5 h-5 text-indigo-400" />,
        desc: "Real-time AI voice conversation control.",
        routes: [
            { method: "POST", path: "/api/voice/engage/webhook", desc: "BasaltECHO event receiver" },
            { method: "POST", path: "/api/oauth/token", desc: "BasaltECHO connection token" },
        ]
    },
    {
        name: "Agent Commerce (UCP)",
        icon: <ShoppingCart className="w-5 h-5 text-pink-400" />,
        desc: "Standardized UCP-compliant commerce for agentic workflows.",
        routes: [
            { method: "GET", path: "/api/v1/agent/catalog", desc: "Fetch agent-discoverable services" },
            { method: "GET", path: "/api/v1/agent/purchase/[sku]", desc: "Generate 402 Payment Challenge for SKU" },
            { method: "POST", path: "/api/v1/agent/purchase/[sku]", desc: "Finalize purchase with payment proof" },
        ]
    }
];

const OPERATIONS_OPS = [
    {
        name: "Calendar & Events",
        icon: <CalendarIcon className="w-5 h-5 text-red-400" />,
        desc: "Scheduling and resource management.",
        routes: [
            { method: "GET", path: "/api/calendar/events", desc: "List upcoming team meetings" },
            { method: "POST", path: "/api/calendar/schedule", desc: "Book a new meeting slot" },
            { method: "GET", path: "/api/calendar/availability", desc: "Check user or team availability" },
        ]
    }
];

const METHOD_COLORS: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    POST: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    PUT: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    DELETE: "bg-red-500/15 text-red-400 border border-red-500/20",
};

export default function ApiReferencePage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-32 pb-20 px-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Back Link */}
                        <Link href="/developers" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors text-sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Developers
                        </Link>

                        {/* Hero */}
                        <div className="mb-16">
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 mb-2">
                                Master API Reference
                            </h1>
                            <p className="text-lg text-gray-400 max-w-3xl">
                                BasaltCRM provides a developer-first REST API to programmatically control your revenue operations,
                                from core CRM entities to autonomous AI voice agents.
                            </p>
                        </div>

                        {/* Navigation Tabs (Simulated with scroll links) */}
                        <div className="flex flex-wrap gap-4 mb-12 py-2 border-b border-white/5">
                            {[
                                { name: "⚡ External API v1", id: "v1" },
                                { name: "Core Dynamics", id: "core" },
                                { name: "Sales & Revenue", id: "sales" },
                                { name: "Support & Success", id: "support" },
                                { name: "Growth & AI", id: "growth" },
                                { name: "Operations", id: "ops" }
                            ].map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={`#section-${tab.id}`}
                                    className={`text-sm font-bold transition-colors px-1 ${tab.id === 'v1' ? 'text-cyan-400 hover:text-cyan-300' : 'text-gray-400 hover:text-cyan-400'}`}
                                >
                                    {tab.name}
                                </Link>
                            ))}
                        </div>

                        {/* ============================================================ */}
                        {/* Section: External API v1 (Ecommerce + Messaging)           */}
                        {/* ============================================================ */}
                        <div id="section-v1" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <Globe className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">External API <span className="text-cyan-400">v1</span></h2>
                                    <p className="text-gray-500 text-sm">Bearer-token authenticated endpoints for ecommerce integrations and headless CRM access.</p>
                                </div>
                                <span className="ml-auto px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                                    Interactive — Try It Now
                                </span>
                            </div>

                            {/* Auth Banner */}
                            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-5 mb-8">
                                <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2 mb-2">
                                    <Lock className="w-4 h-4" /> Authentication
                                </h4>
                                <p className="text-sm text-gray-400 mb-3">Include your API key in every request:</p>
                                <code className="block bg-black/40 border border-white/5 rounded-lg px-4 py-2 font-mono text-sm text-emerald-300">
                                    Authorization: Bearer sk_live_your_api_key_here
                                </code>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {/* Contacts */}
                                <TryableEntityGroup
                                    name="Contacts"
                                    icon={<Users className="w-5 h-5 text-blue-400" />}
                                    desc="Customer tracking with email-based upsert deduplication. Ideal for ecommerce customer sync."
                                    codeColor="text-blue-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/contacts", desc: "List contacts (paginated, filterable)", tryable: true },
                                        { method: "POST", path: "/api/v1/contacts", desc: "Create/upsert by email", tryable: true, exampleBody: { first_name: "Jane", last_name: "Doe", email: "jane@shop.com", tags: ["ecommerce"] } },
                                        { method: "GET", path: "/api/v1/contacts/[contactId]", desc: "Get single contact", tryable: true },
                                        { method: "PUT", path: "/api/v1/contacts/[contactId]", desc: "Update contact", tryable: true, exampleBody: { first_name: "Jane", tags: ["vip"] } },
                                        { method: "DELETE", path: "/api/v1/contacts/[contactId]", desc: "Soft-delete contact", tryable: true },
                                    ]}
                                />

                                {/* Leads */}
                                <TryableEntityGroup
                                    name="Leads"
                                    icon={<Target className="w-5 h-5 text-emerald-400" />}
                                    desc="Lead management with email deduplication. Push prospects from your website funnel."
                                    codeColor="text-emerald-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/leads", desc: "List leads (filterable by status, company)", tryable: true },
                                        { method: "POST", path: "/api/v1/leads", desc: "Create/upsert by email", tryable: true, exampleBody: { firstName: "John", lastName: "Smith", email: "john@acme.com", company: "Acme Corp", lead_source: "Website" } },
                                        { method: "GET", path: "/api/v1/leads/[leadId]", desc: "Get single lead", tryable: true },
                                        { method: "PUT", path: "/api/v1/leads/[leadId]", desc: "Update lead", tryable: true, exampleBody: { status: "CONTACTED" } },
                                        { method: "DELETE", path: "/api/v1/leads/[leadId]", desc: "Soft-delete lead", tryable: true },
                                    ]}
                                />

                                {/* Accounts */}
                                <TryableEntityGroup
                                    name="Accounts"
                                    icon={<Building className="w-5 h-5 text-purple-400" />}
                                    desc="Company accounts with name-based deduplication. Supports B2B ecommerce."
                                    codeColor="text-purple-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/accounts", desc: "List accounts", tryable: true },
                                        { method: "POST", path: "/api/v1/accounts", desc: "Create/upsert by name", tryable: true, exampleBody: { name: "Acme Corp", email: "info@acme.com", type: "Customer" } },
                                        { method: "GET", path: "/api/v1/accounts/[accountId]", desc: "Get with linked contacts/leads", tryable: true },
                                        { method: "PUT", path: "/api/v1/accounts/[accountId]", desc: "Update account", tryable: true, exampleBody: { website: "https://acme.com" } },
                                        { method: "DELETE", path: "/api/v1/accounts/[accountId]", desc: "Soft-delete account", tryable: true },
                                    ]}
                                />

                                {/* Messages (Bidirectional) */}
                                <TryableEntityGroup
                                    name="Messages (Bidirectional)"
                                    icon={<MessageSquare className="w-5 h-5 text-orange-400" />}
                                    desc="Send outbound messages and receive customer replies via webhook. Full conversation threading."
                                    codeColor="text-orange-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/messages", desc: "List messages (filter by contact, direction)", tryable: true },
                                        { method: "POST", path: "/api/v1/messages", desc: "Send outbound message (email delivery)", tryable: true, exampleBody: { to: { email: "jane@shop.com" }, from: { email: "sales@yourdomain.com", name: "Your Store" }, subject: "Order Update", body: "<h1>Shipped!</h1>", isHtml: true, channel: "email" } },
                                        { method: "POST", path: "/api/v1/messages/inbound", desc: "Webhook: push customer replies into CRM", tryable: true, exampleBody: { email: "customer@shop.com", body: "Where is my order?", subject: "Question", metadata: { orderId: "ORD-789" } } },
                                        { method: "GET", path: "/api/v1/messages/[messageId]", desc: "Get message with thread context", tryable: true },
                                        { method: "GET", path: "/api/v1/messages/threads/[threadId]", desc: "Full conversation thread", tryable: true },
                                    ]}
                                />

                                {/* Opportunities */}
                                <TryableEntityGroup
                                    name="Opportunities"
                                    icon={<Zap className="w-5 h-5 text-amber-400" />}
                                    desc="Deal pipeline management via API."
                                    codeColor="text-amber-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/opportunities", desc: "List opportunities", tryable: true },
                                        { method: "POST", path: "/api/v1/opportunities", desc: "Create opportunity", tryable: true, exampleBody: { name: "Enterprise Deal", budget: 50000, sales_stage: "Negotiation" } },
                                        { method: "GET", path: "/api/v1/opportunities/[opportunityId]", desc: "Get single opportunity", tryable: true },
                                        { method: "PUT", path: "/api/v1/opportunities/[opportunityId]", desc: "Update opportunity", tryable: true, exampleBody: { sales_stage: "Closed Won" } },
                                    ]}
                                />

                                {/* Tasks */}
                                <TryableEntityGroup
                                    name="Tasks"
                                    icon={<ClipboardList className="w-5 h-5 text-cyan-400" />}
                                    desc="Task management via API."
                                    codeColor="text-cyan-200/80"
                                    routes={[
                                        { method: "GET", path: "/api/v1/tasks", desc: "List tasks", tryable: true },
                                        { method: "POST", path: "/api/v1/tasks", desc: "Create task", tryable: true, exampleBody: { title: "Follow up with Jane", priority: "HIGH", status: "TODO" } },
                                        { method: "GET", path: "/api/v1/tasks/[taskId]", desc: "Get single task", tryable: true },
                                        { method: "PUT", path: "/api/v1/tasks/[taskId]", desc: "Update task", tryable: true, exampleBody: { status: "DONE" } },
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Section: Core Dynamics */}
                        <div id="section-core" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                    <Database className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Core Dynamics</h2>
                                    <p className="text-gray-500 text-sm">The foundational entities of BasaltCRM.</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {CORE_ENTITIES.map((entity) => (
                                    <div key={entity.name} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {entity.icon}
                                            <h3 className="text-xl font-bold">{entity.name}</h3>
                                            <span className="h-px flex-grow bg-white/5" />
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4">{entity.desc}</p>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                            {entity.routes.map((route, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                                                    <span className={`${badgeClass(METHOD_COLORS[route.method] || "bg-gray-500/15 text-gray-400")} shrink-0 w-20 justify-center`}>
                                                        {route.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-cyan-200/80 break-all flex-grow">
                                                        {route.path}
                                                    </code>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                                        {route.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Sales & Revenue */}
                        <div id="section-sales" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <Zap className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Sales & Revenue</h2>
                                    <p className="text-gray-500 text-sm">Pipeline management, invoicing, and digital commerce.</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {SALES_REVENUE.map((entity) => (
                                    <div key={entity.name} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {entity.icon}
                                            <h3 className="text-xl font-bold">{entity.name}</h3>
                                            <span className="h-px flex-grow bg-white/5" />
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                            {entity.routes.map((route, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                                                    <span className={`${badgeClass(METHOD_COLORS[route.method] || "bg-gray-500/15 text-gray-400")} shrink-0 w-20 justify-center`}>
                                                        {route.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-amber-200/80 flex-grow">
                                                        {route.path}
                                                    </code>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                                        {route.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Support & Success */}
                        <div id="section-support" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <LifeBuoy className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Support & Success</h2>
                                    <p className="text-gray-500 text-sm">Case management, SLA tracking, and help center access.</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {SUPPORT_SUCCESS.map((entity) => (
                                    <div key={entity.name} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {entity.icon}
                                            <h3 className="text-xl font-bold">{entity.name}</h3>
                                            <span className="h-px flex-grow bg-white/5" />
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                            {entity.routes.map((route, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                                                    <span className={`${badgeClass(METHOD_COLORS[route.method] || "bg-gray-500/15 text-gray-400")} shrink-0 w-20 justify-center`}>
                                                        {route.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-blue-200/80 flex-grow">
                                                        {route.path}
                                                    </code>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                                        {route.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Growth & AI */}
                        <div id="section-growth" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <Bot className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Growth & AI</h2>
                                    <p className="text-gray-500 text-sm">Lead automation and real-time voice intelligence.</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {GROWTH_HEAVY.map((entity) => (
                                    <div key={entity.name} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {entity.icon}
                                            <h3 className="text-xl font-bold">{entity.name}</h3>
                                            <span className="h-px flex-grow bg-white/5" />
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                            {entity.routes.map((route, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                                                    <span className={`${badgeClass(METHOD_COLORS[route.method] || "bg-gray-500/15 text-gray-400")} shrink-0 w-20 justify-center`}>
                                                        {route.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-purple-200/80 flex-grow">
                                                        {route.path}
                                                    </code>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                                        {route.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Operations */}
                        <div id="section-ops" className="mb-20 scroll-mt-32">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <CalendarIcon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">Operations</h2>
                                    <p className="text-gray-500 text-sm">Calendar synchronization and scheduling.</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-1 gap-10">
                                {OPERATIONS_OPS.map((entity) => (
                                    <div key={entity.name} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {entity.icon}
                                            <h3 className="text-xl font-bold">{entity.name}</h3>
                                            <span className="h-px flex-grow bg-white/5" />
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                            {entity.routes.map((route, i) => (
                                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                                                    <span className={`${badgeClass(METHOD_COLORS[route.method] || "bg-gray-500/15 text-gray-400")} shrink-0 w-20 justify-center`}>
                                                        {route.method}
                                                    </span>
                                                    <code className="text-sm font-mono text-red-200/80 flex-grow">
                                                        {route.path}
                                                    </code>
                                                    <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                                                        {route.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rate Limiting & Auth Notice */}
                        <div className="mt-16 grid md:grid-cols-2 gap-8 font-sans">
                            <div className="p-8 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                                <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Global Auth
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    All CRM routes require a valid session or Bearer token. Use the
                                    <Link href="/developers/authentication" className="text-white hover:underline mx-1">Authentication Guide</Link>
                                    to retrieve your connection tokens.
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
                                    <Server className="w-4 h-4" /> Concurrency
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    BasaltCRM supports up to 10 concurrent requests per API key.
                                    Bulk operations should be batched via the <strong>/api/crm/leads/pools/import</strong> endpoint.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
