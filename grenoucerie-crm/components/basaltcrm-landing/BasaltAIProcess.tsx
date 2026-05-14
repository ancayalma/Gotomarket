"use client";

import { motion } from "framer-motion";
import { Palette, Mail, Gift, ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
    {
        number: "01",
        icon: Palette,
        title: "Automated Brand Identity",
        subtitle: "AI builds your brand in minutes",
        description: "Describe your business in plain English. Our AI generates logo concepts, color palettes, and a complete brand kit — ready to deploy across every touchpoint.",
        color: "cyan",
        gradient: "from-cyan-500/20 to-cyan-500/5",
        borderColor: "border-cyan-500/20",
        textColor: "text-cyan-400",
        glowColor: "bg-cyan-500/10",
    },
    {
        number: "02",
        icon: Mail,
        title: "AI-Personalized Outreach",
        subtitle: "Every email, tailored by intelligence",
        description: "Define your ideal customer in natural language. Our agentic scraper discovers leads autonomously, scores them against your ICP, and drafts hyper-personalized outreach — at scale.",
        color: "violet",
        gradient: "from-violet-500/20 to-violet-500/5",
        borderColor: "border-violet-500/20",
        textColor: "text-violet-400",
        glowColor: "bg-violet-500/10",
    },
    {
        number: "03",
        icon: Gift,
        title: "Free Tools, Zero Friction",
        subtitle: "Signature builder & form builder",
        description: "Professional email signatures and embeddable lead-capture forms — completely free, forever. No login wall, no credit card. Start capturing leads in minutes.",
        color: "emerald",
        gradient: "from-emerald-500/20 to-emerald-500/5",
        borderColor: "border-emerald-500/20",
        textColor: "text-emerald-400",
        glowColor: "bg-emerald-500/10",
    },
];

export default function BasaltAIProcess() {
    return (
        <section id="ai-process" className="relative py-32 px-6 overflow-hidden">
            {/* Subtle background line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-sm font-mono tracking-[0.5em] text-cyan-500 uppercase mb-4">AI-FIRST PROCESS</h2>
                    <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">From Zero to Pipeline</h3>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Three steps. Fully autonomous. From brand creation to lead generation to deal flow — powered by AI at every layer.
                    </p>
                </motion.div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="group relative"
                        >
                            <div className={`relative p-8 rounded-3xl border border-white/10 bg-gradient-to-b ${step.gradient} backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full flex flex-col`}>
                                {/* Step number */}
                                <div className="flex items-center justify-between mb-8">
                                    <span className={`text-6xl font-black ${step.textColor} opacity-20 group-hover:opacity-40 transition-opacity font-mono`}>
                                        {step.number}
                                    </span>
                                    <div className={`w-12 h-12 rounded-2xl ${step.glowColor} border ${step.borderColor} flex items-center justify-center`}>
                                        <step.icon className={`w-6 h-6 ${step.textColor}`} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className={`text-[10px] font-mono ${step.textColor} tracking-widest uppercase mb-2`}>
                                        {step.subtitle}
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-4 tracking-tight">
                                        {step.title}
                                    </h4>
                                    <p className="text-gray-400 leading-relaxed text-sm">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Bottom gradient line */}
                                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700 ${step.textColor}`} />
                            </div>

                            {/* Connector line on desktop */}
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent z-20" />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* CTA Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        href="/register"
                        className="group relative h-14 px-10 flex items-center justify-center text-sm font-bold tracking-wider rounded-2xl bg-white text-black hover:bg-cyan-400 transition-colors duration-500 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center">
                            GET STARTED FREE
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        href="/features"
                        className="h-14 px-10 flex items-center justify-center text-sm font-bold tracking-wider rounded-2xl border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-colors duration-300 backdrop-blur-xl"
                    >
                        VIEW ALL FEATURES
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
