import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import Link from "next/link";
import { ArrowLeft, Workflow, Bot, Mail, PhoneCall, Clock, GitBranch, FileText, SquareArrowOutUpRight, Sparkles, CheckCircle2 } from "lucide-react";

export const metadata = {
    title: "Workflows & Automation - BasaltCRM Developers",
    description: "Extend BasaltCRM with FlowState visual workflows, AI outreach sequences, LeadGen automation, voice agents, and custom cron jobs.",
};

const cardClass = "p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors";
const codeBlockClass = "bg-[#0a0a0a] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-x-auto text-gray-300 leading-relaxed";
const sectionTitle = "text-2xl font-semibold mt-14 mb-6 text-white flex items-center";

const AUTOMATION_CARDS = [
    {
        icon: <Workflow className="w-8 h-8 text-cyan-400" />,
        title: "FlowState",
        subtitle: "Visual Node-Based Builder",
        desc: "Drag-and-drop workflow editor powered by React Flow. Connect triggers, actions, and logic nodes to create complex automations without code.",
        features: ["If/Else branching", "Delays & scheduling", "Multi-step sequences", "Execution logs & debugging"],
        color: "border-cyan-500/20",
    },
    {
        icon: <Mail className="w-8 h-8 text-emerald-400" />,
        title: "Outreach Sequences",
        subtitle: "Multi-Channel Campaigns",
        desc: "Automated email, SMS, and task sequences with AI personalization. Build once, run at scale across your entire pipeline.",
        features: ["AI-generated icebreakers", "Conditional branching", "Multi-step with delays", "Opens / clicks / replies tracking"],
        color: "border-emerald-500/20",
    },
    {
        icon: <Bot className="w-8 h-8 text-purple-400" />,
        title: "LeadGen Wizard",
        subtitle: "Autonomous Prospecting",
        desc: "AI agents autonomously discover, qualify, and stage prospects for human approval. Runs Basic (SERP) or Advanced (LLM Deep Research) modes.",
        features: ["ICP-based targeting", "Global dedup & compliance", "Credit-based usage", "Human-in-the-loop staging"],
        color: "border-purple-500/20",
    },
    {
        icon: <PhoneCall className="w-8 h-8 text-amber-400" />,
        title: "BasaltECHO Agents",
        subtitle: "AI Voice Automation",
        desc: "Deploy AI voice agents for inbound support and outbound prospecting. Agents can book meetings, update CRM records, and route calls — all via webhooks.",
        features: ["Real-time WebRTC streaming", "Calendar integration", "CRM context injection", "Webhook event pipeline"],
        color: "border-amber-500/20",
    },
];

const CRON_JOBS = [
    { schedule: "Every 1 min", route: "/api/cron/outreach", desc: "Processes pending outreach steps — sends scheduled emails, SMS, and creates tasks." },
    { schedule: "Daily", route: "/api/cron/credits", desc: "Resets monthly credit quotas and checks for expired trial accounts." },
    { schedule: "Hourly", route: "/api/cron/enrichment", desc: "Re-crawls stale lead candidate data older than 90 days." },
    { schedule: "Every 5 min", route: "/api/cron/sync", desc: "Syncs email delivery events from Resend/SES and updates outreach statuses." },
];

const FLOWSTATE_NODES = [
    {
        category: "Triggers",
        color: "text-cyan-400",
        nodes: [
            "New Lead Created",
            "Deal Stage Changed",
            "Form Submitted",
            "Task Overdue",
            "Email Opened",
            "Call Ended",
            "Meeting Booked",
        ],
    },
    {
        category: "Actions",
        color: "text-emerald-400",
        nodes: [
            "Send Email",
            "Send SMS",
            "Create Task",
            "Update Record Field",
            "Assign to Rep",
            "Push Notification",
            "Create Project",
            "Generate Invoice",
            "Call Webhook",
        ],
    },
    {
        category: "Logic",
        color: "text-amber-400",
        nodes: [
            "If / Else Condition",
            "Delay (minutes / hours / days)",
            "Split Path",
            "Merge",
            "Loop",
            "Break",
        ],
    },
];

export default function WorkflowsPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-32 pb-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Back Link */}
                        <Link href="/developers" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors text-sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Developers
                        </Link>

                        {/* Hero */}
                        <div className="mb-16">
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 mb-2">
                                Workflows & Automation
                            </h1>
                            <p className="text-lg text-gray-400 max-w-3xl">
                                BasaltCRM&apos;s automation layer spans visual workflows, AI-driven sequences,
                                autonomous agents, and scheduled cron jobs. Build once, run continuously.
                            </p>
                        </div>

                        {/* Automation Engine Cards */}
                        <div className="grid md:grid-cols-2 gap-6 mb-16">
                            {AUTOMATION_CARDS.map((card) => (
                                <div key={card.title} className={`${cardClass} ${card.color}`}>
                                    <div className="mb-4">{card.icon}</div>
                                    <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{card.subtitle}</p>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{card.desc}</p>
                                    <div className="space-y-1.5">
                                        {card.features.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FlowState Node Reference */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-cyan-500 mr-3 rounded-full" />
                            FlowState Node Reference
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Every FlowState workflow is composed of three node types: <strong className="text-white">Triggers</strong> (what starts the flow),
                            <strong className="text-white"> Actions</strong> (what the system does), and <strong className="text-white">Logic</strong> (conditional routing).
                        </p>
                        <div className="grid md:grid-cols-3 gap-5 mb-16">
                            {FLOWSTATE_NODES.map((group) => (
                                <div key={group.category} className={cardClass}>
                                    <h3 className={`text-lg font-bold mb-4 ${group.color}`}>{group.category}</h3>
                                    <div className="space-y-2">
                                        {group.nodes.map((node, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                                <div className={`w-1.5 h-1.5 rounded-full ${group.color.replace("text-", "bg-")}`} />
                                                {node}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Outreach Sequence Architecture */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-emerald-500 mr-3 rounded-full" />
                            Sequence Architecture
                        </h2>
                        <p className="text-gray-400 mb-5 leading-relaxed">
                            Outreach sequences are multi-step, multi-channel campaigns that execute automatically on a schedule.
                            Each step can be an email, SMS, manual task, or a configurable delay.
                        </p>
                        <div className={codeBlockClass + " mb-12"}>
                            {`// Sequence Step Schema
{
  "sequence_id": "seq_abc",
  "steps": [
    {
      "type": "email",
      "delay_days": 0,
      "template": "intro_email",
      "ai_personalization": true     // AI writes unique icebreaker per lead
    },
    {
      "type": "delay",
      "delay_days": 3                // Wait 3 days before next step
    },
    {
      "type": "email",
      "delay_days": 0,
      "template": "follow_up_1",
      "condition": "!opened"         // Only send if previous was not opened
    },
    {
      "type": "task",
      "delay_days": 2,
      "description": "Call prospect — high intent signal detected"
    },
    {
      "type": "sms",
      "delay_days": 1,
      "message": "Hi {{firstName}}, quick follow up on our conversation..."
    }
  ]
}`}
                        </div>

                        {/* Pipeline Status Flow */}
                        <div className={cardClass + " mb-16"}>
                            <h3 className="text-lg font-semibold text-white mb-4">
                                <GitBranch className="w-4 h-4 inline mr-2 text-emerald-400" />
                                Outreach Status Pipeline
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                {["IDLE", "PENDING", "SENT", "OPENED", "MEETING_LINK_CLICKED", "MEETING_BOOKED", "CLOSED", "CONVERTED"].map((status, i, arr) => (
                                    <span key={status} className="flex items-center gap-2">
                                        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-gray-300 text-xs">{status}</span>
                                        {i < arr.length - 1 && <span className="text-gray-600">→</span>}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Cron Jobs */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-amber-500 mr-3 rounded-full" />
                            Scheduled Jobs (Cron)
                        </h2>
                        <p className="text-gray-400 mb-5 leading-relaxed">
                            Background jobs run on a schedule to process queued operations. These are implemented as serverless API routes
                            triggered by external schedulers (EventBridge, Vercel Cron, or Jenkins).
                        </p>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 mb-16">
                            {CRON_JOBS.map((job, i) => (
                                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5 w-24 justify-center">
                                        <Clock className="w-3 h-3 mr-1" />{job.schedule}
                                    </span>
                                    <div className="min-w-0">
                                        <code className="text-sm font-mono text-white/90">{job.route}</code>
                                        <p className="text-sm text-gray-500 mt-1">{job.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Building Custom Automations */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-purple-500 mr-3 rounded-full" />
                            Building Custom Automations
                        </h2>
                        <div className="space-y-5">
                            <p className="text-gray-400 leading-relaxed">
                                Extend BasaltCRM&apos;s automation layer by combining API endpoints, webhooks, and FlowState nodes.
                                Here&apos;s a common pattern for a post-call follow-up automation:
                            </p>
                            <div className={codeBlockClass}>
                                {`// Example: Post-Call Follow-Up Automation
//
// Webhook: BasaltECHO call_ended event
// → FlowState Trigger: "Call Ended"
// → Logic: If durationSec > 120 (meaningful call)
//     → Action: Create follow-up Task (2 day delay)
//     → Action: Send personalized email recap
//     → Action: Move lead to "Engage_Human" stage
// → Else (short call / no answer)
//     → Action: Schedule retry call (next day)
//     → Action: Send SMS with meeting link

POST /api/crm/workflows
{
  "name": "Post-Call Follow-Up",
  "trigger": "webhook:call_ended",
  "nodes": [
    { "type": "condition", "field": "durationSec", "op": ">", "value": 120 },
    { "type": "action", "action": "create_task", "delay": "2d" },
    { "type": "action", "action": "send_email", "template": "call_recap" },
    { "type": "action", "action": "update_field", "field": "pipeline_stage", "value": "Engage_Human" }
  ]
}`}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-3">Ready to automate?</h3>
                            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                                Start building workflows in the FlowState visual editor or integrate programmatically via the API.
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <Link href="/sign-in" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-colors text-sm">
                                    Open FlowState <SquareArrowOutUpRight className="w-4 h-4" />
                                </Link>
                                <Link href="/developers/api-reference" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-full transition-colors text-sm border border-white/10">
                                    API Reference
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
