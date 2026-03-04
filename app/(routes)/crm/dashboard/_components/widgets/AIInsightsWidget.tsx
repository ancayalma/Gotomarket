"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Zap, AlertCircle, CheckCircle2, Info, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { dismissAIInsight } from "@/actions/dashboard/dismiss-ai-insight";
import { toast } from "react-hot-toast";

interface AIInsightsWidgetProps {
    insights: any[];
}

export const AIInsightsWidget = ({ insights = [] }: AIInsightsWidgetProps) => {
    const router = useRouter();

    const handleDismiss = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const res = await dismissAIInsight(id);
            if (res.success) {
                toast.success("Insight marked as complete");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to dismiss insight");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertCircle size={16} className="text-amber-400" />;
            case "success": return <CheckCircle2 size={16} className="text-emerald-400" />;
            default: return <Info size={16} className="text-blue-400" />;
        }
    };

    return (
        <WidgetWrapper
            title="AI Action Radar"
            icon={Zap}
            iconColor="text-violet-400"
            className="overflow-hidden group/command"
        >
            {/* Neural Pulse - Premium Aesthetic */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/10 rounded-full blur-[40px] pointer-events-none group-hover/command:bg-violet-600/20 transition-colors duration-700" />

            <div className="space-y-4 pt-4 relative z-10">
                {insights.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in duration-1000">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <Check className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[12px] text-foreground font-bold uppercase tracking-widest">Neural Network Clear</p>
                            <p className="text-[11px] text-muted-foreground italic leading-relaxed max-w-[200px]">
                                Your enterprise is operating at peak efficiency. No immediate risks detected by the command center.
                            </p>
                        </div>
                    </div>
                ) : (
                    insights.map((insight) => (
                        <div key={insight.id} className="space-y-4">
                            <div
                                className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-transparent border border-border/50 hover:border-violet-500/40 hover:from-violet-500/[0.05] hover:to-transparent transition-colors duration-300 cursor-pointer group/item shadow-sm relative overflow-hidden"
                                onClick={() => router.push(insight.actionHref)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 rounded-lg bg-muted/40 border border-border/50 group-hover/item:border-violet-500/20 transition-colors">
                                        {getIcon(insight.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-black text-foreground/90 uppercase tracking-[0.15em]">{insight.title}</h4>
                                            <div className="flex items-center gap-2">
                                                {insight.priority === 'high' && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>
                                                )}
                                                <button
                                                    onClick={(e) => handleDismiss(e, insight.id)}
                                                    className="p-1 rounded-md bg-muted/40 border border-border/50 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-muted-foreground hover:text-emerald-400 transition-colors"
                                                    title="Mark as complete"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-foreground/60 line-clamp-2 mt-2 font-medium leading-relaxed italic">
                                            "{insight.description}"
                                        </p>

                                        {/* Action link */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 translate-y-1 opacity-0 group-hover/item:translate-y-0 group-hover/item:opacity-100 transition-colors duration-300">
                                                {insight.action} <ChevronRight size={12} className="group-hover/item:translate-x-0.5 transition-transform" />
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{insight.priority} Priority</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assumptions Section if present */}
                            {insight.assumptions && (
                                <div className="px-1 space-y-3 pb-2 animate-in fade-in slide-in-from-top-2 duration-700">
                                    <h5 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="h-px flex-1 bg-border/20" />
                                        NEURAL ASSUMPTIONS
                                        <span className="h-px flex-1 bg-border/20" />
                                    </h5>
                                    <div className="grid gap-3">
                                        {insight.assumptions.map((assumption: any, idx: number) => (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] font-medium">
                                                    <span className="text-foreground/70 italic">"{assumption.text}"</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/40">{assumption.confidence}/10 Conf.</span>
                                                </div>
                                                {/* Confidence Bar */}
                                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-colors duration-1000 delay-300"
                                                        style={{ width: `${assumption.confidence * 10}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-center text-muted-foreground/30 italic pt-2">
                                        Rates are calculated based on cross-database pattern matches.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
