import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import Link from "next/link";
import { ArrowLeft, Webhook, Shield, Bell, Zap, Server, CheckCircle2 } from "lucide-react";

export const metadata = {
    title: "Webhooks - BasaltCRM Developers",
    description: "Real-time event notifications for your external applications. Configure webhooks for payment confirmations, voice events, email status, and form submissions.",
};

const cardClass = "p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all";
const codeBlockClass = "bg-[#0a0a0a] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-x-auto text-gray-300 leading-relaxed";
const sectionTitle = "text-2xl font-semibold mt-14 mb-6 text-white flex items-center";
const badgeClass = (color: string) => `inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${color}`;

const WEBHOOK_ENDPOINTS = [
    {
        name: "SURGE Payment Webhook",
        endpoint: "POST /api/webhooks/surge",
        icon: <Zap className="w-5 h-5 text-amber-400" />,
        color: "border-amber-500/30 bg-amber-500/5",
        security: "HMAC-SHA256 via X-Surge-Signature header",
        secretEnv: "SURGE_WEBHOOK_SECRET",
        events: [
            { type: "payment.confirmed", desc: "Payment has been confirmed on-chain. Invoice is marked PAID, linked Opportunity is moved to Close Won." },
            { type: "payment.succeeded", desc: "Alias for payment.confirmed. Triggers the same pipeline update." },
        ],
        payload: `{
  "type": "payment.confirmed",
  "data": {
    "id": "pay_abc123",
    "external_id": "inv_64f...",  // Your Invoice ID
    "amount": "499.00",
    "currency": "USDC",
    "network": "base",
    "tx_hash": "0x..."
  }
}`,
        sideEffects: [
            "Updates Invoice → PAID status",
            "Fulfills LeadGen Credits (if applicable)",
            "Syncs Mercury bank invoice",
            "Moves linked Opportunity → Closed Won",
        ],
    },
    {
        name: "BasaltECHO Voice Events",
        endpoint: "POST /api/voice/engage/webhook",
        icon: <Bell className="w-5 h-5 text-cyan-400" />,
        color: "border-cyan-500/30 bg-cyan-500/5",
        security: "HMAC-SHA256 via x-voicehub-signature header (optional)",
        secretEnv: "VOICEHUB_WEBHOOK_SECRET",
        events: [
            { type: "tool_call (schedule_meeting)", desc: "AI agent requested to schedule a meeting. Creates a calendar event and advances lead pipeline to Engage_Human." },
            { type: "call_connected", desc: "Outbound or inbound call has been connected. Updates lead call_status to CONNECTED." },
            { type: "call_ended", desc: "Call has ended. Logs duration, updates lead status, and queues follow-up intent." },
        ],
        payload: `{
  "type": "tool_call",
  "name": "schedule_meeting",
  "leadId": "lead_64f...",
  "args": {
    "datetime": "2026-03-01T15:00:00Z",
    "timezone": "America/Denver"
  },
  "eventId": "evt_unique_123",
  "ts": 1740862800000
}`,
        sideEffects: [
            "Creates meeting via /api/outreach/meeting/[leadId]",
            "Advances lead pipeline stage",
            "Logs activity with idempotency (duplicate eventId detection)",
        ],
    },
    {
        name: "Resend Email Events",
        endpoint: "POST /api/resend/webhook",
        icon: <Server className="w-5 h-5 text-emerald-400" />,
        color: "border-emerald-500/30 bg-emerald-500/5",
        security: "Resend signature header (recommended in production)",
        secretEnv: "RESEND_WEBHOOK_SECRET",
        events: [
            { type: "email.bounced", desc: "Email bounced — updates outreach status to prevent further sends." },
            { type: "email.delivered", desc: "Email successfully delivered to inbox." },
            { type: "email.opened", desc: "Recipient opened the email (tracking pixel)." },
            { type: "email.complained", desc: "Recipient marked email as spam." },
        ],
        payload: `{
  "type": "email.delivered",
  "data": {
    "email_id": "msg_abc",
    "to": "prospect@company.com",
    "subject": "Re: Partnership Opportunity",
    "created_at": "2026-02-27T20:00:00Z"
  }
}`,
        sideEffects: [
            "Updates outreach record status (SENT → OPENED)",
            "Enriches lead activity timeline",
        ],
    },
    {
        name: "Azure AI / OpenAI Realtime",
        endpoint: "POST /api/azure/webhook",
        icon: <Webhook className="w-5 h-5 text-purple-400" />,
        color: "border-purple-500/30 bg-purple-500/5",
        security: "HMAC-SHA256 via Webhook-Signature header (Standard Webhooks)",
        secretEnv: "OPENAI_WEBHOOK_SECRET / AZURE_OPENAI_WEBHOOK_SECRET",
        events: [
            { type: "response.completed", desc: "AI model response generation completed." },
            { type: "response.failed", desc: "Model response generation failed." },
            { type: "realtime.call.incoming", desc: "Incoming call detected on Azure Communication Services." },
        ],
        payload: `{
  "type": "response.completed",
  "id": "evt_abc",
  "data": {
    "session_id": "sess_xyz",
    "model": "gpt-4o-realtime",
    "duration_ms": 3200
  }
}`,
        sideEffects: [
            "Logs event for analytics",
            "Routes incoming calls to appropriate handlers",
        ],
    },
    {
        name: "Form Submission Webhook",
        endpoint: "Configured per-form via webhook_url",
        icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />,
        color: "border-sky-500/30 bg-sky-500/5",
        security: "Outbound webhook — your endpoint receives POST requests",
        secretEnv: "N/A (configured in Form Builder UI)",
        events: [
            { type: "form.submitted", desc: "A new form submission was received. Payload includes extracted lead data and UTM parameters." },
        ],
        payload: `{
  "form_id": "64f...",
  "form_name": "Contact Us",
  "submission_id": "64f...",
  "submitted_at": "2026-02-27T20:30:00Z",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "message": "Interested in the PRO plan"
  },
  "utm": {
    "source": "google",
    "medium": "cpc",
    "campaign": "spring_2026"
  }
}`,
        sideEffects: [
            "Creates lead record (if field mapping configured)",
            "Sends auto-respond email (if enabled)",
            "Notifies configured email addresses",
        ],
    },
];

export default function WebhooksPage() {
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
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 mb-2">
                                Webhooks
                            </h1>
                            <p className="text-lg text-gray-400 max-w-3xl">
                                Receive real-time event notifications from BasaltCRM. Webhooks push data to your
                                endpoints when key events occur — payments, voice calls, email delivery, and form submissions.
                            </p>
                        </div>

                        {/* How Webhooks Work */}
                        <div className={cardClass + " mb-12"}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg bg-cyan-950/40">
                                    <Webhook className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-bold">How Webhooks Work</h2>
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                {[
                                    { step: "01", label: "Event Fires", desc: "An action occurs in BasaltCRM (payment, call, email)." },
                                    { step: "02", label: "Payload Built", desc: "A JSON payload is constructed with event type and data." },
                                    { step: "03", label: "Signature Added", desc: "HMAC-SHA256 signature is computed and attached as a header." },
                                    { step: "04", label: "POST Delivered", desc: "HTTP POST sent to your endpoint. Expects a 2xx response." },
                                ].map((item) => (
                                    <div key={item.step} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <div className="text-2xl font-bold text-cyan-400 font-mono mb-2">{item.step}</div>
                                        <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
                                        <div className="text-xs text-gray-500">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Signature Verification */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-red-500 mr-3 rounded-full" />
                            Signature Verification
                        </h2>
                        <p className="text-gray-400 mb-5 leading-relaxed">
                            Always verify webhook signatures in production to prevent forged events. BasaltCRM signs webhook
                            payloads using <strong className="text-white">HMAC-SHA256</strong> with your configured secret.
                        </p>
                        <div className={codeBlockClass + " mb-12"}>
                            {`import crypto from "crypto";

function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Usage in your endpoint:
const isValid = verifyWebhookSignature(
  rawBody,
  req.headers["x-surge-signature"],
  process.env.SURGE_WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: "Invalid signature" });
}`}
                        </div>

                        {/* Webhook Endpoints */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-cyan-500 mr-3 rounded-full" />
                            Webhook Endpoints
                        </h2>

                        <div className="space-y-8">
                            {WEBHOOK_ENDPOINTS.map((webhook) => (
                                <div key={webhook.name} className={`rounded-2xl border ${webhook.color} overflow-hidden`}>
                                    {/* Header */}
                                    <div className="p-6 border-b border-white/5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-white/5">{webhook.icon}</div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{webhook.name}</h3>
                                                <code className="text-xs font-mono text-gray-400">{webhook.endpoint}</code>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                                            <span><Shield className="w-3 h-3 inline mr-1" />{webhook.security}</span>
                                            <span>Env: <code className="text-gray-400">{webhook.secretEnv}</code></span>
                                        </div>
                                    </div>

                                    {/* Events */}
                                    <div className="p-6 border-b border-white/5">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Events</h4>
                                        <div className="space-y-2">
                                            {webhook.events.map((evt, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <code className="text-xs font-mono text-primary bg-black/30 px-2 py-1 rounded border border-white/5 shrink-0 mt-0.5">{evt.type}</code>
                                                    <p className="text-sm text-gray-400">{evt.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payload Example */}
                                    <div className="p-6 border-b border-white/5">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Example Payload</h4>
                                        <div className={codeBlockClass}>{webhook.payload}</div>
                                    </div>

                                    {/* Side Effects */}
                                    <div className="p-6">
                                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Automated Side Effects</h4>
                                        <ul className="space-y-2">
                                            {webhook.sideEffects.map((effect, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    {effect}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Best Practices */}
                        <div className="mt-16 p-8 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                            <h3 className="text-lg font-bold text-cyan-400 mb-4">Best Practices</h3>
                            <ul className="space-y-3 text-gray-400">
                                <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">•</span> <strong className="text-white">Respond quickly.</strong> Return a 200 status within 5 seconds. Process heavy logic asynchronously.</li>
                                <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">•</span> <strong className="text-white">Handle duplicates.</strong> Use the <code className="text-xs font-mono bg-black/30 px-1 py-0.5 rounded border border-white/5">eventId</code> field for idempotent processing.</li>
                                <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">•</span> <strong className="text-white">Verify signatures.</strong> Always validate HMAC signatures in production to prevent replay attacks.</li>
                                <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">•</span> <strong className="text-white">Use HTTPS.</strong> Webhook endpoints must use TLS/SSL. HTTP endpoints are rejected.</li>
                            </ul>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
