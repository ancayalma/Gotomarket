import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import { Book, Code, Github, Terminal, Zap, Shield, Globe, Webhook, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Developers - BasaltCRM",
  description: "Comprehensive resources, guides, and API references for building with BasaltCRM. Documentation, OAuth, Webhooks, and Automation.",
};

const CARDS = [
  {
    icon: <Book className="w-6 h-6 text-cyan-400" />,
    title: "Documentation",
    description: "Deep dive into BasaltCRM's architecture, core concepts, and 26 comprehensive guides covering every module.",
    href: "/docs",
    tag: "26 Articles",
    tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    icon: <Terminal className="w-6 h-6 text-emerald-400" />,
    title: "API Reference",
    description: "Complete REST API reference covering 60+ endpoints for Leads, Contacts, Accounts, Projects, Invoices, and Agent Commerce.",
    href: "/developers/api-reference",
    tag: "REST",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: <Shield className="w-6 h-6 text-amber-400" />,
    title: "Authentication",
    description: "Secure your integrations with NextAuth.js SSO, OAuth 2.0 + PKCE authorization flows, and x402 payment protocol.",
    href: "/developers/authentication",
    tag: "OAuth + PKCE",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    icon: <Webhook className="w-6 h-6 text-purple-400" />,
    title: "Webhooks",
    description: "Real-time event notifications for payments, voice calls, email delivery, and form submissions with HMAC signature verification.",
    href: "/developers/webhooks",
    tag: "5 Integrations",
    tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    icon: <Zap className="w-6 h-6 text-rose-400" />,
    title: "Workflows & Automation",
    description: "Build custom automations with FlowState visual editor, AI outreach sequences, LeadGen Wizard, and scheduled cron jobs.",
    href: "/developers/workflows",
    tag: "FlowState",
    tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  {
    icon: <Github className="w-6 h-6 text-gray-400" />,
    title: "Contributing",
    description: "Fork the repo, explore the codebase, and contribute to BasaltCRM's open-source core. Join our Discord for engineering support.",
    href: "https://github.com/BasaltHQ/crm-official",
    tag: "Open Source",
    tagColor: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    external: true,
  },
];

const QUICK_LINKS = [
  { label: "Self-Hosting Guide", href: "/docs/api-reference", icon: <Code className="w-4 h-4" /> },
  { label: "BasaltECHO Voice API", href: "/developers/webhooks", icon: <Globe className="w-4 h-4" /> },
  { label: "Agent Commerce (x402)", href: "/developers/api-reference", icon: <Zap className="w-4 h-4" /> },
  { label: "FlowState Node Reference", href: "/developers/workflows", icon: <Terminal className="w-4 h-4" /> },
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 z-0">
        <GeometricBackground />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <BasaltNavbar />

        <main className="flex-grow pt-32 pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-20">
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">
                Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Future</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Comprehensive resources, guides, and API references for building with BasaltCRM.
              </p>

              {/* Quick Stats */}
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="text-gray-400">
                  <strong className="text-white font-semibold">60+</strong> API Endpoints
                </span>
                <span className="w-px h-4 bg-white/10" />
                <span className="text-gray-400">
                  <strong className="text-white font-semibold">5</strong> Webhook Integrations
                </span>
                <span className="w-px h-4 bg-white/10" />
                <span className="text-gray-400">
                  <strong className="text-white font-semibold">OAuth 2.0</strong> + PKCE
                </span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {CARDS.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all hover:bg-white/[0.07] flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-cyan-950/30 group-hover:bg-cyan-950/50 transition-colors">
                      {card.icon}
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{card.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm flex-grow">{card.description}</p>
                  <div className="mt-5 flex items-center text-sm text-gray-500 group-hover:text-cyan-400 transition-colors">
                    Explore <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-16">
              <h2 className="text-lg font-bold mb-5">Quick Links</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all text-sm text-gray-400 hover:text-white"
                  >
                    <div className="p-2 rounded-lg bg-white/5">{link.icon}</div>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Need help?</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Our engineering team is always available on Discord to help you build your custom integrations.
              </p>
              <a href="https://discord.gg/gcgNugyWkg" className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all">
                Join Discord Community
              </a>
            </div>
          </div>
        </main>

        <BasaltFooter />
      </div>
    </div>
  );
}
