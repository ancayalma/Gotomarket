"use client";

import React, { useState } from "react";
import { useSalesCommand } from "./SalesCommandProvider";
import { UnifiedMetricCard } from "./UnifiedMetricCard";
import { UnifiedStageBar } from "./UnifiedStageBar";
import { motion } from "framer-motion";
import NewTaskDialog from "./NewTaskDialog";
import { format } from "date-fns";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, Circle, Plus, ArrowUpRight } from "lucide-react";

const priorityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusIcons: Record<string, React.ReactNode> = {
    DONE: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    BACKLOG: <Circle className="h-4 w-4 text-white/20" />,
    TODO: <Clock className="h-4 w-4 text-cyan-400" />,
    "IN PROGRESS": <AlertCircle className="h-4 w-4 text-amber-400" />,
};

export default function MyCommandView() {
    const { data, selectedUserData, crmData, boards, tasks } = useSalesCommand();
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    const activeData = selectedUserData ? {
        myPipeline: selectedUserData.pipeline,
        myScore: selectedUserData.score,
        myRank: selectedUserData.rank,
        name: selectedUserData.meta.userName
    } : {
        ...data.userData,
        name: "My"
    };

    const activeTasks = tasks
        .filter((task: any) => task.taskStatus !== "DONE")
        .slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* ═══ LEFT: Pipeline Health ═══ */}
            <div className="lg:col-span-4 space-y-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl p-6 shadow-2xl h-full"
                >
                    {/* Accent glow */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    <div className="mb-6">
                        <h2 className="text-lg font-black tracking-tight text-white/90">
                            {activeData.name === "My" ? "My Pipeline" : `${activeData.name}'s Pipeline`}
                        </h2>
                        <p className="text-xs text-white/25 font-medium mt-0.5">Real-time lead stage distribution</p>
                    </div>
                    <UnifiedStageBar
                        stages={activeData.myPipeline.counts as any}
                        total={activeData.myPipeline.total}
                        orientation="vertical"
                        height={500}
                        className="w-full"
                    />
                </motion.div>
            </div>

            {/* ═══ MIDDLE: Priority Actions ═══ */}
            <div className="lg:col-span-5 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl p-6 shadow-2xl min-h-[400px]"
                >
                    {/* Accent glow */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white/90">Priority Actions</h2>
                            <p className="text-xs text-white/25 font-medium mt-0.5">Focus on these tasks today</p>
                        </div>
                        <button
                            onClick={() => setIsTaskDialogOpen(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-all duration-200"
                        >
                            <Plus className="h-3 w-3" />
                            New Task
                        </button>
                    </div>

                    {activeTasks.length > 0 ? (
                        <div className="space-y-2">
                            {activeTasks.map((task: any, idx: number) => (
                                <Link
                                    key={task.id}
                                    href={`/projects/tasks/viewtask/${task.id}`}
                                    className="block group/task"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {statusIcons[task.taskStatus] || <Circle className="h-4 w-4 text-white/15" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm text-white/80 truncate group-hover/task:text-white/95 transition-colors">{task.title}</span>
                                                    {task.priority && (
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${priorityColors[task.priority] || priorityColors.low}`}>
                                                            {task.priority}
                                                        </span>
                                                    )}
                                                    <ArrowUpRight className="h-3 w-3 text-white/10 opacity-0 group-hover/task:opacity-100 transition-opacity ml-auto shrink-0" />
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-white/25">
                                                    {task.dueDateAt && (
                                                        <span>Due {format(new Date(task.dueDateAt), "MMM d")}</span>
                                                    )}
                                                    {task.assigned_user?.name && (
                                                        <span>• {task.assigned_user.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                            {tasks.length > 5 && (
                                <Link href="/projects/tasks" className="block text-center text-xs text-primary hover:text-primary/80 py-3 font-bold transition-colors">
                                    View all {tasks.length} tasks →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                            <div className="text-white/25 text-sm font-medium">No urgent tasks pending</div>
                            <div className="text-white/15 text-xs mt-1">Great job clearing your queue!</div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ RIGHT: Performance & Rank ═══ */}
            <div className="lg:col-span-3 space-y-4">
                <UnifiedMetricCard
                    title="Revenue Score"
                    value={activeData.myScore * 100}
                    subtitle="Estimated value closed"
                    iconName="DollarSign"
                    accentColor="emerald"
                    delay={0.2}
                />
                <UnifiedMetricCard
                    title="Team Rank"
                    value={`#${activeData.myRank ?? "-"}`}
                    subtitle={`Top ${activeData.myRank && activeData.myRank <= 3 ? "Performer" : "Contender"}`}
                    iconName="TrendingUp"
                    accentColor="violet"
                    delay={0.3}
                />
                <UnifiedMetricCard
                    title="Pipeline Value"
                    value={activeData.myPipeline.total}
                    subtitle="Active Deals"
                    iconName="Target"
                    accentColor="cyan"
                    delay={0.4}
                />
            </div>

            <NewTaskDialog
                users={crmData?.users || []}
                boards={boards || []}
                open={isTaskDialogOpen}
                setOpen={setIsTaskDialogOpen}
            />
        </div>
    );
}
