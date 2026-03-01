"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import fetcher from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Circle,
    Plus,
    Calendar as CalendarIcon,
    List,
    LayoutGrid,
    Clock,
    CheckCircle2,
    ArrowRight,
    History,
    LayoutDashboard,
    Users,
    Zap,
    Target,
    Search,
    X
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    getDay,
} from "date-fns";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { priorities, statuses } from "../../tasks/data/data";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

type Props = { userId: string };

type CalendarView = "month" | "week" | "agenda";

interface TaskEvent {
    id: string;
    title: string;
    dueDateAt: Date;
    priority?: string;
    projectTitle?: string;
    projectId?: string;
    taskStatus?: string;
    assignedUserId?: string;
    createdBy?: string;
}

export default function ProjectCalendarView({ userId }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [view, setView] = useState<CalendarView>("month");
    const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [dayDetailOpen, setDayDetailOpen] = useState(false);
    const [dayDetailTab, setDayDetailTab] = useState<"view" | "add">("view");
    const [fullDialogOpen, setFullDialogOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("normal");
    const [newTaskStatus, setNewTaskStatus] = useState("ACTIVE");
    const [todayTasksOpen, setTodayTasksOpen] = useState(false);
    const [newTaskProjectId, setNewTaskProjectId] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [linkedRecordId, setLinkedRecordId] = useState("");
    const [linkedRecordType, setLinkedRecordType] = useState(""); // 'account' | 'opportunity' | 'contact' etc
    const [linkedRecordName, setLinkedRecordName] = useState("");

    // Search State
    const [projectSearchOpen, setProjectSearchOpen] = useState(false);
    const [linkSearchOpen, setLinkSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebounce(searchValue, 300);
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);
    const [briefingData, setBriefingData] = useState<{ summary: string, highValueAlerts: string[] } | null>(null);
    const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

    // Global Search API logic
    useEffect(() => {
        const fetchGlobalResults = async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                setSearchResults(null);
                return;
            }
            if (!projectSearchOpen && !linkSearchOpen) return;

            setIsSearching(true);
            try {
                const response = await axios.post("/api/fulltext-search", { data: debouncedSearch });
                setSearchResults(response.data.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        fetchGlobalResults();
    }, [debouncedSearch, projectSearchOpen, linkSearchOpen]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all tasks
    const { data: tasksData, isLoading } = useSWR<{ tasks?: any[] }>(
        `/api/projects/tasks`,
        fetcher,
        { refreshInterval: 60000 }
    );

    // Fetch users and boards for full dialog
    const { data: userResponse } = useSWR("/api/team/members", fetcher);
    const { data: boardsData } = useSWR("/api/projects", fetcher);

    const users = userResponse?.members || [];
    const boards = boardsData?.data || [];

    // Transform tasks into events
    const events = useMemo(() => {
        const tasks = tasksData?.tasks || [];
        return tasks
            .filter((t: any) => t.dueDateAt && t.taskStatus?.toUpperCase() !== "COMPLETE")
            .map((t: any) => ({
                id: t.id,
                title: t.title || "Untitled",
                dueDateAt: new Date(t.dueDateAt),
                priority: t.priority?.toLowerCase() || "normal",
                projectTitle: t.board?.title,
                projectId: t.board?.id,
                taskStatus: t.taskStatus,
                assignedUserId: t.assigned_user?.id || t.user,
                createdBy: t.createdBy,
            }));
    }, [tasksData]);

    const todayTasks = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");

        return events.filter(e => {
            const taskDateStr = format(e.dueDateAt, "yyyy-MM-dd");
            const isTodayMatch = taskDateStr === todayStr;
            if (!isTodayMatch) return false;

            const isAssigned = e.assignedUserId?.toString() === userId?.toString();
            const isCreator = e.createdBy?.toString() === userId?.toString();

            return isAssigned || isCreator;
        });
    }, [events, userId]);

    // Get days based on view
    const viewDays = useMemo(() => {
        if (view === "week") {
            const start = startOfWeek(currentMonth, { weekStartsOn: 0 });
            const end = endOfWeek(currentMonth, { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        }
        // Month view
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const startDayOfWeek = getDay(start);
        const paddedDays = [];
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            paddedDays.push(new Date(start.getTime() - (i + 1) * 86400000));
        }
        return [...paddedDays, ...days];
    }, [currentMonth, view]);

    // Get events for a specific day
    const getEventsForDay = (day: Date) => {
        return events.filter((e) => isSameDay(e.dueDateAt, day));
    };

    // Agenda events (for the entire selected month)
    const agendaEvents = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return events
            .filter((e) => e.dueDateAt >= start && e.dueDateAt <= end)
            .sort((a, b) => a.dueDateAt.getTime() - b.dueDateAt.getTime());
    }, [events, currentMonth]);

    const groupedAgendaEvents = useMemo(() => {
        const groups: Record<string, { date: Date, tasks: TaskEvent[] }> = {};
        agendaEvents.forEach(event => {
            const dateStr = format(event.dueDateAt, 'yyyy-MM-dd');
            if (!groups[dateStr]) {
                groups[dateStr] = {
                    date: event.dueDateAt,
                    tasks: []
                };
            }
            groups[dateStr].tasks.push(event);
        });
        return Object.values(groups);
    }, [agendaEvents]);

    const priorityColors = useMemo(() => {
        const colors: Record<string, string> = {};
        priorities.forEach(p => {
            colors[p.value] = p.dotColor || "bg-muted-foreground";
        });
        return colors;
    }, []);

    const priorityLabels = useMemo(() => {
        const labels: Record<string, string> = {};
        priorities.forEach(p => {
            labels[p.value] = p.label;
        });
        return labels;
    }, []);

    const getPriorityBadgeVariant = (priority: string) => {
        const p = priority?.toLowerCase();
        if (p === "high" || p === "critical") return "destructive";
        if (p === "low") return "secondary";
        return "default";
    };

    const StatusDot = ({ priority, size = "md" }: { priority?: string, size?: "sm" | "md" | "lg" }) => {
        const colorClass = priorityColors[priority?.toLowerCase() || "normal"] || "bg-muted-foreground";
        const sizeClasses = {
            sm: "h-2 w-2",
            md: "h-2.5 w-2.5",
            lg: "h-3 w-3"
        };
        return <div className={`${sizeClasses[size]} rounded-full shrink-0 ${colorClass}`} />;
    };

    const handleDayClick = (day: Date) => {
        const dayEvents = getEventsForDay(day);
        setQuickAddDate(day);
        setSearchValue("");
        setNewTaskProjectId("");

        if (dayEvents.length > 0) {
            setDayDetailTab("view");
        } else {
            setDayDetailTab("add");
        }

        setDayDetailOpen(true);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("normal");
        setNewTaskStatus("ACTIVE");
    };

    const handleQuickAdd = async () => {
        if (!newTaskTitle.trim() || !quickAddDate) return;
        setIsSubmitting(true);
        try {
            await axios.post("/api/projects/tasks/create-task", {
                title: newTaskTitle,
                priority: newTaskPriority,
                taskStatus: newTaskStatus,
                dueDateAt: quickAddDate,
                content: newTaskDescription,
                user: userId,
                board: newTaskProjectId,
                accountId: linkedRecordType === 'account' ? linkedRecordId : undefined,
                opportunityId: linkedRecordType === 'opportunity' ? linkedRecordId : undefined,
                contactId: linkedRecordType === 'contact' ? linkedRecordId : undefined,
                leadId: linkedRecordType === 'lead' ? linkedRecordId : undefined,
            });
            toast.success("Task created!");
            mutate("/api/projects/tasks");
            setQuickAddOpen(false);
            setNewTaskTitle("");
            setLinkedRecordId("");
            setLinkedRecordType("");
            setLinkedRecordName("");
            setNewTaskStatus("ACTIVE");
            setNewTaskPriority("normal");
            setNewTaskDescription("");
        } catch (error: any) {
            toast.error(error?.response?.data || "Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStatusUpdate = async (taskId: string, newStatus: string) => {
        try {
            const task = events.find(e => e.id === taskId);
            if (!task) return;

            await axios.put(`/api/projects/tasks/update-task/${taskId}`, {
                title: task.title,
                taskStatus: newStatus,
                user: userId,
                priority: task.priority
            });
            toast.success(`Task status updated to ${newStatus}`);
            mutate("/api/projects/tasks");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleGenerateBriefing = async () => {
        setIsGeneratingBriefing(true);
        setIsBriefingOpen(true);
        try {
            const response = await axios.get("/api/calendar/briefing");
            setBriefingData(response.data);
        } catch (err) {
            console.error("Failed to generate briefing", err);
            toast.error("AI Briefing failed. Check your connection.");
        } finally {
            setIsGeneratingBriefing(false);
        }
    };

    const navigatePrev = () => {
        if (view === "week") {
            setCurrentMonth(subWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(subMonths(currentMonth, 1));
        }
    };

    const navigateNext = () => {
        if (view === "week") {
            setCurrentMonth(addWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(addMonths(currentMonth, 1));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                Loading calendar...
            </div>
        );
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={navigatePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold min-w-[200px] text-center">
                        {view === "week"
                            ? `Week of ${format(startOfWeek(currentMonth, { weekStartsOn: 0 }), "MMM d, yyyy")}`
                            : format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="icon" onClick={navigateNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted/50 border border-border/50 rounded-md p-1 gap-0.5">
                        <button
                            type="button"
                            onClick={() => setView("month")}
                            className={`p-1.5 rounded transition-colors ${view === "month"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Month View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("week")}
                            className={`p-1.5 rounded transition-colors ${view === "week"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Week View"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("agenda")}
                            className={`p-1.5 rounded transition-colors ${view === "agenda"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Agenda View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/5 text-primary"
                        onClick={handleGenerateBriefing}
                    >
                        <Zap className="h-4 w-4 mr-1 text-amber-500 fill-amber-500/20" />
                        AI Briefing
                    </Button>

                    <Button onClick={() => {
                        setQuickAddDate(new Date());
                        setQuickAddOpen(true);
                        setNewTaskTitle("");
                        setNewTaskDescription("");
                        setNewTaskPriority("normal");
                        setNewTaskStatus("ACTIVE");
                        setNewTaskProjectId(""); // Clean slate for private reminders
                        setDayDetailTab("add");
                        setDayDetailOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                    </Button>
                </div>
            </div>

            {/* Day Detail Unified Dialog */}
            <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
                <DialogContent className="sm:max-w-[550px] border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
                    <div className="flex flex-col max-h-[85vh]">
                        {/* Custom Header with Toggle */}
                        <div className="p-6 pb-2 border-b border-border/10 bg-muted/10">
                            <div className="flex items-center justify-between mb-4">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black italic tracking-tighter uppercase text-primary/80 leading-none">
                                        {quickAddDate ? format(quickAddDate, "EEEE, MMM do") : "Day Schedule"}
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-50">
                                        {dayDetailTab === "view" ? "Operational Overview" : "New Mission entry"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex bg-muted/50 p-1 rounded-xl border border-border/30 gap-1">
                                    <button
                                        onClick={() => setDayDetailTab("view")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider",
                                            dayDetailTab === "view" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Activity ({getEventsForDay(quickAddDate || new Date()).length})
                                    </button>
                                    <button
                                        onClick={() => setDayDetailTab("add")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider",
                                            dayDetailTab === "add" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            {dayDetailTab === "view" ? (
                                <div className="space-y-4">
                                    {getEventsForDay(quickAddDate || new Date()).length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                                            <div className="h-12 w-12 rounded-full bg-muted border border-dashed border-border flex items-center justify-center">
                                                <CalendarIcon className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-medium italic">No active missions for this date.</p>
                                            <Button variant="outline" size="sm" className="rounded-full text-[10px] font-black uppercase" onClick={() => setDayDetailTab("add")}>
                                                Log First Task
                                            </Button>
                                        </div>
                                    ) : (
                                        getEventsForDay(quickAddDate || new Date()).map((event) => (
                                            <div key={event.id} className="group relative p-4 rounded-2xl bg-muted/10 border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <StatusDot priority={event.priority} size="sm" />
                                                            <Link href={`/projects/tasks/viewtask/${event.id}`} className="text-sm font-bold truncate hover:text-primary transition-colors">
                                                                {event.title}
                                                            </Link>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={getPriorityBadgeVariant(event.priority) as any} className="text-[8px] h-4 px-1 border-0">
                                                                {event.priority}
                                                            </Badge>
                                                            {event.projectTitle && (
                                                                <span className="text-[10px] text-muted-foreground truncate">
                                                                    in {event.projectTitle}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-1.5 bg-background/50 p-1 rounded-lg border border-border/20">
                                                        {(['ACTIVE', 'PENDING', 'COMPLETE'] as const).map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleQuickStatusUpdate(event.id, status)}
                                                                title={`Mark as ${status}`}
                                                                className={cn(
                                                                    "h-6 w-6 rounded flex items-center justify-center transition-all",
                                                                    event.taskStatus === status
                                                                        ? (status === 'COMPLETE' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : status === 'ACTIVE' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20")
                                                                        : "text-muted-foreground/40 hover:text-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {status === 'COMPLETE' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                                {status === 'ACTIVE' && <Circle className="h-3.5 w-3.5" />}
                                                                {status === 'PENDING' && <Clock className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 pt-2">
                                    {/* Main Input */}
                                    <div className="relative group">
                                        <label className="absolute -top-2 left-3 bg-background px-1.5 text-[10px] font-black uppercase tracking-widest text-primary/50 group-focus-within:text-primary transition-colors z-10">
                                            What's the mission?
                                        </label>
                                        <Input
                                            placeholder="e.g. Follow up with Tesla about the updated quote"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                                            autoFocus
                                            className="h-14 text-lg font-bold bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl pl-4"
                                        />
                                    </div>

                                    {/* Row of Controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr,0.5fr] gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Priority</label>
                                            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 shadow-inner">
                                                {priorities.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setNewTaskPriority(p.value)}
                                                        className={cn(
                                                            "flex-1 py-2 px-1 rounded-lg text-[9px] font-black uppercase transition-all duration-200 border border-transparent",
                                                            newTaskPriority === p.value
                                                                ? `${p.color.replace("text-", "bg-").replace("-500", "-500/15").replace("-600", "-600/15")} ${p.color} border-${p.color.replace("text-", "")}/20 shadow-md scale-[1.02] z-10`
                                                                : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30"
                                                        )}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Due Date</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="w-full flex items-center justify-between h-11 px-2.5 rounded-xl bg-muted/20 border border-border/50 text-[11px] font-bold hover:bg-muted/30 transition-all group">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100" />
                                                            <span className="text-foreground/80">{quickAddDate ? format(quickAddDate, "MMM do") : "Pick date"}</span>
                                                        </div>
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-white/10 shadow-2xl" align="end" sideOffset={8}>
                                                    <Calendar
                                                        mode="single"
                                                        selected={quickAddDate || undefined}
                                                        onSelect={(date) => {
                                                            setQuickAddDate(date || new Date());
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-50">Initial Status</label>
                                        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 shadow-inner">
                                            {statuses.map((s) => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => setNewTaskStatus(s.value)}
                                                    className={cn(
                                                        "flex-1 py-2 px-1 rounded-lg text-[9px] font-black uppercase transition-all duration-200 border border-transparent flex items-center justify-center gap-1.5",
                                                        newTaskStatus === s.value
                                                            ? `${s.color.replace("text-", "bg-").replace("-500", "-500/15")} ${s.color} border-${s.color.replace("text-", "")}/20 shadow-md scale-[1.02] z-10`
                                                            : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30"
                                                    )}
                                                >
                                                    <s.icon className="h-3 w-3" />
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Linkage & Project Area */}
                                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-4 relative overflow-hidden group/link">
                                        <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                            <Building2 className="h-12 w-12" />
                                        </div>
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 ml-1">Project & CRM Linkage</h5>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Project Board */}
                                            <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                                                <PopoverTrigger asChild>
                                                    <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-background/50 border border-border/30 text-xs text-muted-foreground hover:border-primary/30 transition-all text-left">
                                                        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate flex-1">
                                                            {newTaskProjectId
                                                                ? boards.find((b: any) => b.id === newTaskProjectId)?.title || "Standard Board"
                                                                : "No Project (Private)"}
                                                        </span>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0 border-white/10 shadow-2xl" align="start">
                                                    <Command shouldFilter={false} className="bg-transparent">
                                                        <CommandInput
                                                            placeholder="Search projects..."
                                                            onValueChange={setSearchValue}
                                                            className="border-none focus:ring-0"
                                                        />
                                                        <CommandList className="max-h-[250px]">
                                                            <CommandEmpty>{isSearching ? "Searching..." : "No projects found."}</CommandEmpty>
                                                            <CommandGroup heading="Active Boards">
                                                                <CommandItem
                                                                    onSelect={() => {
                                                                        setNewTaskProjectId("");
                                                                        setProjectSearchOpen(false);
                                                                    }}
                                                                    className="flex items-center gap-2 group"
                                                                >
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                                                                    <span className="text-muted-foreground italic">None (Private Reminder)</span>
                                                                </CommandItem>
                                                                {boards.slice(0, 5).map((board: any) => (
                                                                    <CommandItem
                                                                        key={board.id}
                                                                        value={board.id}
                                                                        onSelect={() => {
                                                                            setNewTaskProjectId(board.id);
                                                                            setProjectSearchOpen(false);
                                                                        }}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                        {board.title}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                            {searchResults?.projects?.length > 0 && (
                                                                <CommandGroup heading="Search Results">
                                                                    {searchResults.projects.map((p: any) => (
                                                                        <CommandItem
                                                                            key={p.id}
                                                                            value={p.id}
                                                                            onSelect={() => {
                                                                                setNewTaskProjectId(p.id);
                                                                                setProjectSearchOpen(false);
                                                                            }}
                                                                        >
                                                                            {p.title}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>

                                            {/* CRM Entity */}
                                            <Popover open={linkSearchOpen} onOpenChange={setLinkSearchOpen}>
                                                <PopoverTrigger asChild>
                                                    <button className="flex items-center gap-2 h-9 px-3 rounded-lg bg-background/50 border border-border/30 text-xs text-muted-foreground hover:border-primary/30 transition-all text-left">
                                                        {linkedRecordId ? (
                                                            <>
                                                                {linkedRecordType === 'account' && <Building2 className="h-3 w-3 text-blue-400" />}
                                                                {linkedRecordType === 'opportunity' && <Target className="h-3 w-3 text-purple-400" />}
                                                                {linkedRecordType === 'contact' && <Users className="h-3 w-3 text-emerald-400" />}
                                                                <span className="truncate flex-1 font-bold text-foreground">{linkedRecordName}</span>
                                                                <X
                                                                    className="h-3 w-3 hover:text-red-400"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        setLinkedRecordId("");
                                                                        setLinkedRecordName("");
                                                                        setLinkedRecordType("");
                                                                    }}
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Search className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate flex-1">Link CRM...</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0 border-white/10 shadow-2xl" align="end">
                                                    <Command shouldFilter={false} className="bg-transparent">
                                                        <CommandInput
                                                            placeholder="Search Accounts, Contacts, Leads..."
                                                            onValueChange={setSearchValue}
                                                        />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty>{isSearching ? "Searching vault..." : "Nothing found."}</CommandEmpty>
                                                            {searchResults?.accounts?.length > 0 && (
                                                                <CommandGroup heading="Accounts">
                                                                    {searchResults.accounts.map((a: any) => (
                                                                        <CommandItem key={a.id} onSelect={() => {
                                                                            setLinkedRecordId(a.id);
                                                                            setLinkedRecordType('account');
                                                                            setLinkedRecordName(a.name);
                                                                            setLinkSearchOpen(false);
                                                                        }}>
                                                                            <Building2 className="mr-2 h-4 w-4 text-blue-400" />
                                                                            {a.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                            {searchResults?.contacts?.length > 0 && (
                                                                <CommandGroup heading="Contacts">
                                                                    {searchResults.contacts.map((c: any) => (
                                                                        <CommandItem key={c.id} onSelect={() => {
                                                                            setLinkedRecordId(c.id);
                                                                            setLinkedRecordType('contact');
                                                                            setLinkedRecordName(`${c.firstName} ${c.lastName}`);
                                                                            setLinkSearchOpen(false);
                                                                        }}>
                                                                            <Users className="mr-2 h-4 w-4 text-emerald-400" />
                                                                            {c.firstName} {c.lastName}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                            {searchResults?.opportunities?.length > 0 && (
                                                                <CommandGroup heading="Opportunities">
                                                                    {searchResults.opportunities.map((o: any) => (
                                                                        <CommandItem key={o.id} onSelect={() => {
                                                                            setLinkedRecordId(o.id);
                                                                            setLinkedRecordType('opportunity');
                                                                            setLinkedRecordName(o.title);
                                                                            setLinkSearchOpen(false);
                                                                        }}>
                                                                            <Target className="mr-2 h-4 w-4 text-purple-400" />
                                                                            {o.title}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Dynamic based on tab */}
                        <div className="p-6 border-t border-border/10">
                            {dayDetailTab === "view" ? (
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Tasks reflect current operational status.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="text-xs font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-primary rounded-xl"
                                        onClick={() => setDayDetailOpen(false)}
                                    >
                                        Close Overview
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                        onClick={() => setDayDetailOpen(false)}
                                    >
                                        Cancel entry
                                    </Button>
                                    <Button
                                        disabled={isSubmitting || !newTaskTitle.trim()}
                                        onClick={handleQuickAdd}
                                        className="relative group h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 overflow-hidden"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span>Deploy mission</span>
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Agenda View */}
            {view === "agenda" && (
                <div className="space-y-6">
                    {groupedAgendaEvents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
                            No tasks scheduled for {format(currentMonth, "MMMM yyyy")}
                        </div>
                    ) : (
                        groupedAgendaEvents.map((group) => {
                            const isDateToday = isToday(group.date);
                            return (
                                <div key={format(group.date, 'yyyy-MM-dd')} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDateToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            }`}>
                                            {format(group.date, "EEEE, MMM d")}
                                            {isDateToday && " • Today"}
                                        </div>
                                        <div className="h-px bg-border flex-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        {group.tasks.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/projects/tasks/viewtask/${event.id}`}
                                                className={`flex items-center gap-4 p-3 rounded-xl border transition-[color,background-color,border-color,box-shadow] hover:shadow-md ${isDateToday ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <StatusDot priority={event.priority} />
                                                        <span className="font-semibold">{event.title}</span>
                                                        <Badge variant={getPriorityBadgeVariant(event.priority || "normal") as any} className="text-[10px] h-4 px-1.5 ml-auto sm:ml-0">
                                                            {event.priority}
                                                        </Badge>
                                                    </div>
                                                    {event.projectTitle && (
                                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                            <span className="opacity-70">Project:</span>
                                                            <span className="font-medium">{event.projectTitle}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Month/Week Calendar Grid */}
            {(view === "month" || view === "week") && (
                <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                    {/* Week days header */}
                    <div className="grid grid-cols-7 bg-muted/50 border-b border-border/50">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                                key={day}
                                className="p-3 text-center text-sm font-medium text-muted-foreground"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {viewDays.map((day, idx) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isCurrentDay = isToday(day);
                            const density = dayEvents.length;
                            const densityScale = density === 0 ? "transparent" :
                                density <= 2 ? "primary/5" :
                                    density <= 4 ? "primary/15" : "primary/30";

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        "min-h-[120px] border-b border-r border-border/30 p-2 cursor-pointer hover:bg-muted/30 transition-all group relative",
                                        !isCurrentMonth && view === "month" ? "opacity-30 bg-muted/10" : `bg-${densityScale}`,
                                        isCurrentDay ? "ring-1 ring-primary/20 bg-primary/5" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1 relative z-10">
                                        <div
                                            className={cn(
                                                "text-[10px] font-bold tracking-tight uppercase px-1.5 py-0.5 rounded",
                                                isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {format(day, "d")}
                                        </div>
                                        {density > 0 && <span className="text-[10px] font-black text-primary/40">{density}</span>}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, view === "week" ? 5 : 3).map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/projects/tasks/viewtask/${event.id}`}
                                                className="block"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-1.5 text-xs p-1 rounded bg-muted/60 hover:bg-muted transition-colors truncate">
                                                    <StatusDot priority={event.priority} size="sm" />
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            </Link>
                                        ))}
                                        {dayEvents.length > (view === "week" ? 5 : 3) && (
                                            <div className="text-xs text-muted-foreground px-1">
                                                +{dayEvents.length - (view === "week" ? 5 : 3)} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {Object.entries(priorityLabels)
                    .reverse()
                    .map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                            <StatusDot priority={key} size="md" />
                            <span>{label}</span>
                        </div>
                    ))}
                <div className="text-xs ml-auto">Click on any day to add a task</div>
            </div>
            {/* AI Daily Briefing Modal */}
            <Dialog open={isBriefingOpen} onOpenChange={setIsBriefingOpen}>
                <DialogContent className="sm:max-w-[550px] border-primary/20 bg-background/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight italic">
                            <Zap className="h-6 w-6 text-amber-500 fill-amber-500/20" />
                            AI Daily Pulse
                        </DialogTitle>
                        <DialogDescription>
                            Your personalized executive briefing for {format(new Date(), "MMMM do, yyyy")}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {isGeneratingBriefing ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                                <p className="text-sm font-medium text-muted-foreground animate-pulse italic">
                                    Analyzing agenda & optimizing your day...
                                </p>
                            </div>
                        ) : briefingData ? (
                            <div className="space-y-6">
                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Clock className="h-24 w-24" />
                                    </div>
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Strategic Summary</h5>
                                    <p className="text-sm leading-relaxed font-medium relative z-10">
                                        {briefingData.summary}
                                    </p>
                                </div>

                                {briefingData.highValueAlerts && briefingData.highValueAlerts.length > 0 && (
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500 ml-1">Priority Insights</h5>
                                        <div className="grid gap-2">
                                            {briefingData.highValueAlerts.map((alert, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                    <p className="text-xs font-semibold">{alert}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Engine Optimised</span>
                                    </div>
                                    <Button size="sm" onClick={() => setIsBriefingOpen(false)}>
                                        Got it, let's go
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Failed to load daily briefing.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

