
export const dynamic = "force-dynamic";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import FluidNeuralWave from "@/app/components/FluidNeuralWave";
import { Bot, Phone, Globe, Zap, MessageSquare, Briefcase, Cpu, ShieldCheck, Server, Command } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "AI Agents - BasaltCRM",
    description: "Deploy autonomous AI agents that handle sales, support, and research 24/7.",
};

export default function AliensPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white bg-black">
            <div className="fixed inset-0 z-0 opacity-40">
                <FluidNeuralWave variant="aggressive" seed={4.2} />
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
                                <span className="text-[10px] font-mono text-cyan-400 tracking-[0.4em] uppercase">NEURAL CORES ONLINE</span>
                            </div>

                            <h1 className="text-6xl md:text-9xl font-black tracking-tight mb-8 leading-[0.85] uppercase">
                                <span className="block text-white">THE AGENTIC</span>
                                <span className="block bg-gradient-to-r from-cyan-400 via-white to-violet-500 bg-clip-text text-transparent">
                                    STACK
                                </span>
                            </h1>

                            <p className="text-xl md:text-3xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed font-light">
                                Deploy autonomous revenue cores that prospect, qualify, and close at grid-scale.
                                Zero downtime. Infinite performance. Total agency.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link href="/register">
                                    <Button className="bg-white hover:bg-cyan-400 text-black px-12 py-10 text-xl rounded-2xl shadow-[0_0_60px_rgba(255,255,255,0.1)] font-bold tracking-widest transition-all duration-500">
                                        DEPLOY CORES
                                    </Button>
                                </Link>
                                <Link href="/features">
                                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 px-12 py-10 text-xl rounded-2xl font-bold tracking-widest backdrop-blur-xl transition-all duration-300">
                                        VIEW INTERFACE
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Agent Roles Billboard Series */}
                    <section className="pb-32 space-y-32">
                        {/* SDR Billboard */}
                        <div className="container mx-auto px-4">
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                                <div className="flex flex-col lg:flex-row items-center">
                                    <div className="flex-1 p-12 lg:p-20">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <Phone className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase">ID: SDR-01</div>
                                                <div className="text-2xl font-bold text-white">Sales Development</div>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">Autonomous Prospecting</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                            SDR-01 handles the entire discovery phase. It identifies high-intent accounts, verifies decision-makers, and initiates multi-channel engagement across voice and email.
                                        </p>
                                        <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/5">
                                            <div>
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-tighter">Status</div>
                                                <div className="text-xl font-bold text-emerald-400">HUNTING</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-tighter">Throughput</div>
                                                <div className="text-xl font-bold text-white">500 Calls/hr</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-black/60 p-6 md:p-12 border-t lg:border-t-0 lg:border-l border-white/5">
                                        <div className="aspect-auto min-h-[500px] lg:aspect-square relative flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" />
                                            <div className="relative z-10 w-full max-w-sm p-8 glass-panel rounded-3xl border border-emerald-500/20 shadow-2xl transform scale-[0.85] sm:scale-100">
                                                <div className="flex justify-between items-center mb-10">
                                                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-mono tracking-widest">LIVE CRAWL</div>
                                                    <Server className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500/40 w-2/3 animate-[shimmer_2s_infinite]" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-10 text-3xl font-mono font-bold text-white">42,901</div>
                                                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Leads Provisioned</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CSM Billboard */}
                        <div className="container mx-auto px-4">
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-gradient-to-bl from-white/5 to-transparent">
                                <div className="flex flex-col lg:flex-row-reverse items-center">
                                    <div className="flex-1 p-12 lg:p-20">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                <MessageSquare className="h-10 w-10" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-mono text-violet-500 tracking-widest uppercase">ID: CSM-X</div>
                                                <div className="text-2xl font-bold text-white">Customer Success</div>
                                            </div>
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">Reactive Intelligence</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                            CSM-X monitors account health in real-time. It resolves complex support tickets, guides new users through technical onboarding, and detects churn signals before they happen.
                                        </p>
                                        <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/5">
                                            <div>
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-tighter">Latency</div>
                                                <div className="text-xl font-bold text-violet-400">&lt; 12ms</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-tighter">Resolution</div>
                                                <div className="text-xl font-bold text-white">99.8% Success</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-black/60 p-6 md:p-12 border-t lg:border-t-0 lg:border-r border-white/5">
                                        <div className="aspect-auto min-h-[500px] lg:aspect-square relative flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-violet-500/5 rounded-full blur-[100px] animate-pulse" />
                                            <div className="relative z-10 w-full max-w-sm p-8 glass-panel rounded-3xl border border-violet-500/20 shadow-2xl transform scale-[0.85] sm:scale-100">
                                                <div className="flex justify-between items-center mb-10">
                                                    <div className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-[10px] font-mono tracking-widest">NEURAL STREAM</div>
                                                    <Command className="h-5 w-5 text-violet-500" />
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <div className="h-8 w-8 rounded-lg bg-white/5 shrink-0" />
                                                            <div className="flex-1 h-8 bg-white/5 rounded-lg" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-10 text-3xl font-mono font-bold text-white">1,204</div>
                                                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Sessions Active</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
