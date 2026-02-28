"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Layout, Grid3X3, Check, Sparkles } from "lucide-react";
import { useDashboardLayout, WidgetItem } from "../../_context/DashboardLayoutContext";
import { cn } from "@/lib/utils";
import { CustomWidgetModal } from "./CustomWidgetModal";
import { motion } from "framer-motion";

interface WidgetGalleryProps {
    availableEntities: any[];
}

export const WidgetGallery = ({ availableEntities }: WidgetGalleryProps) => {
    const { widgets, toggleWidgetVisibility } = useDashboardLayout();
    const [open, setOpen] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

    const handleCreateCustom = (data: any) => {
        // Here we would normally call a server action to save to DB
        // For now, we'll simulate adding it to the local available set
        console.log("Creating custom widget:", data);
    };

    const hiddenWidgets = widgets.filter((w) => !w.isVisible);

    // Categories
    const customForcedWidgets = widgets.filter(w => w.id.startsWith("custom_"));
    const intelligenceWidgets = widgets.filter(w => !w.id.startsWith("entity:") && !w.id.startsWith("divider") && !w.id.startsWith("custom_"));
    const entityWidgets = widgets.filter(w => w.id.startsWith("entity:"));

    const getWidgetLabel = (id: string) => {
        if (id.startsWith("entity:")) {
            const entity = availableEntities.find(e => e.id === id);
            return entity?.name || id.replace("entity:", "").replace("_", " ");
        }
        const labels: Record<string, string> = {
            crm_entities_grid: "CRM Quick Access Grid",
            personal_pipeline: "Personal Sales Pipeline",
            team_pipeline: "Team Sales Overview",
            opportunity_forecast: "AI Revenue Forecast",
            customer_pulse: "Customer Pulse Analytics",
            campaign_performance: "Campaign ROI Monitor",
            ai_insights: "Intelligence Assistant",
            upcoming_meetings: "Today's Schedule",
            collaboration_feed: "Team Collaboration",
            conversion_rate: "Lead Conversion Rate",
            avg_deal_size: "Average Deal Size",
            response_time: "Avg Response Time",
            system_uptime: "Infrastructure Health",
            win_rate: "Win Rate Monitor",
            lead_velocity: "Lead Speed Gauge",
            invoice_aging: "Past Due Revenue",
            meeting_efficiency: "Conversion Catalyst",
            ai_savings: "AI Savings Tracker",
            system_health: "Global Health Status",
            active_users: "Active Team Pulse",
            revenue: "Monthly Sales Target",
            active_pipeline: "Live Pipeline Depth",
            my_schedule: "My Daily Planner",
            leaderboard: "Top Performers Hub",
            lead_sources: "Organic Lead Flow",
            deal_forecast: "Revenue Projections",
            activity_heatmap: "Team Engagement Map",
            customer_churn: "Retention Monitor",
            ticket_volume: "Support Load Density",
            sales_cycle_length: "Closing Velocity",
            high_priority_tasks: "Critical Task Feed",
            pending_approvals: "Decision Required",
            unread_messages: "Unread Notifications",
        };
        return labels[id] || id.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#0a0a0a] border-white/10 text-white w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Widget Gallery</SheetTitle>
                    <SheetDescription className="text-white/60">
                        Add intelligence widgets and quick access icons to your dashboard.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-12 pb-24">
                        {/* CUSTOM FORGED WIDGETS SECTION */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400/80">Forge: Custom Insights</h3>
                                </div>
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0px rgba(168,85,247,0)", "0 0 15px rgba(168,85,247,0.5)", "0 0 0px rgba(168,85,247,0)"],
                                        scale: [1, 1.02, 1]
                                    }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCustomModalOpen(true)}
                                        className="bg-primary/20 border-primary/40 hover:bg-primary/30 text-white text-[10px] font-black uppercase h-8 px-4 tracking-widest shadow-[inset_0_0_10px_rgba(168,85,247,0.2)]"
                                    >
                                        ✨ Craft Custom
                                    </Button>
                                </motion.div>
                            </div>

                            {customForcedWidgets.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {customForcedWidgets.map((widget) => {
                                        const isAlreadyAdded = widget.isVisible;
                                        return (
                                            <div
                                                key={widget.id}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-colors group relative overflow-hidden",
                                                    isAlreadyAdded
                                                        ? "bg-white/[0.02] border-white/5 opacity-40 grayscale pointer-events-none"
                                                        : "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/20"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white text-sm tracking-tight">{getWidgetLabel(widget.id)}</p>
                                                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Custom</span>
                                                    </div>
                                                    <p className="text-[10px] text-white/40 font-medium tracking-wide uppercase">Proprietary Metric</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={isAlreadyAdded ? "ghost" : "default"}
                                                    onClick={() => !isAlreadyAdded && toggleWidgetVisibility(widget.id, true)}
                                                    className={cn(
                                                        "h-8 w-8 p-0 rounded-lg",
                                                        isAlreadyAdded
                                                            ? "bg-transparent text-white/20"
                                                            : "bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-white"
                                                    )}
                                                >
                                                    {isAlreadyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.02]">
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No custom metrics forged yet</p>
                                </div>
                            )}
                        </div>

                        {/* STANDARD INTELLIGENCE SECTION */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Layout className="w-5 h-5 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary/80">Standard Intelligence</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {intelligenceWidgets.map((widget) => {
                                    const isAlreadyAdded = widget.isVisible;
                                    return (
                                        <div
                                            key={widget.id}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-colors group relative overflow-hidden",
                                                isAlreadyAdded
                                                    ? "bg-white/[0.02] border-white/5 opacity-40 grayscale pointer-events-none"
                                                    : "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white text-sm tracking-tight">{getWidgetLabel(widget.id)}</p>
                                                    {isAlreadyAdded && (
                                                        <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Live</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-white/40 font-medium tracking-wide uppercase">{widget.id.replace("_", " ")}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={isAlreadyAdded ? "ghost" : "default"}
                                                onClick={() => !isAlreadyAdded && toggleWidgetVisibility(widget.id, true)}
                                                className={cn(
                                                    "h-8 w-8 p-0 rounded-lg",
                                                    isAlreadyAdded
                                                        ? "bg-transparent text-white/20"
                                                        : "bg-primary/20 hover:bg-primary text-primary hover:text-white"
                                                )}
                                            >
                                                {isAlreadyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Entity Icons */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <Grid3X3 className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500/80">Entity Shortcuts</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {widgets.filter(w => w.id.startsWith("entity:")).map((widget) => {
                                    const isAlreadyAdded = widget.isVisible;
                                    return (
                                        <div
                                            key={widget.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border transition-colors group",
                                                isAlreadyAdded
                                                    ? "bg-white/[0.02] border-white/5 opacity-40 grayscale pointer-events-none"
                                                    : "bg-white/5 border-white/10 hover:border-emerald-500/50"
                                            )}
                                        >
                                            <span className="text-xs font-bold text-white/80">{getWidgetLabel(widget.id)}</span>
                                            <button
                                                disabled={isAlreadyAdded}
                                                onClick={() => toggleWidgetVisibility(widget.id, true)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    isAlreadyAdded
                                                        ? "bg-transparent text-white/20"
                                                        : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                )}
                                            >
                                                {isAlreadyAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-xl">
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 uppercase tracking-widest text-xs"
                        onClick={() => setOpen(false)}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Done Personalizing
                    </Button>
                </div>
            </SheetContent>

            <CustomWidgetModal
                isOpen={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                onCreate={handleCreateCustom}
            />
        </Sheet>
    );
};
