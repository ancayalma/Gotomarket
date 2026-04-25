"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, ChevronDown, ChevronUp, Trophy, DollarSign, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/* ────────── DATA ────────── */
const competitors = [
    { key: "basalt", name: "BasaltCRM", highlight: true },
    { key: "salesforce", name: "Salesforce" },
    { key: "hubspot", name: "HubSpot" },
    { key: "zoho", name: "Zoho CRM" },
    { key: "pipedrive", name: "Pipedrive" },
    { key: "monday", name: "Monday" },
    { key: "freshsales", name: "Freshsales" },
    { key: "dynamics", name: "Dynamics 365" },
    { key: "close", name: "Close CRM" },
];

type Rating = 1 | 2 | 3 | 4 | 5;

interface Category {
    name: string;
    tag: string;
    ratings: Rating[];
    details: string[];
}

const categories: Category[] = [
    {
        name: "AI Lead Generation",
        tag: "AI",
        ratings: [5, 3, 3, 3, 2, 2, 3, 3, 2],
        details: [
            "Autonomous agentic scraper with NLP ICP parsing, multi-agent site crawls, AI scoring (0-100)",
            "Einstein Lead Scoring at Enterprise+. Needs ZoomInfo/Apollo for discovery.",
            "Breeze Prospecting Agent at $1/qualified lead. No autonomous crawling.",
            "Zia lead scoring at Enterprise ($40/user). Zia Agent Studio. No web discovery.",
            "LeadBooster add-on ($). Manual prospector. No AI-driven discovery.",
            "AI lead scoring at Pro tier only. No discovery or prospecting.",
            "Freddy AI scoring at Pro ($39/user). Web forms only. No scraping.",
            "Copilot insights + LinkedIn Sales Navigator (extra $$). Credit-based.",
            "Smart Views for filtering. AI Agent 'Chloe' for calls. No lead discovery.",
        ],
    },
    {
        name: "AI Voice Agents",
        tag: "AI",
        ratings: [5, 2, 2, 2, 1, 1, 3, 3, 4],
        details: [
            "BasaltEcho: 0.12s latency, WebRTC + ElevenLabs TTS, 500 calls/hr, multi-language",
            "No native voice agents. Requires Five9/Vonage. Service Cloud Voice is premium add-on.",
            "Breeze handles chat/text only. Calling via Twilio integration. $0.50/resolved.",
            "Zia handles basic voice queries. No outbound AI. PhoneBridge (3rd-party).",
            "Basic click-to-call via Twilio only. Zero AI voice capabilities.",
            "No native calling or voice AI. Requires 3rd-party for any telephony.",
            "Built-in cloud telephony. Freddy chatbot. No autonomous voice agents.",
            "Contact Center ($110-195/user). Azure Comms (per-min). Copilot transcription.",
            "Power Dialer (Growth $99), Predictive Dialer (Scale $139). AI Agent 'Chloe'.",
        ],
    },
    {
        name: "AI Email & Outreach",
        tag: "AI",
        ratings: [5, 3, 4, 3, 3, 2, 3, 3, 3],
        details: [
            "AI-generated personalized emails based on lead + ICP context. AWS SES throughput. Multi-step sequences.",
            "Einstein GPT drafts. Sales Engagement for sequences. Enterprise+ tier + Agentforce add-on.",
            "Strong email automation. Breeze AI drafting. A/B testing. Pro sequences ($500+/mo).",
            "Zia email content gen. SalesInbox analytics. Mass email at Standard. Lacks autonomy.",
            "AI Email Writer. Campaigns add-on. Templates + tracking. Email sync at Advanced+.",
            "Two-way email sync at Standard. Basic tracking. No AI drafting or sequences.",
            "Freddy Copilot email drafts. Sales sequences at Pro ($39/user). Built-in tracking.",
            "Copilot email drafts. Sales Accelerator. Strong Outlook integration. Multi-license layers.",
            "AI email assistant. Bulk email at Growth. Sequences with A/B. $99/user minimum.",
        ],
    },
    {
        name: "Pipeline Management",
        tag: "CORE",
        ratings: [5, 5, 4, 4, 5, 4, 4, 4, 4],
        details: [
            "Visual Kanban, multiple pipelines, AI-predicted deal velocity, Sales Command center.",
            "Industry-leading. Unlimited customization. Einstein Opportunity Scoring. Path guidance.",
            "Excellent visual pipeline. Drag-and-drop deals. Forecasting at Pro+.",
            "Blueprint process management. Multiple pipelines. Zia deal predictions.",
            "Best-in-class visual pipeline. Intuitive drag-drop. Deal rotting indicators.",
            "Highly visual boards. Multiple views. Forecasting at Pro. Not sales-specialized.",
            "Kanban pipeline with weighted values. Multiple pipelines at Pro+. Freddy predictions.",
            "Enterprise pipeline. Business Process Flows. Copilot deal insights. Complex setup.",
            "Clean pipeline view. Stage coaching. Customizable. Built for high-velocity sales.",
        ],
    },
    {
        name: "Contact Management",
        tag: "CORE",
        ratings: [5, 5, 3, 4, 4, 3, 4, 5, 4],
        details: [
            "Unlimited contacts. AI enrichment. Relationship mapping. AI duplicate resolution. Guard rules.",
            "Industry leader. Unlimited contacts. Deep relationship mapping. Data Cloud enrichment.",
            "Free tier includes contacts w/ heavy limits. Costs scale with contact count.",
            "Solid management. Territory mgmt. Social CRM. Plan-based contact caps.",
            "Unlimited contacts all plans. Clean profiles. Smart contact data enrichment.",
            "Basic contact boards. Limited relationship mapping. Spreadsheet-like feel.",
            "Contact lifecycle stages. Auto-profile enrichment. 360° customer view.",
            "Enterprise-grade. Unified profiles via Customer Insights (Dataverse). Deep analytics.",
            "Simple but effective. Activity-centric views. Unlimited leads on Essentials+.",
        ],
    },
    {
        name: "Reporting & Analytics",
        tag: "CORE",
        ratings: [5, 5, 4, 4, 3, 3, 3, 5, 3],
        details: [
            "Predictive forecasting. AI-generated reports. Real-time command center. WebGL visualizations.",
            "Industry-best. Einstein Analytics (Tableau CRM). Unlimited custom reports. Predictive.",
            "Good reporting at Pro+. Custom reports. Attribution. Revenue analytics.",
            "Zia-powered analytics. Custom dashboards. Advanced analytics at Ultimate.",
            "Basic insights dashboard. Custom reports at Pro+. Revenue forecasting. Limited.",
            "Chart widgets. Custom formulas at Pro. Basic forecasting. Not built for deep analytics.",
            "Standard reports/dashboards. Custom reports at Pro+. Freddy deal insights.",
            "Power BI integration (world-class). Custom dashboards. Copilot analytics.",
            "Activity-focused reporting. Call metrics. Custom reports at Scale ($139/user).",
        ],
    },
    {
        name: "Workflow Automation",
        tag: "CORE",
        ratings: [5, 5, 4, 4, 3, 3, 3, 5, 3],
        details: [
            "FlowState visual builder. Multi-step conditional logic. Guard Rules. AI-integrated autonomous workflows.",
            "Flow Builder (enterprise-best). Process Builder. Agentforce. Steep learning curve.",
            "Strong workflow builder at Pro+. Multi-branch logic. Deal/contact-based workflows.",
            "Blueprint process mgmt. Workflow rules. Zia Agent Studio for custom AI agents.",
            "Basic trigger-action workflows. Limited branching. Add-on costs for advanced.",
            "No-code automation builder. Recipes. 250 actions/mo on Standard (limiting).",
            "Workflow automation with triggers/conditions. Auto-assignment. Sequences at Pro+.",
            "Power Automate (extremely powerful). Business Process Flows. Significant setup.",
            "Workflow automation at Growth+ ($99/user). Basic sequences.",
        ],
    },
    {
        name: "Form Builder",
        tag: "TOOLS",
        ratings: [5, 2, 4, 4, 3, 2, 3, 3, 1],
        details: [
            "Built-in form builder. AI-suggested fields. Drag-and-drop. Free — no paywall.",
            "Web-to-Lead is basic HTML. Real builder needs Pardot ($1,250+/mo).",
            "Excellent forms on free tier. Smart forms with progressive profiling at Pro+.",
            "Zoho Forms (separate but integrated). 40+ field types. AI-generated forms.",
            "LeadBooster add-on ($). Chatbot for conversational capture. Basic forms.",
            "Basic form views. Not purpose-built for lead capture. Limited customization.",
            "Native web forms. Code-free. CRM field mapping. Functional but basic.",
            "Dynamics Marketing forms. Decent builder. Requires Marketing module ($$$).",
            "No native form builder. Relies on 3rd-party integrations.",
        ],
    },
    {
        name: "Signature Builder",
        tag: "TOOLS",
        ratings: [5, 1, 3, 2, 1, 1, 2, 1, 1],
        details: [
            "Dedicated free builder. Professional branded. Export to Gmail/Outlook/Apple Mail.",
            "No native builder. HTML signature field. Requires Sigstr/Opensense.",
            "Basic free generator on website. Limited templates. No CRM integration.",
            "HTML editor in settings. Merge fields. Requires HTML knowledge.",
            "No builder. Plain text signature field only.",
            "No email signature functionality whatsoever.",
            "Basic signature field. No visual builder.",
            "No native builder. Relies on Exchange/Outlook.",
            "Basic text signature field only.",
        ],
    },
    {
        name: "Pricing Value",
        tag: "VALUE",
        ratings: [5, 2, 2, 4, 3, 3, 4, 2, 3],
        details: [
            "$0–$79/user/mo. AI included at every tier. No add-on tax. Annual saves 20%.",
            "$25-350/user + $125 AI + credits. TCO 2-3x quoted. 10 users: $2,900+/mo.",
            "Free attractive, scaling punishing. Pro $500+/mo per hub + $3-6K onboarding.",
            "$14-52/user. Best value among legacy CRMs. Zia needs Enterprise ($40/user).",
            "$14-79/user. Add-ons drive real costs up. Fully loaded: ~$100/user.",
            "$12-28/user (min 3 seats). Feature-gated. No AI agents at any price.",
            "$9-59/user. Functional start is Pro at $39/user. No voice AI.",
            "$65-195/user + Copilot ($30) + credits + Azure. 10 users: $2,500+/mo.",
            "$9-139/user. Power Dialer at $99/user. Phone costs extra. 10 users: $1,400+/mo.",
        ],
    },
    {
        name: "Free Tier",
        tag: "VALUE",
        ratings: [5, 1, 3, 3, 1, 2, 3, 1, 1],
        details: [
            "Starter $0: 2 users, 1M AI tokens, 100 LeadGen credits, 500 emails. No forced branding.",
            "No free tier. Developer Edition not for production. 30-day trial only.",
            "Free CRM exists. HubSpot branding forced. No automation. 2K email limit.",
            "Free for 3 users. Core CRM features. No AI. Limited automation.",
            "No free tier. 14-day trial only.",
            "Free for 2 users. Very basic. No email sync. No automation.",
            "Free for 3 users. Built-in telephony. Basic CRM. No AI/automation.",
            "No free tier. 30-day trial. Enterprise pricing from day one.",
            "No free tier. 14-day trial. Solo at $9 (1 user, 10K leads).",
        ],
    },
    {
        name: "Integrations",
        tag: "INFRA",
        ratings: [4, 5, 5, 4, 4, 4, 4, 5, 3],
        details: [
            "Open API + Webhooks. Gmail, Outlook, Calendar, Twilio, Slack, Stripe, OpenAI, ElevenLabs.",
            "Industry leader. AppExchange 7,000+ integrations. MuleSoft.",
            "1,500+ marketplace integrations. Strong Gmail/Outlook native. Excellent breadth.",
            "800+ integrations. 45+ Zoho apps. PhoneBridge. Zoho Flow.",
            "400+ marketplace integrations. Zapier support. Good coverage.",
            "Strong marketplace. Zapier, Make.com support. Popular tool integrations.",
            "Freshworks ecosystem. 100+ native integrations. Freshcaller/Freshchat.",
            "Deep Microsoft ecosystem (M365, Teams, Power Platform, Azure, LinkedIn).",
            "100+ integrations. Zapier support. Focused on sales-specific tools.",
        ],
    },
    {
        name: "Security & Compliance",
        tag: "INFRA",
        ratings: [5, 5, 4, 4, 3, 3, 3, 5, 3],
        details: [
            "AES-256-GCM. SOC2-ready. RBAC. Scoped API tokens. PII redaction. GDPR/CCPA/6 more.",
            "Industry-leading. SOC2 Type II. Einstein Trust Layer. Shield ($). FedRAMP.",
            "SOC2 Type II. GDPR. SSO. Role-based permissions. Adequate.",
            "SOC2. GDPR tools. Own data centers. IP restriction.",
            "SOC2. GDPR. Basic roles. AES-256. 2FA. Adequate for SMBs.",
            "SOC2. HIPAA at Enterprise. Role-based access. Basic audit logs.",
            "SOC2. GDPR. Basic roles. IP whitelisting on higher tiers.",
            "Enterprise-grade Microsoft security. SOC2, ISO 27001, FedRAMP. Customer Lockbox.",
            "SOC2 Type II. GDPR. Basic security. Roles at Scale ($139/user).",
        ],
    },
    {
        name: "UI/UX Design",
        tag: "EXPERIENCE",
        ratings: [5, 3, 4, 2, 4, 4, 4, 3, 4],
        details: [
            "Premium neural dark theme. 11 theme presets. Glass-panel design. Micro-animations.",
            "Lightning is functional but cluttered. Steep learning curve. Designed by committee.",
            "Clean, modern, consumer-grade UX. Easy to navigate. Well-organized.",
            "Functional but dated. Cluttered. Canvas redesign helps but still 2015-era.",
            "Best-in-class simplicity. Clean visual pipeline. Designed for CRM-haters.",
            "Highly visual and colorful. Great boards. Fun. Can overwhelm for CRM.",
            "Clean, modern interface. Well-organized. Easy onboarding. Solid.",
            "Power Platform UI is dense. Model-driven apps. Good for power users.",
            "Clean, minimal interface. Built for speed. Activity-centric layout.",
        ],
    },
    {
        name: "Customization",
        tag: "EXPERIENCE",
        ratings: [5, 5, 3, 4, 3, 4, 3, 5, 2],
        details: [
            "Custom fields/modules/objects. Guard Rules. Open API. 11 themes. Open-source core.",
            "Industry leader. Apex, Visualforce, LWC. Custom objects. Infinitely customizable.",
            "Custom objects at Enterprise. Custom properties. Limited vs enterprise CRMs.",
            "Deluge scripting. Custom modules. Canvas UI. Zoho Creator. Strong value.",
            "Custom fields/activities. Limited deep customization. No custom code.",
            "Flexible boards. Custom columns, automations, apps. monday Apps Framework.",
            "Custom modules/fields. Basic workflow customization. Limited extensibility.",
            "Power Platform (Apps, Automate, BI). Custom entities. C# plugins.",
            "Custom fields/activities. API access. Limited in-platform customization.",
        ],
    },
    {
        name: "Customer Support",
        tag: "EXPERIENCE",
        ratings: [5, 3, 4, 3, 4, 3, 4, 3, 4],
        details: [
            "Standard + Premium tiers. Dedicated CSM. KB, videos, community. Real humans.",
            "Premier support is $$$. Standard is slow. Trailhead is excellent.",
            "Good at Pro+. HubSpot Academy excellent. Community. Free = community-only.",
            "Good value. Standard included. Premium available. Can be slow at peak.",
            "Live chat all plans. Fast response. Good KB. Strong reputation.",
            "Ticketing support. Priority on higher tiers. Monday Academy. Adequate.",
            "24/5 all plans. 24/7 on Enterprise. Responsive team. Good docs.",
            "Microsoft Unified Support ($$$). Standard adequate. Partner-heavy.",
            "Strong reputation. Fast response. Self-onboarding focused. Good docs.",
        ],
    },
];

/* ────────── HELPERS ────────── */
function StarRating({ count, highlight, size = "sm" }: { count: Rating; highlight?: boolean; size?: "sm" | "lg" }) {
    const sz = size === "lg" ? "w-4 h-4" : "w-3 h-3";
    return (
        <div className="flex items-center gap-0.5 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`${sz} ${i < count
                        ? highlight
                            ? "text-cyan-400 fill-cyan-400"
                            : "text-yellow-500 fill-yellow-500"
                        : "text-white/10"
                        }`}
                />
            ))}
        </div>
    );
}

function getTotals() {
    return competitors.map((_, ci) => {
        const total = categories.reduce((sum, cat) => sum + cat.ratings[ci], 0);
        const max = categories.length * 5;
        return { total, max, avg: (total / categories.length).toFixed(2) };
    });
}

/* ────────── COMPONENT ────────── */
export default function RatingsClient() {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const totals = getTotals();

    return (
        <>
            {/* Hero */}
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400 backdrop-blur-sm mb-6">
                        <Trophy className="w-4 h-4 mr-2" />
                        <span>16 Categories • 8 Competitors • 1 Winner</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                        The Definitive CRM<br /> Comparison
                    </h1>
                    <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl leading-relaxed mb-8">
                        Every feature. Every competitor. Star-rated and sourced from official product pages, independent reviews, and hands-on analysis.
                    </p>
                </div>
            </section>

            {/* Pricing Quick Bar */}
            <section className="pb-16">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {[
                            { label: "BasaltCRM Scale", price: "$79", sub: "/seat/mo", accent: true },
                            { label: "Salesforce + AI", price: "$290+", sub: "/user/mo" },
                            { label: "HubSpot Pro", price: "$500+", sub: "/mo per hub" },
                            { label: "Dynamics + Copilot", price: "$125+", sub: "/user/mo" },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className={`rounded-2xl p-5 text-center border ${item.accent
                                    ? "border-cyan-500/30 bg-cyan-500/5"
                                    : "border-white/10 bg-white/5"
                                    }`}
                            >
                                <div className={`text-2xl font-black ${item.accent ? "text-cyan-400" : "text-gray-400"}`}>
                                    {item.price}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">{item.sub}</div>
                                <div className={`text-xs mt-1 ${item.accent ? "text-cyan-500" : "text-gray-500"}`}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Full Ratings Table */}
            <section className="pb-20">
                <div className="container px-4 md:px-6">
                    <div className="rounded-3xl border border-white/10 overflow-hidden bg-[#0A0A12] shadow-[0_0_80px_rgba(6,182,212,0.05)] max-w-[1400px] mx-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4 text-gray-400 font-medium text-xs sticky left-0 bg-[#0A0A12] z-20 w-[180px]">
                                            Category
                                        </th>
                                        {competitors.map((c) => (
                                            <th
                                                key={c.key}
                                                className={`p-4 text-center text-xs font-bold min-w-[100px] ${c.highlight
                                                    ? "bg-cyan-500/5 border-l border-r border-cyan-500/20 text-cyan-400"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {c.highlight && (
                                                    <div className="text-[8px] font-mono tracking-widest uppercase text-cyan-500 mb-1">★ LEADER</div>
                                                )}
                                                <span className="hidden md:inline">{c.name}</span>
                                                <span className="md:hidden">{c.name.split(" ")[0]}</span>
                                            </th>
                                        ))}
                                        <th className="p-4 w-[40px]" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat, idx) => (
                                        <React.Fragment key={cat.name}>
                                            <tr
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                            >
                                                <td className="p-4 sticky left-0 bg-[#0A0A12] z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-mono text-gray-600 tracking-widest">{cat.tag}</span>
                                                    </div>
                                                    <div className="text-gray-300 font-medium text-sm">{cat.name}</div>
                                                </td>
                                                {cat.ratings.map((rating, i) => (
                                                    <td
                                                        key={i}
                                                        className={`p-4 text-center ${i === 0
                                                            ? "bg-cyan-500/5 border-l border-r border-cyan-500/10"
                                                            : ""
                                                            }`}
                                                    >
                                                        <StarRating count={rating} highlight={i === 0} />
                                                    </td>
                                                ))}
                                                <td className="p-4 text-center">
                                                    {expandedRow === idx
                                                        ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                                        : <ChevronDown className="w-4 h-4 text-gray-500" />
                                                    }
                                                </td>
                                            </tr>

                                            {/* Expandable Detail Row */}
                                            <AnimatePresence>
                                                {expandedRow === idx && (
                                                    <tr>
                                                        <td colSpan={competitors.length + 2} className="p-0">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="overflow-hidden bg-white/[0.02] border-b border-white/5"
                                                            >
                                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    {competitors.map((c, ci) => (
                                                                        <div
                                                                            key={c.key}
                                                                            className={`p-4 rounded-xl border ${c.highlight
                                                                                ? "border-cyan-500/20 bg-cyan-500/5"
                                                                                : "border-white/5 bg-white/5"
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className={`text-xs font-bold ${c.highlight ? "text-cyan-400" : "text-gray-300"}`}>
                                                                                    {c.name}
                                                                                </span>
                                                                                <StarRating count={cat.ratings[ci]} highlight={c.highlight} />
                                                                            </div>
                                                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                                                {cat.details[ci]}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}

                                    {/* Total Score Row */}
                                    <tr className="border-t-2 border-white/10 bg-white/5">
                                        <td className="p-4 sticky left-0 bg-[#0d0d15] z-10">
                                            <div className="text-white font-bold text-sm">Overall Score</div>
                                            <div className="text-[9px] font-mono text-gray-500">OUT OF {categories.length * 5}</div>
                                        </td>
                                        {totals.map((t, i) => (
                                            <td
                                                key={i}
                                                className={`p-4 text-center ${i === 0
                                                    ? "bg-cyan-500/10 border-l border-r border-cyan-500/20"
                                                    : ""
                                                    }`}
                                            >
                                                <div className={`text-xl font-black ${i === 0 ? "text-cyan-400" : "text-gray-400"}`}>
                                                    {t.total}
                                                </div>
                                                <div className={`text-[10px] font-mono ${i === 0 ? "text-cyan-500" : "text-gray-500"}`}>
                                                    {t.avg} avg
                                                </div>
                                            </td>
                                        ))}
                                        <td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages Section */}
            <section className="pb-20">
                <div className="container px-4 md:px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Unfair Advantages</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: Zap,
                                    title: "Autonomous Agentic AI Scraper",
                                    desc: "Self-correcting lead discovery with zero human input. Define your ICP in plain English and our AI handles the rest — searching, scoring, saving.",
                                },
                                {
                                    icon: Shield,
                                    title: "BasaltEcho Voice Engine",
                                    desc: "0.12s latency voice AI that sells and supports at 500 calls/hr. WebRTC + ElevenLabs neural TTS. Multi-language. No competitor matches this.",
                                },
                                {
                                    icon: DollarSign,
                                    title: "AI Included at Every Tier",
                                    desc: "$0 Starter includes 1M AI tokens. The $79 Scale plan bundles more AI than a $290/seat Salesforce stack. No consumption credits or add-on tax.",
                                },
                                {
                                    icon: Trophy,
                                    title: "Free Signature + Form Builder",
                                    desc: "No login wall. No paywall. Professional email signatures and embeddable lead forms — forever free. No competitor offers both at no cost.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-500/30 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                                        <item.icon className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-black/20 border-t border-white/5">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to Switch?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Start free. Scale to $79/seat. Get more AI capability than platforms charging 3x the price.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                Start Free <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/compare">
                            <Button size="lg" variant="outline" className="rounded-full border-white/20 hover:bg-white/10">
                                View 1v1 Comparisons
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
