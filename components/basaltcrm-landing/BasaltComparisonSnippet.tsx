"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, Check, X, Minus } from "lucide-react";
import Link from "next/link";

const topCompetitors = [
    { name: "BasaltCRM", highlight: true },
    { name: "Salesforce" },
    { name: "HubSpot" },
    { name: "Zoho CRM" },
    { name: "Pipedrive" },
];

type Rating = 1 | 2 | 3 | 4 | 5;
type FeatureRow = {
    feature: string;
    ratings: Rating[];
};

const features: FeatureRow[] = [
    { feature: "AI Lead Generation", ratings: [5, 3, 3, 3, 2] },
    { feature: "AI Voice Agents", ratings: [5, 2, 2, 2, 1] },
    { feature: "AI Email Outreach", ratings: [5, 3, 4, 3, 3] },
    { feature: "Pipeline Management", ratings: [5, 5, 4, 4, 5] },
    { feature: "Workflow Automation", ratings: [5, 5, 4, 4, 3] },
    { feature: "Form Builder", ratings: [5, 2, 4, 4, 3] },
    { feature: "Signature Builder", ratings: [5, 1, 3, 2, 1] },
    { feature: "Pricing Value", ratings: [5, 2, 2, 4, 3] },
    { feature: "Free Tier", ratings: [5, 1, 3, 3, 1] },
    { feature: "UI/UX Design", ratings: [5, 3, 4, 2, 4] },
];

function Stars({ count, highlight }: { count: Rating; highlight?: boolean }) {
    return (
        <div className="flex items-center gap-0.5 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < count
                        ? highlight
                            ? "text-cyan-400 fill-cyan-400"
                            : "text-yellow-500 fill-yellow-500"
                        : "text-white/10"
                        }`}
                />
            ))}
        </div>
    );
}

export default function BasaltComparisonSnippet() {
    return (
        <section id="comparison" className="relative py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-sm font-mono tracking-[0.5em] text-cyan-500 uppercase mb-4">COMPETITIVE ANALYSIS</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">How We Stack Up</h3>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Feature-by-feature comparison across 10 critical categories. BasaltCRM leads in AI, pricing, and free tools.
                    </p>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="rounded-3xl border border-white/10 overflow-hidden bg-[#0A0A12] shadow-[0_0_80px_rgba(6,182,212,0.05)]"
                >
                    {/* Table Header */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-5 text-gray-400 font-medium text-sm w-[200px]">Feature</th>
                                    {topCompetitors.map((c) => (
                                        <th
                                            key={c.name}
                                            className={`p-5 text-center text-sm font-bold ${c.highlight
                                                ? "bg-cyan-500/5 border-l border-r border-cyan-500/20 text-cyan-400"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            {c.highlight && (
                                                <div className="text-[9px] font-mono tracking-widest uppercase text-cyan-500 mb-1">★ LEADER</div>
                                            )}
                                            {c.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((row, idx) => (
                                    <tr
                                        key={row.feature}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-5 text-gray-300 font-medium text-sm">{row.feature}</td>
                                        {row.ratings.map((rating, i) => (
                                            <td
                                                key={i}
                                                className={`p-5 text-center ${i === 0
                                                    ? "bg-cyan-500/5 border-l border-r border-cyan-500/10"
                                                    : ""
                                                    }`}
                                            >
                                                <Stars count={rating} highlight={i === 0} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {/* Total Score Row */}
                                <tr className="border-t-2 border-white/10 bg-white/5">
                                    <td className="p-5 text-white font-bold text-sm">Overall Score</td>
                                    {[
                                        { score: "50/50", avg: "5.0", highlight: true },
                                        { score: "27/50", avg: "2.7" },
                                        { score: "33/50", avg: "3.3" },
                                        { score: "31/50", avg: "3.1" },
                                        { score: "26/50", avg: "2.6" },
                                    ].map((s, i) => (
                                        <td
                                            key={i}
                                            className={`p-5 text-center ${s.highlight
                                                ? "bg-cyan-500/10 border-l border-r border-cyan-500/20"
                                                : ""
                                                }`}
                                        >
                                            <div className={`text-xl font-bold ${s.highlight ? "text-cyan-400" : "text-gray-400"}`}>
                                                {s.score}
                                            </div>
                                            <div className={`text-xs font-mono ${s.highlight ? "text-cyan-500" : "text-gray-500"}`}>
                                                {s.avg} avg
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Pricing Callout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 glass-panel rounded-3xl p-8 md:p-10 border border-cyan-500/20 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h4 className="text-2xl font-bold text-white mb-2">10-Person Team Benchmark</h4>
                            <p className="text-gray-400 text-sm max-w-xl">
                                What a team of 10 pays monthly for full AI CRM capabilities including lead generation, voice agents, and automation.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-black text-cyan-400">$790</div>
                                <div className="text-[10px] font-mono text-cyan-500 tracking-widest">BASALTCRM</div>
                            </div>
                            <div className="text-gray-600 font-mono text-sm">vs</div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-500 line-through">$2,900+</div>
                                <div className="text-[10px] font-mono text-gray-500 tracking-widest">SALESFORCE</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-500 line-through">$2,500+</div>
                                <div className="text-[10px] font-mono text-gray-500 tracking-widest">DYNAMICS</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CTA to Full Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-12 mb-4"
                >
                    <motion.div
                        animate={{ 
                            boxShadow: [
                                '0px 0px 20px rgba(6,182,212,0.1)', 
                                '0px 0px 60px rgba(6,182,212,0.3)', 
                                '0px 0px 20px rgba(6,182,212,0.1)'
                            ] 
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-block rounded-full"
                    >
                        <Link
                            href="/compare/ratings"
                            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-[#0D0D14] border border-cyan-500/30 hover:bg-[#12131C] hover:border-cyan-400/80 text-cyan-400 hover:text-cyan-300 text-sm font-bold tracking-[0.2em] uppercase rounded-full transition-all duration-300 overflow-hidden font-mono"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                View Full 16-Category Breakdown
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                            </span>
                            
                            {/* Subtle internal radial hover glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
