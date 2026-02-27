
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import SynapticNetwork from "@/app/components/SynapticNetwork";
import LeadGenDashboard from "../components/LeadGenDashboard";
import AgentInterface from "../components/AgentInterface";
import AnalyticsGraph from "../components/AnalyticsGraph";
import { Zap, Mail, Bot, Globe, MessageSquare, TrendingUp, BarChart3, Cpu, Shield, Server, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "System Specs - BasaltCRM",
    description: "Explore the neural-scale features of the Basalt Revenue Core.",
};

export default function FeaturesPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white bg-black">
            <div className="fixed inset-0 z-0">
                <SynapticNetwork opacity={0.6} nodeCount={60} />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-20">
                    {/* Billboard Hero Section */}
                    <section className="pt-24 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
                        <div className="container mx-auto px-4 text-center">
                            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-xl">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.4em] uppercase">SYSTEM CAPABILITIES</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">
                                <span className="block text-white">REVENUE</span>
                                <span className="block bg-gradient-to-r from-violet-400 via-white to-cyan-500 bg-clip-text text-transparent">
                                    SYNAPSES
                                </span>
                            </h1>

                            <p className="text-xl md:text-3xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed font-light">
                                Engineering the loop that never sleeps. Explore the architectural layers of the
                                first autonomous AI-ASSISTED STACK.
                            </p>
                        </div>
                    </section>

                    {/* Phase Billboards */}
                    <div className="space-y-32 py-20 lg:py-0 lg:pb-32">
                        {/* Phase 01: Discovery */}
                        <section className="container mx-auto px-4">
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex flex-col lg:flex-row items-center">
                                    <div className="flex-1 p-12 lg:p-20">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                <Cpu className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">Phase 01</div>
                                                <div className="text-2xl font-bold text-white uppercase">Discovery</div>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">Neural Lead Provisioning</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                            Identifying high-signal accounts using multi-agent site crawls and technical footprint harvesting.
                                            We populate your entire pipeline with technical and firmographic enrichment.
                                        </p>
                                        <ul className="space-y-4 text-gray-400">
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-cyan-500" />
                                                <span><strong>Global Crawl Mesh:</strong> Scan millions of technical signals daily.</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-cyan-500" />
                                                <span><strong>Automated ICP Mapping:</strong> Reason through target fits autonomously.</span>
                                            </li>
                                        </ul>
                                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-[10px] font-mono text-cyan-500 mb-4 uppercase tracking-[0.2em]">Tech Spec: Phase 01</div>
                                            <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">PROTOCOL</span>
                                                    <span className="text-white">GRPC-MESH</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">INFERENCE</span>
                                                    <span className="text-white">GPT-4-32K</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">THROUGHPUT</span>
                                                    <span className="text-white">50K OPS / SEC</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">REDUNDANCY</span>
                                                    <span className="text-white">3-REGION</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-black/60 p-6 md:p-12 border-t lg:border-t-0 lg:border-l border-white/5">
                                        <div className="rounded-3xl glass-panel border border-white/10 group-hover:border-cyan-500/30 transition-all duration-700 min-h-[600px] lg:h-full flex items-center justify-center overflow-hidden">
                                            <div className="w-full max-w-2xl transform scale-[0.85] sm:scale-95 md:scale-100">
                                                <LeadGenDashboard />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Phase 02: Agency */}
                        <section className="container mx-auto px-4">
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-bl from-white/5 to-transparent">
                                <div className="flex flex-col lg:flex-row-reverse items-center">
                                    <div className="flex-1 p-12 lg:p-20">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                <Bot className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-mono text-violet-500 tracking-widest uppercase">Phase 02</div>
                                                <div className="text-2xl font-bold text-white uppercase">Agency</div>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">Digital Workforce Deployment</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                            Deploy ultra-low latency voice and text agents. Our agents don't just reply; they negotiate,
                                            reason through objections, and book meetings into your calendar.
                                        </p>
                                        <ul className="space-y-4 text-gray-400">
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-violet-500" />
                                                <span><strong>0.12s Voice Latency:</strong> Indistinguishable from human interaction.</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-violet-500" />
                                                <span><strong>Contextual Recovery:</strong> Agents remember every past touchpoint.</span>
                                            </li>
                                        </ul>
                                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-[10px] font-mono text-violet-500 mb-4 uppercase tracking-[0.2em]">Tech Spec: Phase 02</div>
                                            <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">TTS ENGINE</span>
                                                    <span className="text-white">NEURAL-VOICE-01</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">LATENCY</span>
                                                    <span className="text-white">&lt; 120MS</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">STT MODEL</span>
                                                    <span className="text-white">WHISPER-V3-TURBO</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">CONCURRENCY</span>
                                                    <span className="text-white">UNLIMITED</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-black/60 p-6 md:p-12 border-t lg:border-t-0 lg:border-r border-white/5">
                                        <div className="rounded-3xl glass-panel border border-white/10 group-hover:border-violet-500/30 transition-all duration-700 min-h-[600px] lg:h-full flex items-center justify-center overflow-hidden">
                                            <div className="w-full max-w-2xl transform scale-[0.85] sm:scale-95 md:scale-100">
                                                <AgentInterface />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Phase 03: Command */}
                        <section className="container mx-auto px-4">
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex flex-col lg:flex-row items-center">
                                    <div className="flex-1 p-12 lg:p-20">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <TrendingUp className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">Phase 03</div>
                                                <div className="text-2xl font-bold text-white uppercase">Command</div>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">Predictive Revenue Command</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                            Analyze every signal. Our command center predicts revenue probabilities with
                                            extreme accuracy and suggests strategy pivots in real-time.
                                        </p>
                                        <ul className="space-y-4 text-gray-400">
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-emerald-500" />
                                                <span><strong>Sentiment Deep-Dives:</strong> Track prospect emotional curves.</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-emerald-500" />
                                                <span><strong>Automated Pipeline Flow:</strong> Deals advance without manual data entry.</span>
                                            </li>
                                        </ul>
                                        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
                                            <div className="text-[10px] font-mono text-emerald-500 mb-4 uppercase tracking-[0.2em]">Tech Spec: Phase 03</div>
                                            <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">ANALYSIS</span>
                                                    <span className="text-white">TIME-SERIES</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">PRECISION</span>
                                                    <span className="text-white">99.4% CONF</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">VISUALS</span>
                                                    <span className="text-white">WEBGL-RENDER</span>
                                                </div>
                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                    <span className="text-gray-500">DATA MESH</span>
                                                    <span className="text-white">SNOWFLAKE-INTG</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-black/60 p-6 md:p-12 border-t lg:border-t-0 lg:border-l border-white/5">
                                        <div className="rounded-3xl glass-panel border border-white/10 group-hover:border-emerald-500/30 transition-all duration-700 min-h-[700px] lg:h-full flex items-center justify-center overflow-hidden">
                                            <div className="w-full max-w-2xl transform scale-[0.85] sm:scale-95 md:scale-100 p-2">
                                                <AnalyticsGraph />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Technical Overview Section */}
                    <section className="py-24 container mx-auto px-4">
                        <div className="glass-panel rounded-[40px] p-12 border border-white/10 bg-black/40">
                            <h2 className="text-3xl font-bold mb-12 uppercase tracking-tight">System Architecture Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                <div className="space-y-6">
                                    <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest pl-4 border-l-2 border-cyan-500">Core Engine</div>
                                    <table className="w-full text-sm font-mono text-gray-400">
                                        <tbody>
                                            <tr className="border-b border-white/5"><td className="py-3">ORCHESTRATOR</td><td className="text-right text-white">BASALT-V4</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">LLM BACKBONE</td><td className="text-right text-white">GPT-4-TURBO</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">MEMORY TYPE</td><td className="text-right text-white">VECTOR-NEURAL</td></tr>
                                            <tr><td className="py-3">AUTO-HEALING</td><td className="text-right text-cyan-400">ACTIVE</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-6">
                                    <div className="text-xs font-mono text-violet-500 uppercase tracking-widest pl-4 border-l-2 border-violet-500">Network Protocols</div>
                                    <table className="w-full text-sm font-mono text-gray-400">
                                        <tbody>
                                            <tr className="border-b border-white/5"><td className="py-3">VOICE STREAM</td><td className="text-right text-white">WEBRTC-LOW-LAT</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">DATA INGEST</td><td className="text-right text-white">KAFKA-PIPELINE</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">ENCRYPTION</td><td className="text-right text-white">AES-256-GCM</td></tr>
                                            <tr><td className="py-3">LATENCY TARGET</td><td className="text-right text-violet-400">&lt; 150MS</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-6">
                                    <div className="text-xs font-mono text-emerald-500 uppercase tracking-widest pl-4 border-l-2 border-emerald-500">Compliance & Security</div>
                                    <table className="w-full text-sm font-mono text-gray-400">
                                        <tbody>
                                            <tr className="border-b border-white/5"><td className="py-3">AUDIT LOGS</td><td className="text-right text-white">IMMUTABLE</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">SOC2 STATUS</td><td className="text-right text-white">READY</td></tr>
                                            <tr className="border-b border-white/5"><td className="py-3">REGION LOCK</td><td className="text-right text-white">USA-WEST-2</td></tr>
                                            <tr><td className="py-3">PII REDACTION</td><td className="text-right text-emerald-400">ACTIVE</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Infrastructure Specs Grid */}
                    <section className="py-32 bg-white/5 border-y border-white/10 backdrop-blur-xl">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                                <div className="space-y-4">
                                    <Server className="h-8 w-8 text-cyan-500" />
                                    <h4 className="text-xl font-bold">GRID SCALE</h4>
                                    <p className="text-gray-500 text-sm">Deploy thousands of cores across global regions instantly.</p>
                                </div>
                                <div className="space-y-4">
                                    <Zap className="h-8 w-8 text-violet-500" />
                                    <h4 className="text-xl font-bold">ZERO LATENCY</h4>
                                    <p className="text-gray-500 text-sm">Real-time inference for voice, SMS, and email streams.</p>
                                </div>
                                <div className="space-y-4">
                                    <Shield className="h-8 w-8 text-emerald-500" />
                                    <h4 className="text-xl font-bold">ENTERPRISE CORE</h4>
                                    <p className="text-gray-500 text-sm">Full SOC2 compliance with neural guardrails active.</p>
                                </div>
                                <div className="space-y-4">
                                    <Globe className="h-8 w-8 text-cyan-500" />
                                    <h4 className="text-xl font-bold">MULTI-MODAL</h4>
                                    <p className="text-gray-500 text-sm">Deep integration across social, technical, and firmographic signals.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Final CTA Billboard */}
                    <section className="py-40 relative">
                        <div className="container mx-auto px-4 text-center">
                            <h2 className="text-5xl md:text-8xl font-black mb-12 uppercase">Ready for <span className="text-cyan-500">Agency?</span></h2>
                            <Link href="/register">
                                <Button className="bg-white hover:bg-cyan-500 text-black px-16 py-12 text-2xl rounded-3xl font-black tracking-widest transition-all duration-500 shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                                    INITIALIZE CORE
                                </Button>
                            </Link>
                        </div>
                    </section>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
