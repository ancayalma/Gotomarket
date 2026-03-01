"use client";

import { useState, useEffect } from "react";
import {
    Phone,
    StickyNote,
    CheckSquare,
    Users,
    ChevronUp,
    ChevronDown,
    X,
    Maximize2,
    Minimize2,
    ChevronRight,
    Calendar,
    GraduationCap,
    Sparkles,
    Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLearn } from "@/components/providers/learn-provider";
import { TAB_LABELS, TAB_COLORS } from "@/components/ui/LearnLink";
import { getTeamCreditsInfo } from "@/actions/crm/credits";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import DialerPanel from "@/app/(routes)/crm/dialer/DialerPanel";

export default function UtilityBar() {
    const [isMinimized, setIsMinimized] = useState(false);
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState<{ id: string, text: string, completed: boolean, priority: 'low' | 'normal' | 'medium' | 'high' | 'critical' }[]>([]);
    const [isDialerOpen, setIsDialerOpen] = useState(false);
    const [creditsInfo, setCreditsInfo] = useState<{
        teamSlug?: string;
        used: number;
        remaining: number;
        monthlyLimit: number;
        isUnlimited: boolean;
        displayString: string;
    } | null>(null);
    const { activeTab, tooltipLabel, overviewTitle, overviewWhat, overviewWhy, overviewHow, dismissKey } = useLearn();
    const router = useRouter();
    const [isLearnOpen, setIsLearnOpen] = useState(false);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const info = await getTeamCreditsInfo();
                setCreditsInfo({
                    teamSlug: (info as any).teamSlug,
                    used: (info as any).used || 0,
                    remaining: (info as any).remaining || 0,
                    monthlyLimit: info.monthlyLimit || 0,
                    isUnlimited: info.isUnlimited || false,
                    displayString: (info as any).displayString || "???",
                });
            } catch (err) {
                setCreditsInfo(null);
            }
        };
        fetchCredits();

        const savedNotes = localStorage.getItem("crm-utility-notes");
        if (savedNotes) setNotes(savedNotes);

        const savedTasks = localStorage.getItem("crm-utility-tasks");
        if (savedTasks) setTasks(JSON.parse(savedTasks));
    }, []);

    const saveNotes = (val: string) => {
        setNotes(val);
        localStorage.setItem("crm-utility-notes", val);
    };

    const addTask = () => {
        const newTasks: any[] = [...tasks, { id: Math.random().toString(), text: "", completed: false, priority: 'low' }];
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const updateTask = (id: string, text: string) => {
        const newTasks = tasks.map(t => t.id === id ? { ...t, text } : t);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const toggleTask = (id: string) => {
        const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const removeTask = (id: string) => {
        const newTasks = tasks.filter(t => t.id !== id);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    return (
        <div className="relative shrink-0">
            {/* The Main Utility Bar */}
            <div className={cn(
                "w-full bg-background/80 backdrop-blur-md border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.1)] transition-colors duration-300 ease-in-out",
                isMinimized ? "h-0 -translate-y-[-100%] opacity-0 overflow-hidden" : "h-12 translate-y-0 opacity-100"
            )}>
                <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(true)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title="Minimize Utility Bar"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">
                            Utility Bar
                        </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        {/* LeadGen Credits Widget */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 cursor-pointer hover:bg-muted/80 transition-colors group" title="LeadGen Credits">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground whitespace-nowrap leading-none">
                                            L-GEN: <span className="text-foreground">{creditsInfo ? creditsInfo.displayString : "Loading..."}</span>
                                        </span>
                                        {creditsInfo && !creditsInfo.isUnlimited && creditsInfo.monthlyLimit > 0 && (
                                            <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden min-w-[60px]">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-colors duration-700 ease-out",
                                                        creditsInfo.remaining / creditsInfo.monthlyLimit > 0.5
                                                            ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                                                            : creditsInfo.remaining / creditsInfo.monthlyLimit > 0.2
                                                                ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                                                : "bg-gradient-to-r from-red-500 to-pink-500"
                                                    )}
                                                    style={{ width: `${Math.max(2, (creditsInfo.remaining / creditsInfo.monthlyLimit) * 100)}%` }}
                                                />
                                            </div>
                                        )}
                                        {creditsInfo?.isUnlimited && (
                                            <div className="w-full h-[3px] rounded-full overflow-hidden min-w-[60px] bg-gradient-to-r from-cyan-500/40 via-violet-500/40 to-cyan-500/40 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl" side="top" align="center" sideOffset={12}>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">LeadGen Credits</p>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                                    {creditsInfo?.isUnlimited ? "Unlimited Plan" : "Monthly Allocation"}
                                                </p>
                                            </div>
                                        </div>
                                        {creditsInfo?.isUnlimited && (
                                            <span className="text-[9px] font-bold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                                ∞ UNLIMITED
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    {creditsInfo && !creditsInfo.isUnlimited && creditsInfo.monthlyLimit > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-colors duration-700 ease-out",
                                                        creditsInfo.remaining / creditsInfo.monthlyLimit > 0.5
                                                            ? "bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                                            : creditsInfo.remaining / creditsInfo.monthlyLimit > 0.2
                                                                ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                                                                : "bg-gradient-to-r from-red-500 to-pink-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                                    )}
                                                    style={{ width: `${Math.max(2, (creditsInfo.remaining / creditsInfo.monthlyLimit) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground">{creditsInfo.used} used</span>
                                                <span className="font-bold text-foreground">{creditsInfo.remaining} remaining</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Unlimited tracking */}
                                    {creditsInfo?.isUnlimited && (
                                        <div className="space-y-1.5">
                                            <div className="w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20">
                                                <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 animate-pulse" style={{ width: '100%' }} />
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-muted-foreground">{creditsInfo.used} used this period</span>
                                                <span className="font-bold text-cyan-400">Unlimited</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stat Grid */}
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                        <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="text-sm font-mono font-bold text-foreground">{creditsInfo?.used ?? 0}</div>
                                            <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-semibold">Used</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="text-sm font-mono font-bold text-foreground">
                                                {creditsInfo?.isUnlimited ? "∞" : creditsInfo?.remaining ?? 0}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-semibold">Left</div>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="text-sm font-mono font-bold text-foreground">
                                                {creditsInfo?.isUnlimited ? "∞" : creditsInfo?.monthlyLimit ?? 0}
                                            </div>
                                            <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-semibold">Limit</div>
                                        </div>
                                    </div>

                                    <p className="text-[9px] text-muted-foreground text-center pt-1 border-t border-white/5">
                                        Credits reset monthly • Use-it-or-lose-it
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                        {/* Calendar */}
                        <Link href="/crm/calendar">
                            <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-blue-500/10 hover:text-blue-500 transition-colors px-2 sm:px-3">
                                <Calendar className="h-4 w-4" />
                                <span className="hidden lg:inline">Calendar</span>
                            </Button>
                        </Link>

                        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                        {/* Notes Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-amber-500/10 hover:text-amber-500 transition-colors px-2 sm:px-3">
                                    <div className="relative">
                                        <StickyNote className="h-4 w-4" />
                                        {notes.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                    <span className="hidden lg:inline">Quick Notes</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden" side="top" align="center" sideOffset={12}>
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-amber-500/10">
                                            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs uppercase tracking-tight">Scratchpad</h4>
                                            <p className="text-[10px] text-muted-foreground">Session workspace</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-white/5 text-muted-foreground"
                                            onClick={() => {
                                                navigator.clipboard.writeText(notes);
                                                // Could add a temporary toast here but UtilityBar doesn't have access to global toast easily without hooks
                                            }}
                                            title="Copy to Clipboard"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-red-500/10 hover:text-red-500"
                                            onClick={() => saveNotes("")}
                                            title="Clear Notes"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="relative group">
                                        <textarea
                                            id="utility-notes"
                                            name="utility-notes"
                                            className="w-full h-48 bg-muted/20 rounded-lg p-3 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30 border border-white/5 placeholder:text-muted-foreground/30 font-medium leading-relaxed"
                                            placeholder="Jot down quick thoughts, links, or snippets..."
                                            value={notes}
                                            onChange={(e) => saveNotes(e.target.value)}
                                            spellCheck={false}
                                        />
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-mono text-muted-foreground/40 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                {notes.length} chars
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span>Local Sync Active</span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/40 italic">
                                            Auto-saves instantly
                                        </span>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                        {/* Tasks Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors px-2 sm:px-3">
                                    <div className="relative">
                                        <CheckSquare className="h-4 w-4" />
                                        {tasks.filter(t => !t.completed).length > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden lg:inline">Checklist</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden" side="top" align="center" sideOffset={12}>
                                {/* Progress Header */}
                                <div className="p-4 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-emerald-500/10">
                                                <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs uppercase tracking-tight">Quick Checklist</h4>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {tasks.length > 0
                                                        ? `${tasks.filter(t => t.completed).length} of ${tasks.length} completed`
                                                        : "No active tasks"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-full"
                                            onClick={addTask}
                                        >
                                            <span className="text-sm font-bold">+</span>
                                        </Button>
                                    </div>

                                    {/* Progress Bar */}
                                    {tasks.length > 0 && (
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="max-h-72 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {tasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                            <CheckSquare className="h-8 w-8 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-center">Empty List</p>
                                            <p className="text-[9px] mt-1 italic">Click + to start tracking</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-2 rounded-lg transition-all group border border-transparent",
                                                    task.completed ? "opacity-50" : "hover:bg-white/[0.03] hover:border-white/5"
                                                )}
                                            >
                                                <div className="pt-0.5">
                                                    <input
                                                        id={`task-check-${task.id}`}
                                                        name={`task-check-${task.id}`}
                                                        type="checkbox"
                                                        checked={task.completed}
                                                        onChange={() => toggleTask(task.id)}
                                                        className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        id={`task-input-${task.id}`}
                                                        name={`task-input-${task.id}`}
                                                        type="text"
                                                        value={task.text}
                                                        onChange={(e) => updateTask(task.id, e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                                        className={cn(
                                                            "w-full bg-transparent border-none p-0 text-xs focus:ring-0 placeholder:text-muted-foreground/20 font-medium",
                                                            task.completed && "line-through text-muted-foreground decoration-emerald-500/50"
                                                        )}
                                                        placeholder="Task details..."
                                                    />
                                                    <div className="flex items-center gap-1 mt-2 p-1 bg-white/5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                        {[
                                                            { val: 'low', color: 'text-emerald-500', label: 'L' },
                                                            { val: 'normal', color: 'text-sky-500', label: 'N' },
                                                            { val: 'medium', color: 'text-amber-500', label: 'M' },
                                                            { val: 'high', color: 'text-purple-500', label: 'H' },
                                                            { val: 'critical', color: 'text-red-500', label: 'C' }
                                                        ].map((p) => (
                                                            <button
                                                                key={p.val}
                                                                className={cn(
                                                                    "h-5 flex-1 rounded-md text-[8px] font-black uppercase transition-all flex items-center justify-center border border-transparent",
                                                                    task.priority === p.val
                                                                        ? `${p.color.replace("text-", "bg-").replace("-500", "-500/20")} ${p.color} border-${p.color.replace("text-", "")}/20 shadow-sm`
                                                                        : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5"
                                                                )}
                                                                onClick={() => {
                                                                    const newTasks = tasks.map(t => t.id === task.id ? { ...t, priority: p.val as any } : t);
                                                                    setTasks(newTasks);
                                                                    localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
                                                                }}
                                                            >
                                                                {p.label}
                                                            </button>
                                                        ))}
                                                        <div className="w-px h-3 bg-white/10 mx-1" />
                                                        <button
                                                            className="h-5 px-2 text-[8px] font-black uppercase text-rose-500/60 hover:bg-rose-500/10 rounded-md transition-colors"
                                                            onClick={() => removeTask(task.id)}
                                                        >
                                                            DEL
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {tasks.length > 0 && (
                                    <div className="p-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
                                        <p className="text-[9px] text-muted-foreground/40 italic">
                                            Ephemeral Session Tracking
                                        </p>
                                        <button
                                            className="text-[9px] font-bold text-emerald-500/60 hover:text-emerald-500 transition-colors uppercase"
                                            onClick={() => {
                                                const newTasks = tasks.filter(t => !t.completed);
                                                setTasks(newTasks);
                                                localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
                                            }}
                                        >
                                            Clear Completed
                                        </button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Learn About This Page - Integrated into UtilityBar */}
                        {activeTab && (
                            <Popover open={isLearnOpen} onOpenChange={setIsLearnOpen}>
                                <PopoverTrigger asChild>
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer group relative",
                                        "bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:text-blue-400 border border-blue-500/20 hover:border-blue-500/50",
                                        "sm:px-4"
                                    )}>
                                        <div className="relative">
                                            <GraduationCap className="h-3.5 w-3.5 relative z-10" />
                                            <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse z-0" />
                                        </div>
                                        <span className="text-xs font-semibold hidden sm:inline whitespace-nowrap">Learn about this page</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 max-w-lg p-4 border-white/10 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden shadow-blue-500/10" side="top" align="center" sideOffset={12}>
                                    {/* Top gradient line */}
                                    <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${TAB_COLORS[activeTab]}`} />

                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TAB_COLORS[activeTab]} flex items-center justify-center flex-shrink-0`}>
                                                <GraduationCap className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/90">
                                                    {overviewTitle || TAB_LABELS[activeTab]}
                                                </p>
                                                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                                                    CRM Overview
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsLearnOpen(false)}
                                            className="text-white/25 hover:text-white/60 transition-colors p-0.5"
                                            title="Close"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {(overviewWhat || overviewWhy || overviewHow) ? (
                                        <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-1">
                                            {overviewWhat && (
                                                <div className="space-y-1">
                                                    <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-wider">What is this?</h4>
                                                    <p className="text-[11px] text-white/60 leading-relaxed">{overviewWhat}</p>
                                                </div>
                                            )}
                                            {overviewWhy && (
                                                <div className="space-y-1">
                                                    <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Why use it?</h4>
                                                    <p className="text-[11px] text-white/60 leading-relaxed">{overviewWhy}</p>
                                                </div>
                                            )}
                                            {overviewHow && (
                                                <div className="space-y-1">
                                                    <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-wider">How to use it</h4>
                                                    <p className="text-[11px] text-white/60 leading-relaxed">{overviewHow}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                                            {tooltipLabel ?? `Learn how ${TAB_LABELS[activeTab]} works in the CRM ecosystem.`}
                                        </p>
                                    )}

                                    {/* Link to University if it exists, otherwise just a dismiss button */}
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            // Only redirect if it's one of the actual university tabs, else just close
                                            const isUniversityTab = ["getting-started", "project-workflow", "flow", "compliance", "data-health", "certification", "prompt-lab", "roi-modeler", "architecture", "reference"].includes(activeTab as string);
                                            if (isUniversityTab) {
                                                router.push(`/crm/university?tab=${activeTab}`);
                                            } else {
                                                // Just dismiss for now since there's no specific university page
                                                setIsLearnOpen(false);
                                            }
                                        }}
                                        className={`w-full h-8 text-xs font-bold text-white bg-gradient-to-r ${TAB_COLORS[activeTab]} hover:opacity-90 transition-opacity border-none`}
                                    >
                                        {(["getting-started", "project-workflow", "flow", "compliance", "data-health", "certification", "prompt-lab", "roi-modeler", "architecture", "reference"].includes(activeTab as string))
                                            ? "Open University →"
                                            : "Got it!"}
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        )}

                        <div className="h-4 w-px bg-border mx-1 hidden lg:block" />

                        <Popover open={isDialerOpen} onOpenChange={setIsDialerOpen}>
                            <PopoverTrigger asChild>
                                <div className={cn(
                                    "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer group",
                                    isDialerOpen
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50"
                                )}>
                                    <Phone className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">Numpad</span>
                                    <div className={cn("h-3 w-px mx-1", isDialerOpen ? "bg-white/20" : "bg-emerald-500/20")} />
                                    {isDialerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0 border-white/10 bg-background/95 backdrop-blur-xl text-foreground shadow-2xl overflow-hidden shadow-emerald-500/20" side="top" align="end" sideOffset={12}>
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <span className="text-amber-500">:::</span>
                                        <span className="tracking-widest uppercase text-[9px]">Comm Terminal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tight">Active</span>
                                    </div>
                                </div>
                                <div className="bg-black/20">
                                    <DialerPanel isCompact={true} />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Floating Expand Button (Circle) */}
            <div className={cn(
                "absolute bottom-4 left-4 transition-colors duration-500 z-[60]",
                isMinimized ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-50 pointer-events-none"
            )}>
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group border-2 border-background"
                    title="Expand Utility Bar"
                >
                    <ChevronUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
}
