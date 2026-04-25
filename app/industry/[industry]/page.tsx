import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
    ArrowRight, 
    Building2, 
    BrainCircuit, 
    Workflow, 
    ShieldCheck, 
    Target, 
    TrendingUp, 
    HeartHandshake, 
    Clock, 
    Database, 
    Lock, 
    Zap 
} from "lucide-react";
import industries from "@/data/industries.json";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import AgentInterface from "@/app/components/AgentInterface";
import AbstractDashboard from "@/app/components/AbstractDashboard";

type Props = {
    params: Promise<{ industry: string }>;
};

function getBaseUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envUrl) return "https://crm.basalthq.com";
    if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) return `https://${envUrl}`;
    return envUrl;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const industry = industries.find((i) => i.slug === params.industry);
    if (!industry) return {};

    const baseUrl = getBaseUrl();
    let ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(industry.name + ' CRM')}&description=${encodeURIComponent(industry.use_case)}&type=industry`;

    return {
        title: industry.meta_title,
        description: industry.meta_description,
        keywords: industry.keywords,
        openGraph: {
            title: industry.meta_title,
            description: industry.meta_description,
            type: "website",
            url: `${baseUrl}/industry/${params.industry}`,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${industry.name} AI CRM`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: industry.meta_title,
            description: industry.meta_description,
            images: [ogImageUrl],
        },
    };
}

export async function generateStaticParams() {
    return industries.map((i) => ({
        industry: i.slug,
    }));
}

export const dynamic = "force-dynamic";

export default async function IndustryPage(props: Props) {
    const params = await props.params;
    const industry = industries.find((i) => i.slug === params.industry);

    if (!industry) {
        notFound();
    }

    // Resolving the schema referencing logic 
    const baseData = industries[0] as any;
    const staticData = (industry as any).static_sections?.$ref === "STATIC_BASE" 
        ? baseData.static_sections 
        : ((industry as any).static_sections || baseData.static_sections);

    const resolvedData = {
        static_sections: staticData,
        pricing: staticData.pricing_overview,
        faqs: staticData.faqs || [],
        integrations: staticData.integrations
    };

    const primaryCta = { label: "Transform Your Operations", url: "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0" };

    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                {/* Hero */}
                <section className="relative w-full py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="container px-4 md:px-6 relative z-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                            <Building2 className="w-4 h-4 mr-2" />
                            <span>{industry.name} CRM</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                            {industry.hero_title}
                        </h1>
                        <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                            {industry.description}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href={primaryCta.url} target="_blank">
                                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                    {primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Dashboard Visual */}
                <section className="py-10 pb-20">
                    <div className="container px-4 md:px-6">
                        <div className="relative h-[500px] w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <AbstractDashboard />
                        </div>
                    </div>
                </section>

                {/* Targeted Workflows */}
                <section className="py-24 bg-black/40 backdrop-blur-sm border-y border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Workflow className="w-6 h-6 text-primary" />
                                        <span className="text-primary font-medium">Industry Specific</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-6">
                                        Built for {industry.name} Workflows
                                    </h2>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                        {industry.subheading}
                                    </p>
                                    <p className="text-gray-400 leading-relaxed">
                                        Generic CRMs require months of customization and hundreds of thousands of dollars to configure. BasaltCRM comes pre-configured with the exact pipelines, fields, and AI automation models required for {industry.name.toLowerCase()} success.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <BrainCircuit className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1 text-white">Targeted Use Case</h3>
                                            <p className="text-gray-400 text-sm">{industry.use_case}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <Database className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1 text-white">Custom Data Schema</h3>
                                            <p className="text-gray-400 text-sm">Entities, relationships, and modules built to mirror your actual business model.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <ShieldCheck className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1 text-white">Enterprise Compliant</h3>
                                            <p className="text-gray-400 text-sm">Secure data residency, SSO, and localized compliance configurations ready out-of-the-box.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Agents Section */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">AI That Master Your Specialized Workflows</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                The AI doesn't just read data—it actively resolves tasks, qualifies complex deals, and interacts with clients autonomously based on {industry.name.toLowerCase()} best practices.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                                    <Target className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{resolvedData.static_sections.features.ai_agents[0]}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Instantly qualifies new inquiries, routes hot leads to the right agent, and extracts key data into fields automatically.
                                </p>
                            </div>

                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{resolvedData.static_sections.features.ai_agents[1]}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Keeps leads engaged with personalized outreach, adapting messaging based on complex engagement signals.
                                </p>
                            </div>

                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                                    <HeartHandshake className="w-6 h-6 text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{resolvedData.static_sections.features.ai_agents[2]}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Monitors account health and proactively reaches out to at-risk clients before they churn.
                                </p>
                            </div>

                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{resolvedData.static_sections.features.ai_agents[3]}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Smart calendar management that syncs dynamically with team availability, minimizing no-shows for client meetings.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Automation & Playbooks Terminal View */}
                <section className="py-20 bg-black/20 border-y border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                            <div className="order-2 lg:order-1 relative h-[450px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.1)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <AgentInterface />
                            </div>
                            
                            <div className="order-1 lg:order-2">
                                <h2 className="text-3xl font-bold mb-6 text-white">Pre-Loaded Playbooks</h2>
                                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                    Stop building workflows from scratch. Our platform leverages industry-standard data to map out operational logic uniquely formatted for your business scale.
                                </p>
                                
                                <div className="space-y-4">
                                    {resolvedData.static_sections.automation_playbooks.map((playbook: string, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/10">
                                            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                            <p className="text-gray-300 font-medium text-sm leading-relaxed">{playbook}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Infrastructure & Security */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-4xl mx-auto text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Enterprise Infrastructure</h2>
                            <p className="text-gray-400">Secure, extensible, and integrated with the tools you already use.</p>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <Lock className="w-8 h-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-2 text-white">Data Security</h3>
                                <p className="text-gray-400 text-sm">Military-grade AES-256 encryption, role-based access control, and complete audit logging on every atomic change.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <Database className="w-8 h-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-2 text-white">Cloud Extensibility</h3>
                                <p className="text-gray-400 text-sm">Flexible REST API and real-time Webhook hooks integrate seamlessly into legacy infrastructure.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <ShieldCheck className="w-8 h-8 text-white mb-4" />
                                <h3 className="font-bold text-lg mb-2 text-white">Guaranteed Uptime</h3>
                                <p className="text-gray-400 text-sm">99.99% uptime SLA distributed across globally redundant regions for low-latency operations.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-20 bg-black/40 border-t border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-white mb-4">Common Questions</h2>
                            </div>
                            <div className="space-y-4">
                                {resolvedData.faqs.map((faq: any, i: number) => (
                                    <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5">
                                        <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                                        <p className="text-gray-400">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <BasaltFooter />
            </div>
        </div>
    );
}
