"use client";

import React, { useState } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Folder, CalendarIcon, ArrowRight, Plus, Rocket, Zap } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NewProjectDialog from "@/app/(routes)/projects/dialogs/NewProject";

interface ProjectMemberWithBoard {
    id: string;
    project: string;
    assignedAt: Date;
    progression?: number;
    taskCount?: number;
    board: {
        id: string;
        title: string;
        description: string;
        status: string;
    };
}

interface ProjectsWidgetProps {
    projects: ProjectMemberWithBoard[];
}

const PulseIndicator = ({ value, status }: { value: number; status: any }) => {
    const size = 32;
    const radius = size * 0.4;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <div className={`absolute inset-1 rounded-full ${status.bg} blur-[2px] animate-pulse`} />
            <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
                <circle
                    className="text-white/5"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className={`${status.color} transition-colors duration-1000`}
                    strokeWidth="2.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                    style={{ filter: `drop-shadow(0 0 2px currentColor)` }}
                />
            </svg>
            <div className={`absolute w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')} ${status.glow} z-20`} />
        </div>
    );
};

export const ProjectsWidget = ({ projects: initialProjects }: ProjectsWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProjects = initialProjects.filter(p => {
        return p.board.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getPulseStatus = (progression: number, taskCount: number, assignedAt: Date) => {
        const daysSinceAssigned = (new Date().getTime() - new Date(assignedAt).getTime()) / (1000 * 3600 * 24);

        if (progression > 60) return { label: "Winning", color: "text-emerald-400", bg: "bg-emerald-500/20", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", icon: Rocket };
        if (daysSinceAssigned > 5 && progression < 10) return { label: "Stale", color: "text-rose-400", bg: "bg-rose-500/20", glow: "shadow-[0_0_8px_rgba(244,63,94,0.5)]", icon: CalendarIcon };
        if (progression > 0) return { label: "Trending", color: "text-indigo-400", bg: "bg-indigo-500/20", glow: "shadow-[0_0_8px_rgba(129,140,248,0.5)]", icon: Zap };
        return { label: "Stable", color: "text-amber-400", bg: "bg-amber-500/20", glow: "", icon: Folder };
    };

    const rightAction = (
        <NewProjectDialog
            entityName="Campaign"
            customTrigger={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10 text-primary"
                >
                    <Plus size={12} className="mr-1" />
                    PULSE
                </Button>
            }
        />
    );

    return (
        <WidgetWrapper
            title="Campaign Pulse"
            icon={Rocket}
            iconColor="text-indigo-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/campaigns"
            footerLabel="View All Performance"
            count={initialProjects.length}
            rightAction={rightAction}
        >
            <div className="space-y-1.5 pb-4 mt-3">
                {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <Rocket className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No active pulses</p>
                    </div>
                ) : (
                    filteredProjects.map((item) => {
                        const status = getPulseStatus(item.progression || 0, item.taskCount || 0, item.assignedAt);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={item.id}
                                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.04] transition-colors duration-300 relative overflow-hidden"
                            >
                                <div className="shrink-0 relative z-10">
                                    <PulseIndicator value={item.progression || 0} status={status} />
                                </div>

                                <div className="space-y-1 overflow-hidden flex-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white/90 truncate group-hover:text-primary transition-colors">
                                            {item.board.title}
                                        </span>
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${status.bg} border border-current opacity-70`}>
                                            <StatusIcon size={8} className={status.color} />
                                            <span className={`text-[8px] font-black uppercase tracking-tighter ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[10px] text-muted-foreground font-medium truncate opacity-60">
                                            {status.label === "Stale"
                                                ? `No activity for ${Math.floor((new Date().getTime() - new Date(item.assignedAt).getTime()) / (1000 * 3600 * 24))} days`
                                                : status.label === "Winning"
                                                    ? "Exceeding engagement targets"
                                                    : `${item.taskCount} tasks in pipeline • ${item.progression}% complete`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 relative z-10">
                                    <Link href={`/projects/boards/${item.board.id}`}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={`h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 ${status.bg} ${status.color} hover:bg-white/10 transition-[color,background-color,border-color,opacity] duration-300`}
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </WidgetWrapper>
    );
};
