"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Activity,
    Users,
    DollarSign,
    Check,
    Sparkles,
    Layout,
    Target,
    Filter,
    Gauge,
    Calendar,
    ArrowRight,
    ArrowLeft,
    Trash2,
    Plus,
    Infinity,
    Zap,
    Scale,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
}

const EXPERT_PRESETS = [
    { id: "momentum", label: "Deal Momentum", desc: "Change in pipeline value over 7 days", icon: Zap },
    { id: "late_cycle", label: "Late Cycle Risk", desc: "Opportunities stuck in 'Negotiation' > 14 days", icon: ShieldAlert },
    { id: "velocity", label: "Sales Velocity", desc: "Average days from New to Closed Won", icon: TrendingUp },
    { id: "efficiency", label: "Opex Efficiency", desc: "Revenue generated per active team member", icon: Scale },
];

const ICONS = [
    { id: "BarChart3", icon: BarChart3 },
    { id: "TrendingUp", icon: TrendingUp },
    { id: "Activity", icon: Activity },
    { id: "Gauge", icon: Gauge },
    { id: "Users", icon: Users },
    { id: "DollarSign", icon: DollarSign },
    { id: "Target", icon: Target },
    { id: "Sparkles", icon: Sparkles },
];

const THEMES = [
    { id: "primary", bg: "bg-primary/20", border: "border-primary/50", text: "text-primary" },
    { id: "emerald", bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400" },
    { id: "amber", bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400" },
    { id: "rose", bg: "bg-rose-500/20", border: "border-rose-500/50", text: "text-rose-400" },
    { id: "violet", bg: "bg-violet-500/20", border: "border-violet-500/50", text: "text-violet-400" },
    { id: "cyan", bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400" },
];

const CHART_TYPES = [
    { id: "METRIC", label: "High Impact Metric", desc: "Pure numerical focus", icon: Activity },
    { id: "GAUGE", label: "Progress Gauge", desc: "Radial success tracker", icon: Gauge },
    { id: "SPARKLINE", label: "Trend Sparkline", desc: "30-day volatility line", icon: TrendingUp },
    { id: "BAR", label: "Mini Bar Chart", desc: "Segmented comparison", icon: BarChart3 },
];

const DATA_DOMAINS = [
    { id: "Leads", label: "CRM: Leads", icon: Users },
    { id: "Opportunities", label: "CRM: Pipeline", icon: Target },
    { id: "Invoices", label: "Finance: Invoices", icon: DollarSign },
    { id: "Tasks", label: "Ops: Execution", icon: Layout },
    { id: "Tickets", label: "Support: Tickets", icon: ShieldAlert },
    { id: "Campaigns", label: "Growth: Campaigns", icon: Zap },
];

const OPERATORS = [
    { id: "equals", label: "Equals" },
    { id: "gt", label: "Greater Than" },
    { id: "lt", label: "Less Than" },
    { id: "contains", label: "Contains" },
];

export const CustomWidgetModal = ({ isOpen, onClose, onCreate }: CustomWidgetModalProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        icon: "BarChart3",
        color: "primary",
        dataSource: "Opportunities",
        aggregation: "SUM",
        targetField: "amount",
        chartType: "METRIC",
        targetValue: "",
        preset: "none",
        filters: [] as { field: string; operator: string; value: string }[],
        comparison: "NONE",
    });

    const addFilter = () => {
        setFormData({
            ...formData,
            filters: [...formData.filters, { field: "status", operator: "equals", value: "" }]
        });
    };

    const removeFilter = (index: number) => {
        setFormData({
            ...formData,
            filters: formData.filters.filter((_, i) => i !== index)
        });
    };

    const handleCreate = () => {
        onCreate(formData);
        onClose();
        setStep(1);
    };

    const steps = [
        { id: 1, label: "Intelligence Logic", icon: Zap },
        { id: 2, label: "Constraint Filter", icon: Filter },
        { id: 3, label: "Visual Archetype", icon: Layout },
        { id: 4, label: "Goal Benchmarks", icon: Target },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-4xl p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] border-t-primary border-t-2">
                <DialogHeader className="sr-only">
                    <DialogTitle>Intelligence Architect Wizard</DialogTitle>
                    <DialogDescription>Design and forge custom dashboard metrics</DialogDescription>
                </DialogHeader>
                <div className="flex h-[700px]">
                    {/* Left Sidebar Steps */}
                    <div className="w-64 bg-white/[0.01] border-r border-white/5 p-8 flex flex-col">
                        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                            <div className="p-2 rounded-xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] text-white">
                                <Sparkles size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Basalt</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Intelligence Forge</span>
                            </div>
                        </div>

                        <div className="space-y-8 flex-1">
                            {steps.map((s) => (
                                <div key={s.id} className="flex items-center gap-4 group">
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-700",
                                        step === s.id
                                            ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.5)] rotate-12"
                                            : step > s.id
                                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                : "border-white/5 text-white/10"
                                    )}>
                                        {step > s.id ? <Check size={18} strokeWidth={3} /> : <s.icon size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-widest transition-colors",
                                            step === s.id ? "text-white" : "text-white/20"
                                        )}>{s.label}</span>
                                        <span className="text-[9px] font-medium text-white/10">Phase {s.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest text-center">
                                    Operational Integrity 100%
                                </p>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: "25%" }}
                                    animate={{ width: `${(step / 4) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 flex flex-col bg-gradient-to-br from-black to-[#0d0d0d]">
                        <div className="p-10 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-2 italic">
                                    {steps[step - 1].label}
                                </h2>
                                <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Architectural Directive {step}.0</p>
                            </div>
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-10"
                                    >
                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Metric Nomenclature</Label>
                                            <Input
                                                placeholder="e.g., GLOBAL REVENUE VELOCITY"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                                className="bg-white/5 border-white/10 h-16 text-2xl font-black focus:border-primary/50 focus:ring-0 placeholder:text-white/5 bg-transparent border-b-2 border-x-0 border-t-0 rounded-none px-0"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Expert Algorithm Presets</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {EXPERT_PRESETS.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setFormData({ ...formData, preset: p.id })}
                                                        className={cn(
                                                            "flex items-start p-4 rounded-2xl border transition-all text-left gap-4",
                                                            formData.preset === p.id
                                                                ? "bg-primary/20 border-primary shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]"
                                                                : "bg-white/5 border-white/5 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className={cn("p-2 rounded-xl", formData.preset === p.id ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                                                            <p.icon size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-black uppercase tracking-wider">{p.label}</p>
                                                            <p className="text-[9px] font-medium text-white/30 leading-tight">{p.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">Data Domain</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {DATA_DOMAINS.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => setFormData({ ...formData, dataSource: s.id })}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2",
                                                                formData.dataSource === s.id
                                                                    ? "bg-primary/10 border-primary text-primary"
                                                                    : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"
                                                            )}
                                                        >
                                                            <s.icon size={18} />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">{s.label.split(":")[1]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">Compute Logic</Label>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "COUNT", label: "Volume: Record Count" },
                                                        { id: "SUM", label: "Financial: Field Total" },
                                                        { id: "AVG", label: "Quality: Mean Value" }
                                                    ].map((a) => (
                                                        <button
                                                            key={a.id}
                                                            onClick={() => setFormData({ ...formData, aggregation: a.id })}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                                                                formData.aggregation === a.id
                                                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                                                    : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"
                                                            )}
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{a.label}</span>
                                                            {formData.aggregation === a.id && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">Operational Comparison</Label>
                                                <div className="space-y-2">
                                                    {[
                                                        { id: "NONE", label: "Static: Current Realtime" },
                                                        { id: "MOM", label: "Growth: Month-over-Month" },
                                                        { id: "YOY", label: "Yearly: Year-over-Year" }
                                                    ].map((c) => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => setFormData({ ...formData, comparison: c.id })}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                                                                formData.comparison === c.id
                                                                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                                                                    : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"
                                                            )}
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                                                            {formData.comparison === c.id && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Constraint Filtering</Label>
                                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-1">Isolate specific record segments for deep analysis</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={addFilter}
                                                className="bg-primary/10 border-primary/20 text-primary font-black uppercase tracking-[0.2em] text-[9px] h-8"
                                            >
                                                <Plus size={12} className="mr-2" /> Add Logic Constraint
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.filters.length === 0 ? (
                                                <div className="p-20 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center bg-white/[0.01]">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                                        <Filter size={32} className="text-white/20" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] max-w-[280px] leading-relaxed">
                                                        Unfiltered Perspective: All data in this domain will flow into the forged metric.
                                                    </p>
                                                </div>
                                            ) : (
                                                formData.filters.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                                                        <div className="flex-1 flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl gap-6">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40">#{i + 1}</div>
                                                            <Input
                                                                value={f.field}
                                                                placeholder="FIELD_ID"
                                                                onChange={(e) => {
                                                                    const newFilters = [...formData.filters];
                                                                    newFilters[i].field = e.target.value.toLowerCase();
                                                                    setFormData({ ...formData, filters: newFilters });
                                                                }}
                                                                className="bg-transparent border-none text-[12px] font-black uppercase tracking-widest h-10 px-0 focus:ring-0 placeholder:text-white/5"
                                                            />
                                                            <select
                                                                value={f.operator}
                                                                onChange={(e) => {
                                                                    const newFilters = [...formData.filters];
                                                                    newFilters[i].operator = e.target.value;
                                                                    setFormData({ ...formData, filters: newFilters });
                                                                }}
                                                                className="bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-primary uppercase tracking-[0.2em] h-8 px-2 outline-none appearance-none cursor-pointer"
                                                            >
                                                                {OPERATORS.map(op => (
                                                                    <option key={op.id} value={op.id} className="bg-black text-white">{op.label}</option>
                                                                ))}
                                                            </select>
                                                            <Input
                                                                value={f.value}
                                                                placeholder="TARGET_VALUE"
                                                                onChange={(e) => {
                                                                    const newFilters = [...formData.filters];
                                                                    newFilters[i].value = e.target.value;
                                                                    setFormData({ ...formData, filters: newFilters });
                                                                }}
                                                                className="bg-white/5 border border-white/10 text-[12px] font-bold h-10 px-4 rounded-xl focus:border-primary/50"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeFilter(i)}
                                                            className="h-12 w-12 rounded-2xl text-white/10 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                        >
                                                            <Trash2 size={20} />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="space-y-12"
                                    >
                                        <div className="space-y-6">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Visual Paradigm Archetype</Label>
                                            <div className="grid grid-cols-4 gap-4">
                                                {CHART_TYPES.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setFormData({ ...formData, chartType: t.id })}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center gap-4 aspect-square",
                                                            formData.chartType === t.id
                                                                ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(var(--primary),0.2)]"
                                                                : "bg-white/5 border-white/5 hover:border-white/20 opacity-30 hover:opacity-100"
                                                        )}
                                                    >
                                                        <t.icon size={32} className={formData.chartType === t.id ? "text-primary" : "text-white/40"} />
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase tracking-widest">{t.label}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">Iconic Representation</Label>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {ICONS.map((i) => {
                                                        const IconComp = i.icon;
                                                        return (
                                                            <button
                                                                key={i.id}
                                                                onClick={() => setFormData({ ...formData, icon: i.id })}
                                                                className={cn(
                                                                    "flex items-center justify-center h-12 rounded-xl border transition-all",
                                                                    formData.icon === i.id
                                                                        ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                                                        : "bg-white/5 border-white/5 text-white/10 hover:text-white hover:border-white/20"
                                                                )}
                                                            >
                                                                <IconComp size={20} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">Luminous Palette</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {THEMES.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setFormData({ ...formData, color: t.id })}
                                                            className={cn(
                                                                "flex items-center h-12 rounded-xl border px-4 gap-3 transition-all",
                                                                formData.color === t.id
                                                                    ? `${t.bg} ${t.border} ${t.text} ring-1 ring-white/10`
                                                                    : "bg-white/5 border-white/5 text-white/20 hover:border-white/20"
                                                            )}
                                                        >
                                                            <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", t.id === "primary" ? "bg-primary" : `bg-${t.id}-500`)} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{t.id}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="space-y-12"
                                    >
                                        <div className="space-y-6">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary text-center block">Target Success Benchmark</Label>
                                            <div className="relative group">
                                                <div className="absolute inset-x-0 -top-4 text-center">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/10">Input Numeric Baseline</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={formData.targetValue}
                                                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                                                    className="bg-white/[0.02] border-white/5 h-32 text-6xl font-black text-center focus:border-primary/50 focus:ring-0 placeholder:text-white/[0.02] border-dashed border-2 rounded-[40px] tracking-tighter"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 block text-center">Manifest Visualization Preview</Label>
                                            <div className={cn(
                                                "p-12 rounded-[50px] border border-white/10 bg-black relative group overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-1000",
                                                "hover:scale-[1.02] hover:border-primary/40 ring-1 ring-white/5"
                                            )}>
                                                {/* Ambient Layer Gradient */}
                                                <div className={cn(
                                                    "absolute top-0 right-0 w-64 h-64 blur-[120px] -mr-32 -mt-32 transition-colors duration-1000",
                                                    THEMES.find(t => t.id === formData.color)?.bg || "bg-primary/40"
                                                )} />

                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
                                                            <span className="text-sm font-black tracking-[0.3em] uppercase text-white/80 italic">{formData.name || "UNNAMED_METRIC"}</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-4 mt-2">
                                                            <span className="text-6xl font-black text-white tracking-tighter">$1.24M</span>
                                                            {formData.targetValue && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Target Objective</span>
                                                                    <span className="text-lg font-black text-emerald-400">/ ${Number(formData.targetValue).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "p-8 rounded-[32px] shadow-2xl transition-all duration-1000 group-hover:rotate-12",
                                                        THEMES.find(t => t.id === formData.color)?.bg || "bg-primary/20",
                                                        THEMES.find(t => t.id === formData.color)?.text || "text-primary",
                                                        "shadow-black"
                                                    )}>
                                                        {React.createElement(ICONS.find(i => i.id === formData.icon)?.icon || BarChart3, { size: 48, strokeWidth: 3 })}
                                                    </div>
                                                </div>

                                                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Real-time Stream</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                formData.targetValue ? "bg-primary animate-bounce" : "bg-white/10"
                                                            )} />
                                                            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                                                                {formData.targetValue ? "Threshold Active" : "No Baseline"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Basalt Forge v2.4</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* High-Tactile Sticky Navigator */}
                        <div className="p-10 border-t border-white/5 flex items-center justify-between bg-black/80 backdrop-blur-2xl">
                            <Button
                                variant="ghost"
                                onClick={() => step === 1 ? onClose() : setStep(step - 1)}
                                className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white gap-3 h-14 group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {step === 1 ? "Deconstruct" : "Previous Phase"}
                            </Button>

                            <Button
                                onClick={() => step === 4 ? handleCreate() : setStep(step + 1)}
                                className={cn(
                                    "px-12 h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all duration-700 gap-4",
                                    step === 4
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
                                        : "bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_rgba(var(--primary),0.2)]"
                                )}
                                disabled={step === 1 && !formData.name}
                            >
                                {step === 4 ? "Finalize Manifest" : "Advance Pipeline"} <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
