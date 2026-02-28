import { ShieldCheck, Globe, Zap, Cpu, Layers, Activity, Command } from "lucide-react";

export default function BasaltAbout() {
    return (
        <section id="about" className="relative py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <span className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase">NEURAL ARCHITECTURE</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight uppercase tracking-tighter">
                            THE <span className="text-cyan-500">CORE</span> <br />
                            PHILOSOPHY
                        </h2>

                        <div className="space-y-8 text-gray-400 text-lg leading-relaxed font-light">
                            <p>
                                <span className="text-white font-medium">BasaltCRM</span> is not a tool; it is a foundation.
                                We are engineering the first end-to-end <span className="text-white">autonomous revenue machine</span>.
                                By abstracting the heavy lifting of AI-ASSISTED STACK onto agentic neural cores, we allow founders
                                and growth teams to operate at a scale previously reserved for Fortune 500 conglomerates.
                            </p>
                            <p>
                                Our architecture is built for <span className="text-cyan-500">Total Agency</span>.
                                Every agent in the Basalt stack is capable of reasoning, planning, and executing
                                complex revenue cycles without human oversight.
                            </p>
                        </div>

                        {/* Mission Statement Card */}
                        <div className="mt-12 p-8 glass-panel rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Command className="h-20 w-20 text-cyan-500" />
                            </div>
                            <p className="text-lg text-white font-medium italic relative z-10 leading-relaxed">
                                &ldquo;Provisioning performance at grid-scale. We don&apos;t just manage your pipeline;
                                we engineer the loop that grows it while you sleep.&rdquo;
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <Activity className="h-4 w-4 text-cyan-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">System Vision 2.1</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Values / Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'ENCRYPTION',
                                value: 'AES-256-GCM',
                                desc: 'Grid-level security on every neural synapse.',
                                icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            },
                            {
                                title: 'PROPAGATION',
                                value: 'MULTI-REGION',
                                desc: 'Low-latency execution across 24 global nodes.',
                                icon: <Globe className="w-6 h-6 text-blue-500" />
                            },
                            {
                                title: 'INFERENCE',
                                value: '0.12s LATENCY',
                                desc: 'High-speed reasoning for voice and text streams.',
                                icon: <Zap className="w-6 h-6 text-cyan-500" />
                            },
                            {
                                title: 'AUTONOMY',
                                value: 'L4 AGENCY',
                                desc: 'Self-correcting workflows with zero human loop.',
                                icon: <Cpu className="w-6 h-6 text-violet-500" />
                            },
                        ].map((spec) => (
                            <div key={spec.title} className="p-8 glass-panel rounded-[32px] border border-white/10 bg-black/40 hover:bg-white/5 transition-colors duration-500 group relative overflow-hidden">
                                <div className="absolute -bottom-12 -right-12 opacity-10 group-hover:opacity-40 transition-[opacity,transform] duration-700 pointer-events-none group-hover:scale-110 group-hover:-rotate-12">
                                    {/* Clone the icon with larger size and relative classes */}
                                    {typeof spec.icon === 'object' && spec.icon !== null && 'type' in spec.icon ? (
                                        <spec.icon.type {...spec.icon.props} className="w-64 h-64" />
                                    ) : (
                                        spec.icon
                                    )}
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase">{spec.title}</div>
                                    <div className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{spec.value}</div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{spec.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tech Stack Billboard */}
                <div className="border-t border-white/5 pt-24">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                        <div className="max-w-2xl">
                            <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase mb-4 block">Infrastructure</span>
                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">THE NEURAL STACK</h3>
                            <p className="text-gray-500 mt-4 text-lg">
                                Deeply integrated with industry-lead models and real-time communication protocols.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {['OpenAI', 'Anthropic', 'ElevenLabs', 'Vercel', 'Stripe', 'Twilio'].map((tech) => (
                            <div key={tech} className="h-32 flex items-center justify-center glass-panel rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/5 transition-colors group">
                                <span className="text-gray-500 group-hover:text-white font-bold tracking-widest uppercase">{tech}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
