"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Medal, Lock, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import BadgeSVG from "@/components/ui/BadgeSVG";
import { ACHIEVEMENT_CATALOG, RARITY_COLORS, type BadgeDNA } from "@/lib/quest-engine/badge-dna";
import { toast } from "sonner";

interface EarnedBadge {
    badge_id: string;
    badge_dna: BadgeDNA;
    badge_name: string;
    category: string;
    rarity: string;
    awarded_at: string;
}

interface BadgeShowcaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    earnedBadges: EarnedBadge[];
    userId: string;
}

const CATEGORIES = [
    { id: "all", label: "All" },
    { id: "quest", label: "Quest" },
    { id: "streak", label: "Streak" },
    { id: "level", label: "Level" },
    { id: "prestige", label: "Prestige" },
    { id: "social", label: "Social" },
    { id: "meta", label: "Meta" },
];

const RARITY_ORDER = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

export default function BadgeShowcaseModal({ isOpen, onClose, earnedBadges, userId }: BadgeShowcaseModalProps) {
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
    const [settingShowcase, setSettingShowcase] = useState(false);

    const earnedSet = useMemo(() => new Set(earnedBadges.map(b => b.badge_id)), [earnedBadges]);
    const earnedMap = useMemo(() => {
        const map = new Map<string, EarnedBadge>();
        earnedBadges.forEach(b => map.set(b.badge_id, b));
        return map;
    }, [earnedBadges]);

    // Merge catalog with earned status
    const allBadges = useMemo(() => {
        return ACHIEVEMENT_CATALOG
            .filter(a => {
                if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
                }
                return true;
            })
            .sort((a, b) => {
                // Earned first, then by rarity (highest first)
                const aEarned = earnedSet.has(a.id) ? 1 : 0;
                const bEarned = earnedSet.has(b.id) ? 1 : 0;
                if (aEarned !== bEarned) return bEarned - aEarned;
                return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
            });
    }, [categoryFilter, searchQuery, earnedSet]);

    const selected = selectedBadge
        ? ACHIEVEMENT_CATALOG.find(a => a.id === selectedBadge)
        : null;

    const handleSetShowcase = async (badgeId: string) => {
        setSettingShowcase(true);
        try {
            const res = await fetch("/api/user/showcase-badge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ badgeId }),
            });
            if (res.ok) {
                toast.success("Showcase badge updated!");
            }
        } catch {
            toast.error("Failed to set showcase badge");
        } finally {
            setSettingShowcase(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-3xl max-h-[85vh] bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Medal className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-1">
                            Badge Collection
                        </h2>
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            {earnedBadges.length} / {ACHIEVEMENT_CATALOG.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                    {/* Category pills */}
                    <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05] overflow-x-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={cn(
                                    "px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                                    categoryFilter === cat.id
                                        ? "bg-primary text-black shadow-sm"
                                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/[0.05]"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative group flex-1 min-w-0 w-full sm:w-auto">
                        <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <input
                            placeholder="Search badges..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8 w-full text-[11px] font-medium bg-white/[0.02] border border-white/[0.05] rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/20"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                        {allBadges.map((achievement) => {
                            const isEarned = earnedSet.has(achievement.id);
                            const isSelected = selectedBadge === achievement.id;
                            const rarityColor = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.COMMON;

                            return (
                                <motion.button
                                    key={achievement.id}
                                    onClick={() => setSelectedBadge(isSelected ? null : achievement.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                        isEarned
                                            ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                                            : "border-white/[0.02] bg-white/[0.01] opacity-40 hover:opacity-60",
                                        isSelected && "ring-1 ring-primary border-primary/30 bg-primary/5"
                                    )}
                                >
                                    {/* Badge SVG or locked silhouette */}
                                    {isEarned ? (
                                        <BadgeSVG dna={achievement.dna} size={40} />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-muted-foreground/30" />
                                        </div>
                                    )}

                                    {/* Name */}
                                    <span className="text-[8px] font-bold text-center leading-tight line-clamp-2">
                                        {achievement.name}
                                    </span>

                                    {/* Rarity dot */}
                                    <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: rarityColor }}
                                    />
                                </motion.button>
                            );
                        })}
                    </div>

                    {allBadges.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Medal className="w-8 h-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground/60">No badges match your filter.</p>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5 bg-white/[0.02] overflow-hidden flex-shrink-0"
                        >
                            <div className="p-5 flex items-center gap-5">
                                {earnedSet.has(selected.id) ? (
                                    <BadgeSVG dna={selected.dna} size={64} />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                                        <Lock className="w-6 h-6 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-black">{selected.name}</h4>
                                        <span
                                            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                                            style={{
                                                color: RARITY_COLORS[selected.rarity],
                                                borderColor: `${RARITY_COLORS[selected.rarity]}30`,
                                                backgroundColor: `${RARITY_COLORS[selected.rarity]}10`,
                                            }}
                                        >
                                            {selected.rarity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground/70">{selected.description}</p>
                                    {earnedSet.has(selected.id) && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[9px] text-muted-foreground/40 flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                                Earned {new Date(earnedMap.get(selected.id)!.awarded_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleSetShowcase(selected.id)}
                                                disabled={settingShowcase}
                                                className="text-[9px] font-bold uppercase tracking-widest text-amber-400/70 hover:text-amber-400 transition-colors"
                                            >
                                                Set as Showcase
                                            </button>
                                        </div>
                                    )}
                                    {!earnedSet.has(selected.id) && (
                                        <p className="text-[10px] text-muted-foreground/30 mt-2 italic">Locked — complete the required achievement to unlock.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
