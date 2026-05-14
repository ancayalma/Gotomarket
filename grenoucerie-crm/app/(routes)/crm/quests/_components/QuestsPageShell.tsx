"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Plus, Search, Filter, Trophy, Zap, Flame, Medal, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QuestCard from "./QuestCard";
import CreateQuestModal from "./CreateQuestModal";
import MyQuestsSummary from "./MyQuestsSummary";
import QuestSystemGuide from "./QuestSystemGuide";
import type { QuestWithProgress } from "@/actions/quests/types";
import { LearnLink } from "@/components/ui/LearnLink";

interface QuestsPageShellProps {
    quests: QuestWithProgress[];
    myProgress: {
        totalQP: number;
        seasonQP: number;
        questsCompleted: number;
        activeQuests: number;
        streak: number;
        badges: string[];
        rank: number;
        xpTotal: number;
        xpCurrent: number;
        xpToNext: number;
        level: number;
        prestige: number;
        prestigeTitle: string;
        progressPct: number;
        earnedBadges: any[];
        showcaseBadge: any | null;
    } | null;
    activeQuestCount: number;
    isAdmin: boolean;
    userId: string;
}

const STATUS_TABS = [
    { id: "ACTIVE", label: "Active", icon: Zap },
    { id: "COMPLETED", label: "Completed", icon: Trophy },
    { id: "DRAFT", label: "Drafts", icon: Filter, adminOnly: true },
    { id: "ARCHIVED", label: "Archived", icon: Filter, adminOnly: true },
    { id: "GUIDE", label: "Field Manual", icon: Medal },
];

const DIFFICULTY_FILTERS = ["ALL", "EASY", "MEDIUM", "HARD", "LEGENDARY"] as const;

export default function QuestsPageShell({
    quests: initialQuests,
    myProgress,
    activeQuestCount,
    isAdmin,
    userId,
}: QuestsPageShellProps) {
    const [quests, setQuests] = useState(initialQuests);
    const [activeTab, setActiveTab] = useState("ACTIVE");
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const filteredQuests = useMemo(() => {
        return quests.filter((q) => {
            if (q.status !== activeTab) return false;
            if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    q.title.toLowerCase().includes(query) ||
                    (q.description || "").toLowerCase().includes(query) ||
                    q.quest_type.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [quests, activeTab, difficultyFilter, searchQuery]);

    const visibleTabs = STATUS_TABS.filter((tab) => !tab.adminOnly || isAdmin);

    const handleQuestCreated = async () => {
        setShowCreateModal(false);
        // Re-fetch quests
        try {
            const { getQuests } = await import("@/actions/quests/get-quests");
            const fresh = await getQuests();
            setQuests(fresh);
        } catch (e) {
            console.error("Failed to refresh quests:", e);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Learn context for Utility Bar */}
            <LearnLink
                tab="quests"
                overviewTitle="Quest System"
                overviewWhat="Quests are time-bound team challenges that convert CRM activities into competitive sprints. Earn Quest Points (QP) by completing goals like closing deals, converting leads, or hitting revenue targets."
                overviewWhy="Gamification drives engagement and accountability. Quests give your team clear, measurable targets with real-time progress tracking and leaderboard rankings."
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Sword className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed">Quests</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                            {isAdmin
                                ? "Create and manage team challenges"
                                : "Complete challenges to earn Quest Points"}
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
                    >
                        <Plus className="w-4 h-4" />
                        Create Quest
                    </Button>
                )}
            </motion.div>

            {/* My Stats Summary */}
            <MyQuestsSummary progress={myProgress} userId={userId} />

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.03] bg-white/[0.02] backdrop-blur-sm shadow-xl"
            >
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg transition-all duration-300 flex items-center gap-2",
                                    isActive
                                        ? "bg-primary text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/[0.05]"
                                )}
                            >
                                <Icon className={cn("w-3 h-3", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search + Difficulty */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="SEARCH SYSTEM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 w-48 text-[10px] font-black uppercase tracking-widest bg-white/[0.02] border-white/[0.05] focus-visible:ring-primary/20 placeholder:text-muted-foreground/20"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 px-2 lg:hidden">Filter:</span>
                        {DIFFICULTY_FILTERS.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficultyFilter(d)}
                                className={cn(
                                    "px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    difficultyFilter === d
                                        ? "bg-white/[0.08] text-foreground shadow-sm ring-1 ring-white/10"
                                        : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-white/[0.02]",
                                    d === "EASY" && difficultyFilter === d && "text-emerald-400",
                                    d === "MEDIUM" && difficultyFilter === d && "text-amber-400",
                                    d === "HARD" && difficultyFilter === d && "text-rose-400",
                                    d === "LEGENDARY" && difficultyFilter === d && "text-violet-400"
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {activeTab === "GUIDE" ? (
                <QuestSystemGuide />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredQuests.map((quest, idx) => (
                            <motion.div
                                key={quest.id}
                                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{
                                    duration: 0.3,
                                    delay: idx * 0.05,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                            >
                                <QuestCard
                                    quest={quest}
                                    isAdmin={isAdmin}
                                    onStatusChange={handleQuestCreated}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredQuests.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <Sword className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-muted-foreground">
                                {activeTab === "ACTIVE"
                                    ? "No active quests"
                                    : `No ${activeTab.toLowerCase()} quests`}
                            </h3>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                {isAdmin && activeTab === "ACTIVE"
                                    ? "Create your first quest to get your team started."
                                    : "Check back soon for new challenges."}
                            </p>
                            {isAdmin && activeTab === "ACTIVE" && (
                                <Button
                                    variant="outline"
                                    className="mt-4 gap-2"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Quest
                                </Button>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {/* Create Quest Modal */}
            {isAdmin && (
                <CreateQuestModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleQuestCreated}
                />
            )}
        </div>
    );
}
