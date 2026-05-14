"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Merge, Trash2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuplicateGroup } from "@/lib/dedup";

export type GroupAction = "merge" | "keep" | "remove_dupes";

interface DedupModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (actions: Record<string, GroupAction>) => void;
    groups: DuplicateGroup[];
    parsedData: Record<string, any>[];
    headers: string[];
}

export function DedupModal({ open, onClose, onConfirm, groups, parsedData, headers }: DedupModalProps) {
    const [actions, setActions] = useState<Record<string, GroupAction>>(() => {
        const initial: Record<string, GroupAction> = {};
        groups.forEach(g => { initial[g.id] = "merge"; });
        return initial;
    });
    const [expandedGroup, setExpandedGroup] = useState<string | null>(groups[0]?.id || null);

    const setGroupAction = (groupId: string, action: GroupAction) => {
        setActions(prev => ({ ...prev, [groupId]: action }));
    };

    const setAllActions = (action: GroupAction) => {
        const updated: Record<string, GroupAction> = {};
        groups.forEach(g => { updated[g.id] = action; });
        setActions(updated);
    };

    const totalDuplicateRows = useMemo(() => {
        return groups.reduce((sum, g) => sum + g.rowIndices.length, 0);
    }, [groups]);

    const mergeCount = Object.values(actions).filter(a => a === "merge").length;
    const keepCount = Object.values(actions).filter(a => a === "keep").length;
    const removeCount = Object.values(actions).filter(a => a === "remove_dupes").length;

    if (!open || groups.length === 0) return null;

    // Show max 4 columns for preview
    const previewHeaders = headers.slice(0, 4);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="w-[700px] max-h-[80vh] bg-[#111] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div>
                            <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                Resolve Duplicates Before Export
                            </h2>
                            <p className="text-xs text-white/40 mt-0.5">
                                {groups.length} duplicate group{groups.length !== 1 ? "s" : ""} found across {totalDuplicateRows} rows
                            </p>
                        </div>
                        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.06]">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider mr-2">Apply to all:</span>
                        {(["merge", "keep", "remove_dupes"] as GroupAction[]).map(action => (
                            <button
                                key={action}
                                onClick={() => setAllActions(action)}
                                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                                    Object.values(actions).every(a => a === action)
                                        ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                        : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                                }`}
                            >
                                {action === "merge" ? "Merge All" : action === "keep" ? "Keep All" : "Remove Dupes"}
                            </button>
                        ))}
                    </div>

                    {/* Group List */}
                    <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/[0.04]">
                        {groups.map((group) => {
                            const isExpanded = expandedGroup === group.id;
                            const action = actions[group.id] || "merge";
                            const rows = group.rowIndices.map(idx => parsedData[idx]).filter(Boolean);
                            const similarity = group.similarity ? Math.round(group.similarity * 100) : (group.rowIndices.length > 1 ? Math.round(0.85 * 100) : 100);

                            return (
                                <div key={group.id} className="px-5 py-3">
                                    {/* Group Header */}
                                    <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-sm ${
                                                similarity >= 100 
                                                    ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" 
                                                    : "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                                            }`} />
                                            <span className="text-xs font-medium text-white">
                                                Group {group.id.slice(-4).toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-white/30">
                                                {group.rowIndices.length} rows
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                similarity >= 100 
                                                    ? "bg-red-500/15 text-red-400" 
                                                    : "bg-orange-500/15 text-orange-400"
                                            }`}>
                                                {similarity >= 100 ? "Exact" : `${similarity}%`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Action Selector */}
                                            {(["merge", "keep", "remove_dupes"] as GroupAction[]).map(a => (
                                                <button
                                                    key={a}
                                                    onClick={e => { e.stopPropagation(); setGroupAction(group.id, a); }}
                                                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                                                        action === a
                                                            ? a === "merge" ? "bg-green-500/20 text-green-400 border border-green-500/40"
                                                            : a === "keep" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                                                            : "text-white/25 hover:text-white/50 border border-transparent"
                                                    }`}
                                                >
                                                    {a === "merge" ? "Merge" : a === "keep" ? "Keep" : "Remove"}
                                                </button>
                                            ))}
                                            {isExpanded ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
                                        </div>
                                    </div>

                                    {/* Expanded Row Preview */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-2 rounded-lg border border-white/[0.06] overflow-hidden">
                                                    <table className="w-full text-[10px] font-mono">
                                                        <thead>
                                                            <tr className="bg-white/[0.03]">
                                                                <th className="px-2 py-1.5 text-left text-white/30 font-medium w-8">#</th>
                                                                {previewHeaders.map(h => (
                                                                    <th key={h} className="px-2 py-1.5 text-left text-white/30 font-medium truncate max-w-[140px]">
                                                                        {h}
                                                                    </th>
                                                                ))}
                                                                {headers.length > 4 && (
                                                                    <th className="px-2 py-1.5 text-white/20 font-medium">+{headers.length - 4}</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.rowIndices.map((rowIdx, i) => {
                                                                const row = parsedData[rowIdx];
                                                                if (!row) return null;
                                                                return (
                                                                    <tr key={rowIdx} className={`border-t border-white/[0.04] ${i === 0 ? "bg-orange-500/[0.04]" : ""}`}>
                                                                        <td className="px-2 py-1 text-white/20">{rowIdx + 1}</td>
                                                                        {previewHeaders.map(h => (
                                                                            <td key={h} className="px-2 py-1 text-white/60 truncate max-w-[140px]">
                                                                                {row[h] || ""}
                                                                            </td>
                                                                        ))}
                                                                        {headers.length > 4 && <td className="px-2 py-1 text-white/10">...</td>}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center gap-3 text-[10px] text-white/30">
                            {mergeCount > 0 && <span className="text-green-400">{mergeCount} merge</span>}
                            {keepCount > 0 && <span className="text-blue-400">{keepCount} keep</span>}
                            {removeCount > 0 && <span className="text-red-400">{removeCount} remove</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-xs text-white/40 hover:text-white/60 h-7"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onConfirm(actions)}
                                size="sm"
                                className="h-7 bg-white text-black hover:bg-white/90 text-xs font-medium px-4"
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Apply & Export
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
