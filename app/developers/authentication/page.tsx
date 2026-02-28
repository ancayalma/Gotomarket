import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import Link from "next/link";
import { ArrowLeft, Shield, Key, Fingerprint, Lock, UserCheck, Globe } from "lucide-react";

export const metadata = {
    title: "Authentication - BasaltCRM Developers",
    description: "Secure your BasaltCRM integrations with OAuth 2.0 + PKCE, API Keys, and NextAuth.js multi-provider authentication.",
};

const cardClass = "p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors";
const codeBlockClass = "bg-[#0a0a0a] border border-white/10 rounded-xl p-5 font-mono text-sm overflow-x-auto text-gray-300 leading-relaxed";
const sectionTitle = "text-2xl font-semibold mt-12 mb-6 text-white flex items-center";

export default function AuthenticationPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Back Link */}
                        <Link href="/developers" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors text-sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Developers
                        </Link>

                        {/* Hero */}
                        <div className="mb-16">
                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 mb-2">
                                Authentication
                            </h1>
                            <p className="text-lg text-gray-400 max-w-3xl">
                                BasaltCRM supports multiple authentication methods for different use cases — from user login to service-to-service integration.
                            </p>
                        </div>

                        {/* Auth Methods Overview */}
                        <div className="grid md:grid-cols-3 gap-5 mb-12">
                            {[
                                { icon: <UserCheck className="w-6 h-6 text-cyan-400" />, title: "NextAuth Session", desc: "Browser-based SSO for end users via Google, GitHub, or Azure AD." },
                                { icon: <Key className="w-6 h-6 text-emerald-400" />, title: "OAuth 2.0 + PKCE", desc: "Secure authorization code flow for third-party integrations." },
                                { icon: <Lock className="w-6 h-6 text-amber-400" />, title: "x402 Payment Auth", desc: "402 Protocol for Agent Commerce with USDC on Base network." },
                            ].map((item, i) => (
                                <div key={i} className={cardClass}>
                                    <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit">{item.icon}</div>
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* NextAuth.js Section */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-cyan-500 mr-3 rounded-full" />
                            NextAuth.js — User Authentication
                        </h2>
                        <div className="space-y-5">
                            <p className="text-gray-400 leading-relaxed">
                                BasaltCRM uses <strong className="text-white">NextAuth.js</strong> for all user-facing authentication.
                                Users sign in via OAuth providers (Google, GitHub, Azure AD), and sessions are managed server-side with JWT encryption.
                            </p>
                            <div className={cardClass}>
                                <h3 className="text-lg font-semibold mb-3 text-white">Supported Providers</h3>
                                <div className="grid gap-3">
                                    {[
                                        { provider: "Google", env: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", desc: "OAuth 2.0 via Google Workspace or personal accounts." },
                                        { provider: "GitHub", env: "GITHUB_ID / GITHUB_SECRET", desc: "OAuth App for developer-friendly login." },
                                        { provider: "Azure AD", env: "AZURE_AD_CLIENT_ID / AZURE_AD_TENANT_ID", desc: "Enterprise SSO for Microsoft-centric organizations." },
                                    ].map((p, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-white">{p.provider}</span>
                                                <code className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">{p.env}</code>
                                            </div>
                                            <p className="text-sm text-gray-500">{p.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-white">Session Structure</h3>
                                <div className={codeBlockClass}>
                                    {`// Server-side: getServerSession(authOptions)
{
  user: {
    id: "64f...",            // MongoDB ObjectId
    name: "Jane Doe",
    email: "jane@example.com",
    image: "https://...",
    role: "ADMIN",           // TeamRole enum
    teamId: "64f...",        // Active team scope
    teamRole: "SUPER_ADMIN"
  }
}`}
                                </div>
                            </div>
                        </div>

                        {/* OAuth 2.0 + PKCE Section */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-emerald-500 mr-3 rounded-full" />
                            OAuth 2.0 + PKCE — Service Integration
                        </h2>
                        <div className="space-y-5">
                            <p className="text-gray-400 leading-relaxed">
                                For service-to-service integrations (e.g., BasaltECHO connecting to your CRM), BasaltCRM implements the
                                <strong className="text-white"> Authorization Code + PKCE</strong> flow. This is the recommended method for third-party applications.
                            </p>

                            {/* Flow Steps */}
                            <div className="space-y-4">
                                {[
                                    {
                                        step: "1",
                                        title: "Authorization Request",
                                        desc: "Redirect the user to the BasaltCRM authorization endpoint.",
                                        code: `GET /api/oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-app.com/callback
  &scope=softphone:control outreach:write leads:read
  &state=random-csrf-string
  &code_challenge=BASE64URL(SHA256(code_verifier))
  &code_challenge_method=S256`
                                    },
                                    {
                                        step: "2",
                                        title: "User Consent",
                                        desc: "BasaltCRM presents a branded consent screen. The user approves access, and the browser redirects back to your redirect_uri with an authorization code.",
                                        code: `302 → https://your-app.com/callback
  ?code=auth_a1b2c3d4...
  &state=random-csrf-string`
                                    },
                                    {
                                        step: "3",
                                        title: "Token Exchange",
                                        desc: "Exchange the authorization code for access and refresh tokens.",
                                        code: `POST /api/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "auth_a1b2c3d4...",
  "redirect_uri": "https://your-app.com/callback",
  "client_id": "YOUR_CLIENT_ID",
  "code_verifier": "your_original_verifier"
}`
                                    },
                                    {
                                        step: "4",
                                        title: "Token Response",
                                        desc: "Receive your access token and use it to call BasaltCRM APIs.",
                                        code: `{
  "access_token": "access_64f..._abc123",
  "refresh_token": "refresh_64f..._xyz789",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "softphone:control outreach:write leads:read",
  "user_id": "64f..."
}`
                                    },
                                ].map((step) => (
                                    <div key={step.step} className={cardClass}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                                                {step.step}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                                                <p className="text-sm text-gray-400 mb-3">{step.desc}</p>
                                                <div className={codeBlockClass}>{step.code}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Scopes Table */}
                            <div className={cardClass}>
                                <h3 className="text-lg font-semibold mb-4 text-white">Available Scopes</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-left">
                                                <th className="pb-3 text-gray-400 font-medium">Scope</th>
                                                <th className="pb-3 text-gray-400 font-medium">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[
                                                ["softphone:control", "Control BasaltECHO voice sessions — start, stop, push prompts."],
                                                ["outreach:write", "Create and manage outreach sequences and campaigns."],
                                                ["leads:read", "Read-only access to leads, contacts, and pipeline data."],
                                                ["leads:write", "Create, update, and delete lead records."],
                                                ["accounts:read", "Read-only access to account records."],
                                                ["projects:read", "Access project boards and task data."],
                                            ].map(([scope, desc], i) => (
                                                <tr key={i}>
                                                    <td className="py-3 pr-4">
                                                        <code className="text-primary font-mono text-xs bg-black/30 px-2 py-1 rounded border border-white/5">{scope}</code>
                                                    </td>
                                                    <td className="py-3 text-gray-400">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* x402 Payment Section */}
                        <h2 className={sectionTitle}>
                            <span className="w-1 h-6 bg-amber-500 mr-3 rounded-full" />
                            x402 Protocol — Agent Commerce
                        </h2>
                        <div className="space-y-5">
                            <p className="text-gray-400 leading-relaxed">
                                The Agent Commerce API uses the <strong className="text-white">HTTP 402 Payment Required</strong> protocol.
                                Clients receive a payment challenge, settle on-chain with USDC on Base, then pass the payment proof in the <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-400 font-mono text-xs border border-white/10">Authorization: Payment &lt;proof&gt;</code> header.
                            </p>
                            <div className={codeBlockClass}>
                                {`# 1. Request a resource without payment → 402 challenge
GET /api/v1/agent/purchase/agent-sdr-01

# Response: 402 Payment Required
{
  "recipient": "0x_merchant_wallet",
  "amount": "99.00",
  "network": "base",
  "token": "usdc"
}

# 2. Pay on-chain, then retry with proof
GET /api/v1/agent/purchase/agent-sdr-01
Authorization: Payment <on-chain-proof>

# Response: 200 OK
{
  "success": true,
  "resource": "https://agents.basalthq.com/deploy/sdr-01"
}`}
                            </div>
                        </div>

                        {/* Security Notes */}
                        <div className="mt-16 p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-red-400" />
                                <h3 className="text-lg font-bold text-red-400">Security Best Practices</h3>
                            </div>
                            <ul className="space-y-3 text-gray-400 leading-relaxed">
                                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span> Never expose API keys or OAuth client secrets in client-side code.</li>
                                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span> Always use PKCE (<code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-red-300 border border-white/5">S256</code>) for OAuth flows — plain code challenges are rejected.</li>
                                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span> Verify webhook signatures using HMAC-SHA256 in production environments.</li>
                                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span> Rotate tokens periodically and use short-lived access tokens (1h default).</li>
                                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span> Use <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-red-300 border border-white/5">NEXTAUTH_SECRET</code> with 256+ bits of entropy for JWT encryption.</li>
                            </ul>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
