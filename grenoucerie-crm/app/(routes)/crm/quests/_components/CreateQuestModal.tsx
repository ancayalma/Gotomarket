"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ChevronRight, ChevronLeft, Sword, Zap, Flame, Crown, Target,
    Trophy, Calendar, Timer, Rocket, Settings, Infinity, BarChart3,
    Mail, Phone, FileText, Users2, GraduationCap, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import BadgeSVG from "@/components/ui/BadgeSVG";
import type { BadgeDNA } from "@/lib/quest-engine/badge-dna";

const generateRandomDNA = (): BadgeDNA => ({
    shape: Math.floor(Math.random() * 8),
    icon: Math.floor(Math.random() * 24),
    palette: Math.floor(Math.random() * 12),
    pattern: Math.floor(Math.random() * 6),
    frame: Math.floor(Math.random() * 7),
    rarity: Math.floor(Math.random() * 5),
});

interface CreateQuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const QUEST_TYPES = [
    {
        category: "Sales & Pipeline", types: [
            { id: "close_leads", label: "Close Leads", icon: Target },
            { id: "convert_accounts", label: "Convert Accounts", icon: Users2 },
            { id: "close_deals", label: "Close Deals", icon: Trophy },
            { id: "create_opportunities", label: "Create Opportunities", icon: Zap },
            { id: "revenue_target", label: "Revenue Target", icon: BarChart3 },
        ]
    },
    {
        category: "Outreach", types: [
            { id: "send_outreach", label: "Send Emails", icon: Mail },
            { id: "book_meetings", label: "Book Meetings", icon: Calendar },
            { id: "make_calls", label: "Make Calls", icon: Phone },
        ]
    },
    {
        category: "Productivity", types: [
            { id: "complete_tasks", label: "Complete Tasks", icon: CheckCircle2 },
            { id: "create_contacts", label: "Add Contacts", icon: Users2 },
            { id: "upload_documents", label: "Upload Documents", icon: FileText },
        ]
    },
    {
        category: "Learning", types: [
            { id: "reach_mastery", label: "Reach Mastery Level", icon: GraduationCap },
            { id: "login_streak", label: "Login Streak", icon: Flame },
        ]
    },
    {
        category: "Custom", types: [
            { id: "custom_manual", label: "Custom (Manual)", icon: Settings },
        ]
    },
];

const DIFFICULTIES = [
    { id: "EASY", label: "Easy", qp: 50, xp: 25, icon: Target, color: "emerald" },
    { id: "MEDIUM", label: "Medium", qp: 100, xp: 50, icon: Sword, color: "amber" },
    { id: "HARD", label: "Hard", qp: 200, xp: 100, icon: Flame, color: "rose" },
    { id: "LEGENDARY", label: "Legendary", qp: 500, xp: 250, icon: Crown, color: "violet" },
];

const DURATION_PRESETS = [
    { id: "WEEKEND_SPRINT", label: "Weekend Blitz", icon: Flame, desc: "Fri 5pm - Sun 11:59pm" },
    { id: "WEEKLY_SPRINT", label: "Weekly Sprint", icon: Zap, desc: "7-day sprint (Mon - Sun)" },
    { id: "BIWEEKLY", label: "Bi-Weekly", icon: BarChart3, desc: "14-day challenge" },
    { id: "MONTHLY", label: "Monthly Mission", icon: Calendar, desc: "Full calendar month" },
    { id: "QUARTERLY", label: "Quarterly Quest", icon: Trophy, desc: "3-month campaign" },
    { id: "STRONG_START", label: "Strong Start", icon: Rocket, desc: "1st - 4th of the month" },
    { id: "STRONG_FINISH", label: "Strong Finish", icon: Target, desc: "28th - 31st of the month" },
    { id: "CUSTOM", label: "Custom", icon: Settings, desc: "Pick exact dates" },
    { id: "OPEN_ENDED", label: "No Deadline", icon: Infinity, desc: "Runs until closed" },
];

const STEPS = ["Identity", "Quest Type", "Target & Difficulty", "Duration", "Review"];

export default function CreateQuestModal({ isOpen, onClose, onCreated }: CreateQuestModalProps) {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [questType, setQuestType] = useState("");
    const [targetCount, setTargetCount] = useState(10);
    const [difficulty, setDifficulty] = useState("MEDIUM");
    const [xpReward, setXpReward] = useState(50);
    const [enableCustomBadge, setEnableCustomBadge] = useState(false);
    const [badgeDNA, setBadgeDNA] = useState<BadgeDNA | null>(null);
    const [durationPreset, setDurationPreset] = useState("WEEKLY_SPRINT");
    const [isRecurring, setIsRecurring] = useState(false);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [launchAsActive, setLaunchAsActive] = useState(true);

    const selectedDifficulty = DIFFICULTIES.find((d) => d.id === difficulty);
    const qpReward = selectedDifficulty?.qp || 100;

    const canProceed = () => {
        switch (step) {
            case 0: return title.trim().length >= 3;
            case 1: return questType !== "";
            case 2: return targetCount > 0;
            case 3: return durationPreset !== "";
            default: return true;
        }
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const { createQuest } = await import("@/actions/quests/create-quest");
            const result = await createQuest({
                title,
                description: description || undefined,
                quest_type: questType,
                target_count: targetCount,
                difficulty: difficulty as any,
                qp_reward: qpReward,
                xp_reward: xpReward,
                badge_dna: enableCustomBadge ? badgeDNA : undefined,
                badge_name: enableCustomBadge ? "Custom Quest Badge" : undefined,
                duration_preset: durationPreset as any,
                starts_at: durationPreset === "CUSTOM" && customStartDate ? customStartDate : undefined,
                ends_at: durationPreset === "CUSTOM" && customEndDate ? customEndDate : undefined,
                is_recurring: isRecurring,
                status: launchAsActive ? "ACTIVE" : "DRAFT",
            });

            if (result.success) {
                // Reset form
                setStep(0);
                setTitle("");
                setDescription("");
                setQuestType("");
                setTargetCount(10);
                setDifficulty("MEDIUM");
                setXpReward(50);
                setEnableCustomBadge(false);
                setBadgeDNA(null);
                setDurationPreset("WEEKLY_SPRINT");
                setIsRecurring(false);
                onCreated();
            } else {
                setError(result.error === "QUEST_LIMIT_REACHED"
                    ? "You've reached the maximum number of active quests for your plan."
                    : result.error === "PLAN_UPGRADE_REQUIRED"
                        ? "Your plan does not include Quests. Please upgrade."
                        : "Failed to create quest. Please try again."
                );
            }
        } catch (e) {
            setError("An unexpected error occurred.");
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    }, [title, description, questType, targetCount, difficulty, qpReward, xpReward, durationPreset, customStartDate, customEndDate, isRecurring, launchAsActive, enableCustomBadge, badgeDNA, onCreated]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Sword className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Create Quest</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-1 mb-4">
                        {STEPS.map((s, idx) => (
                            <div key={s} className="flex items-center gap-1 flex-1">
                                <div className={cn(
                                    "h-1 flex-1 rounded-full transition-colors",
                                    idx <= step ? "bg-amber-500" : "bg-muted/30"
                                )} />
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                        Step {step + 1} of {STEPS.length}: <span className="font-medium text-foreground">{STEPS[step]}</span>
                    </p>
                </div>

                {/* Step Content */}
                <div className="px-6 pb-4 min-h-[280px]">
                    <AnimatePresence mode="wait">
                        {/* Step 0: Identity */}
                        {step === 0 && (
                            <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Quest Title</label>
                                    <Input
                                        placeholder='e.g. "Close 10 Deals This Week"'
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-10"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                                    <Textarea
                                        placeholder="Motivational description for your team..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Quest Type */}
                        {step === 1 && (
                            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                {QUEST_TYPES.map((cat) => (
                                    <div key={cat.category}>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{cat.category}</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {cat.types.map((t) => {
                                                const Icon = t.icon;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setQuestType(t.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left",
                                                            questType === t.id
                                                                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                                                                : "border-white/5 hover:border-white/10 hover:bg-muted/30"
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                                        <span className="text-xs">{t.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Step 2: Target & Difficulty */}
                        {step === 2 && (
                            <motion.div key="target" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Target Count</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={targetCount}
                                        onChange={(e) => setTargetCount(Number(e.target.value) || 1)}
                                        className="h-10"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">How many actions to complete this quest</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {DIFFICULTIES.map((d) => {
                                            const Icon = d.icon;
                                            return (
                                                <button
                                                    key={d.id}
                                                    onClick={() => setDifficulty(d.id)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all",
                                                        difficulty === d.id
                                                            ? `border-${d.color}-500/50 bg-${d.color}-500/10`
                                                            : "border-white/5 hover:border-white/10",
                                                        difficulty === d.id && d.color === "emerald" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                                                        difficulty === d.id && d.color === "amber" && "border-amber-500/50 bg-amber-500/10 text-amber-400",
                                                        difficulty === d.id && d.color === "rose" && "border-rose-500/50 bg-rose-500/10 text-rose-400",
                                                        difficulty === d.id && d.color === "violet" && "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                                    <div className="text-left">
                                                        <div className="text-xs font-semibold">{d.label}</div>
                                                        <div className="text-[10px] text-muted-foreground">{d.qp} QP · {d.xp} XP</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">XP Reward</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={xpReward}
                                        onChange={(e) => setXpReward(Number(e.target.value) || 1)}
                                        className="h-10"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">XP earned toward user level progression</p>
                                </div>
                                <div className="pt-2 border-t border-white/5 mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                                        <input
                                            type="checkbox"
                                            checked={enableCustomBadge}
                                            onChange={(e) => {
                                                setEnableCustomBadge(e.target.checked);
                                                if (e.target.checked && !badgeDNA) setBadgeDNA(generateRandomDNA());
                                            }}
                                            className="rounded border-white/20"
                                        />
                                        <span className="text-sm font-medium">Award custom unique badge</span>
                                    </label>
                                    
                                    {enableCustomBadge && badgeDNA && (
                                        <div className="flex items-center gap-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                                            <BadgeSVG dna={badgeDNA} size={48} />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold mb-1">Quest Completion Badge</p>
                                                <p className="text-[10px] text-muted-foreground mb-2">Awarded automatically upon completion</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10"
                                                    onClick={() => setBadgeDNA(generateRandomDNA())}
                                                >
                                                    Randomize DNA
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Duration */}
                        {step === 3 && (
                            <motion.div key="duration" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div className="grid grid-cols-3 gap-1.5">
                                    {DURATION_PRESETS.map((d) => {
                                        const Icon = d.icon;
                                        return (
                                            <button
                                                key={d.id}
                                                onClick={() => setDurationPreset(d.id)}
                                                className={cn(
                                                    "flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-center transition-all",
                                                    durationPreset === d.id
                                                        ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                                                        : "border-white/5 hover:border-white/10 hover:bg-muted/30"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-[10px] font-semibold">{d.label}</span>
                                                <span className="text-[9px] text-muted-foreground">{d.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {durationPreset === "CUSTOM" && (
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Start Date</label>
                                            <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-9 text-xs" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">End Date</label>
                                            <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-9 text-xs" />
                                        </div>
                                    </div>
                                )}

                                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="rounded border-white/20"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium">Auto-repeat when this quest ends</span>
                                    </div>
                                </label>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {step === 4 && (
                            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                                <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{title}</h4>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border",
                                            difficulty === "EASY" && "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
                                            difficulty === "MEDIUM" && "text-amber-400 border-amber-500/30 bg-amber-500/10",
                                            difficulty === "HARD" && "text-rose-400 border-rose-500/30 bg-rose-500/10",
                                            difficulty === "LEGENDARY" && "text-violet-300 border-violet-500/30 bg-violet-500/10"
                                        )}>
                                            {difficulty}
                                        </span>
                                    </div>
                                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                                        <div className="rounded border p-2 bg-background/50">
                                            <span className="text-muted-foreground">Type:</span>{" "}
                                            <span className="font-medium">{questType.replace(/_/g, " ")}</span>
                                        </div>
                                        <div className="rounded border p-2 bg-background/50">
                                            <span className="text-muted-foreground">Target:</span>{" "}
                                            <span className="font-medium">{targetCount}</span>
                                        </div>
                                        <div className="rounded border p-2 bg-background/50">
                                            <span className="text-muted-foreground">Duration:</span>{" "}
                                            <span className="font-medium">{DURATION_PRESETS.find((d) => d.id === durationPreset)?.label}</span>
                                        </div>
                                        <div className="rounded border p-2 bg-background/50">
                                            <span className="text-muted-foreground">Reward:</span>{" "}
                                            <span className="font-medium text-amber-400">{qpReward} QP · {xpReward} XP</span>
                                        </div>
                                    </div>
                                    {isRecurring && (
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Timer className="w-3 h-3" /> Auto-repeating enabled
                                        </p>
                                    )}
                                </div>

                                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={launchAsActive}
                                        onChange={(e) => setLaunchAsActive(e.target.checked)}
                                        className="rounded border-white/20"
                                    />
                                    <span className="text-xs font-medium">Launch immediately as Active (otherwise saves as Draft)</span>
                                </label>

                                {error && (
                                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                                        {error}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {step > 0 ? "Back" : "Cancel"}
                    </Button>

                    {step < STEPS.length - 1 ? (
                        <Button
                            size="sm"
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="gap-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="gap-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                        >
                            {isSubmitting ? (
                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Sword className="w-4 h-4" />
                            )}
                            {launchAsActive ? "Launch Quest" : "Save Draft"}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
