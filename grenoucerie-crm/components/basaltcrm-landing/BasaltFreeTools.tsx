"use client";

import { motion } from "framer-motion";
import { PenTool, FileText, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function BasaltFreeTools() {
    return (
        <section id="free-tools" className="relative py-20 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Section Label */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-400 tracking-[0.4em] uppercase">FREE FOREVER</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                        Start Growing <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Before You Pay</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Professional business tools — completely free, no login required. Build your brand assets in minutes.
                    </p>
                </motion.div>

                {/* Tool Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Signature Builder */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link href="/signature" className="block group">
                            <div className="relative p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full">
                                {/* Gradient accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                                {/* Background icon */}
                                <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-20 transition-[opacity,transform] duration-700 pointer-events-none group-hover:scale-110 group-hover:-rotate-12">
                                    <PenTool className="w-48 h-48 text-cyan-400" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                            <PenTool className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">FREE</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-3">Email Signature Builder</h3>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        Create branded, professional email signatures in seconds. Export to Gmail, Outlook, and Apple Mail. Match your brand colors and style.
                                    </p>

                                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm group-hover:gap-3 transition-all">
                                        Create My Signature <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Form Builder */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link href="/forms/embed" className="block group">
                            <div className="relative p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full">
                                {/* Gradient accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-emerald-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                                {/* Background icon */}
                                <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-20 transition-[opacity,transform] duration-700 pointer-events-none group-hover:scale-110 group-hover:-rotate-12">
                                    <FileText className="w-48 h-48 text-violet-400" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">FREE</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-3">Lead Capture Form Builder</h3>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        Build AI-assisted lead-capture forms with drag-and-drop. Embed anywhere. Start collecting leads and growing your pipeline instantly.
                                    </p>

                                    <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm group-hover:gap-3 transition-all">
                                        Build My Form <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
