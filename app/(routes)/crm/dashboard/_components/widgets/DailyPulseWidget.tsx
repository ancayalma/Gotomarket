"use client";

import React, { useState, useEffect } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Zap, Loader2, AlertCircle, Quote, TrendingUp } from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

interface BriefingData {
    summary: string;
    highValueAlerts: string[];
}

export const DailyPulseWidget = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BriefingData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                setLoading(true);
                const response = await axios.get("/api/calendar/briefing");
                setData(response.data);
                setError(null);
            } catch (err: any) {
                console.error("Briefing widget error:", err);
                setError("Pulse unavailable");
            } finally {
                setLoading(false);
            }
        };

        fetchBriefing();
    }, []);

    if (error) {
        return (
            <WidgetWrapper
                title="AI Daily Briefing"
                icon={Zap}
                iconColor="text-amber-400"
            >
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-xs italic font-medium">Strategic intelligence offline</p>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <WidgetWrapper
            title="AI Daily Briefing"
            icon={Zap}
            iconColor="text-amber-500"
            className="overflow-hidden group/pulse border-amber-500/20"
        >
            <div className="space-y-4 pt-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">Scanning Objectives...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Section */}
                        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-transparent border border-amber-500/10 group-hover/pulse:border-amber-500/20 transition-all duration-700 shadow-inner group/summary">
                            <div className="absolute top-3 left-3 opacity-20 group-hover/summary:opacity-40 transition-opacity duration-700">
                                <Quote className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                            </div>
                            <p className="text-[13px] font-medium leading-relaxed italic text-foreground/90 pl-6 relative z-10">
                                {data?.summary || "No priorities detected for today. A perfect time to plan ahead or focus on deep work."}
                            </p>
                        </div>

                        {/* Alerts Section */}
                        {data?.highValueAlerts && data.highValueAlerts.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 pl-1 mb-1">
                                    <TrendingUp className="h-3 w-3 text-amber-500" />
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">High Value Focus</h5>
                                </div>
                                <div className="space-y-1.5">
                                    {data.highValueAlerts.map((alert, idx) => (
                                        <div key={idx} className="flex gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors group/item">
                                            <div className="h-4 w-1 rounded-full bg-amber-500/40 group-hover/item:bg-amber-500 transition-colors shrink-0 mt-0.5" />
                                            <span className="text-[11px] font-bold text-muted-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
                                                {alert}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loading && !data?.summary && (
                            <div className="py-6 text-center italic text-muted-foreground/40 text-xs">
                                Calm before the storm. No high-priority alerts.
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-500 border-none px-2 py-0.5 font-black uppercase tracking-[0.1em]">
                                Live Pulse
                            </Badge>
                        </div>
                    </>
                )}
            </div>
        </WidgetWrapper>
    );
};
