"use client";

import React, { useMemo } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { BrainCircuit, Activity, HeartPulse, Target } from "lucide-react";
import { useDashboardData } from "../../_context/DashboardDataContext";
import { motion } from "framer-motion";

export const SynthesisAnalyticsWidget = () => {
    const { synthesisAnalytics } = useDashboardData();

    const stats = useMemo(() => {
        if (!synthesisAnalytics) return { sentimentAvg: 0, intentDistribution: [], recentSignals: [] };
        return synthesisAnalytics;
    }, [synthesisAnalytics]);

    const getSentimentColor = (score: number) => {
        if (score === null || score === undefined) return "text-muted-foreground";
        if (score > 0.3) return "text-emerald-400";
        if (score < -0.3) return "text-rose-400";
        return "text-amber-400";
    };

    const getSentimentLabel = (score: number) => {
        if (score === null || score === undefined) return "Unknown";
        if (score > 0.3) return "Positive";
        if (score < -0.3) return "Negative";
        return "Neutral";
    };

    return (
        <WidgetWrapper
            title="Synthesis Dashboard"
            icon={BrainCircuit}
            iconColor="text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]"
            className="group/synthesis overflow-hidden border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all duration-700 hover:shadow-[0_0_40px_rgba(232,121,249,0.15)] bg-gradient-to-br from-[#0f0c29]/90 via-[#302b63]/40 to-[#24243e]/90"
        >
            <div className="pt-4 h-full flex flex-col justify-between relative overflow-hidden">
                {/* SVG Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                
                {/* Animated Ambient Plasma */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[80px] pointer-events-none group-hover/synthesis:bg-fuchsia-500/30 transition-all duration-1000 ease-in-out z-0 mix-blend-screen" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none group-hover/synthesis:bg-cyan-500/20 transition-all duration-1000 ease-in-out z-0 mix-blend-screen delay-150" />
                
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none z-0" />
                
                {/* Core Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4 relative z-10 px-2">
                    <div className="space-y-1 relative group cursor-default">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/5 to-fuchsia-500/0 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
                        />
                        <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-none mb-2 flex items-center gap-1.5 relative">
                            <HeartPulse size={10} className="text-fuchsia-500 animate-pulse drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]" /> 
                            <span className="bg-gradient-to-r from-white/70 to-white/30 bg-clip-text text-transparent">Avg Sentiment</span>
                        </p>
                        <p className={`text-4xl font-black tracking-tighter italic ${getSentimentColor(stats.sentimentAvg)} drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)] relative flex items-baseline gap-1`}>
                            {stats.sentimentAvg > 0 ? '+' : ''}{stats.sentimentAvg?.toFixed(2) || "0.00"}
                            <span className="text-[10px] text-muted-foreground/40 tracking-widest uppercase font-bold not-italic translate-y-[-6px]"> / 1.0</span>
                        </p>
                        <p className="text-[10px] text-white/80 mt-2 font-bold px-2.5 py-1 rounded-md bg-white/5 border border-white/10 inline-flex items-center gap-1.5 backdrop-blur-sm shadow-inner relative">
                            <span className={`w-1.5 h-1.5 rounded-full ${stats.sentimentAvg > 0 ? 'bg-emerald-400' : stats.sentimentAvg < 0 ? 'bg-rose-400' : 'bg-amber-400'} shadow-[0_0_5px_currentColor] animate-pulse`} />
                            {getSentimentLabel(stats.sentimentAvg)} State
                        </p>
                    </div>

                    <div className="space-y-1 border-l border-white/10 pl-5 relative z-10 before:absolute before:inset-y-0 before:-left-[1px] before:w-[1px] before:bg-gradient-to-b before:from-transparent before:via-cyan-500/30 before:to-transparent">
                        <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-none mb-3 flex items-center gap-1.5">
                            <Target size={10} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> 
                            <span className="bg-gradient-to-r from-white/70 to-white/30 bg-clip-text text-transparent">Top Signals</span>
                        </p>
                        <div className="flex flex-col gap-2.5 mt-2">
                            {stats.intentDistribution?.length > 0 ? stats.intentDistribution.slice(0, 2).map((intent: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-1.5 group/intent cursor-default">
                                    <div className="flex justify-between items-end text-[10px] relative">
                                        <span className="font-bold text-white/80 uppercase tracking-widest truncate max-w-[80px] group-hover/intent:text-white transition-colors" title={intent.intent}>{intent.intent}</span>
                                        <span className="text-cyan-300 font-extrabold tracking-tighter text-xs drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{intent.percentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none z-10" />
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${intent.percentage}%` }}
                                            transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: idx * 0.1 }}
                                            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] relative" 
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/50 blur-[1px]" />
                                        </motion.div>
                                    </div>
                                </div>
                            )) : <p className="text-[10px] text-muted-foreground/40 mt-3 italic font-medium">Awaiting node synthesis...</p>}
                        </div>
                    </div>
                </div>

                {/* Synthesis Signals Log */}
                <div className="flex-1 bg-black/40 rounded-xl border border-white/10 p-3.5 flex flex-col relative overflow-hidden z-10 backdrop-blur-xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    <div className="flex items-center justify-between mb-3.5">
                        <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em] flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                            </div>
                            Live Context Nodes
                        </h4>
                        <span className="text-[8px] font-black uppercase tracking-widest text-fuchsia-400/50 bg-fuchsia-400/5 px-1.5 py-0.5 rounded border border-fuchsia-500/10">Streaming</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 relative mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)">
                        {stats.recentSignals?.length > 0 ? stats.recentSignals.map((signal: any, idx: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                transition={{ delay: idx * 0.15, duration: 0.4, ease: "easeOut" }}
                                key={idx} 
                                className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white-[0.05] hover:border-fuchsia-500/40 hover:bg-white/[0.06] transition-all duration-300 group cursor-default shadow-sm hover:shadow-[0_4px_20px_rgba(232,121,249,0.1)] relative overflow-hidden"
                            >
                                {/* Hover beam effect */}
                                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-fuchsia-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="flex items-start justify-between mb-2 text-[11px]">
                                    <span className="font-extrabold uppercase tracking-widest text-white/90 truncate mr-2 flex items-center gap-1.5 drop-shadow-md">
                                        {signal.account?.name || `${signal.lead?.firstName || ''} ${signal.lead?.lastName || ''}`.trim() || 'Unknown Entity'}
                                    </span>
                                    <span className={`font-black px-2 py-0.5 rounded-md text-[8px] uppercase tracking-[0.2em] ${getSentimentColor(signal.sentimentScore)} bg-black/60 ring-1 ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-md`}>
                                        {signal.intentLevel?.replace('_', ' ') || 'NEUTRAL'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/60 italic line-clamp-2 leading-relaxed font-medium">
                                    <span className="text-fuchsia-400/40 mr-1.5">›</span>
                                    {signal.summary || "Pending semantic extraction..."}
                                </p>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-[10px] text-white/30 italic font-medium space-y-2">
                                <Activity className="w-4 h-4 text-white/10 animate-pulse" />
                                <span>Listening for Enterprise mutations...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </WidgetWrapper>
    );
};
