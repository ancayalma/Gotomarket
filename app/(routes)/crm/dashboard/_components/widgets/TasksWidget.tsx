"use client";

import React, { useState, useTransition } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { CheckCircle2, Clock, ArrowRight, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { markTaskComplete } from "@/actions/dashboard/mark-task-complete";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { priorities } from "@/app/(routes)/projects/tasks/data/data";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import NewTaskDialog from "@/app/(routes)/projects/dialogs/NewTask";
import UpdateTaskDialog from "@/app/(routes)/projects/dialogs/UpdateTask";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";

interface DailyTask {
    id: string;
    title: string;
    priority: string;
    dueDateAt: Date | null;
    taskStatus: string | null;
    assigned_section: {
        board: string | null;
        title: string | null;
    } | null;
}

interface TasksWidgetProps {
    tasks: DailyTask[];
    userId: string;
}

const TaskUrgencyIndicator = ({ dueDate, priority }: { dueDate: Date | null; priority: string }) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    const isHighPriority = priority.toLowerCase() === "high";

    let glowColor = "bg-white/10";
    let pulseColor = "bg-white/5";

    if (isOverdue) {
        glowColor = "bg-rose-500";
        pulseColor = "bg-rose-500/20";
    } else if (isHighPriority) {
        glowColor = "bg-amber-500";
        pulseColor = "bg-amber-500/20";
    }

    return (
        <div className="relative h-2 w-2">
            {(isOverdue || isHighPriority) && (
                <div className={`absolute inset-0 rounded-full ${pulseColor} animate-ping`} />
            )}
            <div className={`absolute inset-0 rounded-full ${glowColor} ${isOverdue || isHighPriority ? 'shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}`} />
        </div>
    );
};

export const TasksWidget = ({ tasks: initialTasks, userId }: TasksWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoadingTask, setIsLoadingTask] = useState(false);

    React.useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleTaskComplete = async (taskId: string) => {
        const previousTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== taskId));

        startTransition(async () => {
            try {
                const result = await markTaskComplete(taskId);
                if (result.success) {
                    toast.success("Task cleared from pipeline");
                    router.refresh();
                } else {
                    setTasks(previousTasks);
                    toast.error("Failed to update status");
                }
            } catch (error) {
                setTasks(previousTasks);
                toast.error("Network error");
            }
        });
    };

    const handleTaskClick = async (taskId: string) => {
        setIsLoadingTask(true);
        setIsEditOpen(true);
        try {
            const res = await axios.get(`/api/projects/tasks/${taskId}`);
            setSelectedTask(res.data);
        } catch (error) {
            toast.error("Failed to load task details");
            setIsEditOpen(false);
        } finally {
            setIsLoadingTask(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getPriorityData = (p: string) => {
        return priorities.find((item) => item.value === p.toLowerCase()) || null;
    };

    const { data: teamData } = useSWR(searchTerm === "" ? "/api/team/members" : null, fetcher);
    const { data: projectsData } = useSWR(searchTerm === "" ? "/api/projects" : null, fetcher);

    const users = teamData?.members || [];
    const boards = projectsData?.projects || [];

    const rightAction = (
        <NewTaskDialog
            users={users}
            boards={boards}
            customTrigger={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10 text-primary"
                >
                    <Plus size={12} className="mr-1" />
                    QUICK TASK
                </Button>
            }
        />
    );

    return (
        <>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-4 border-white/10 bg-slate-950/90 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Refine Task</DialogTitle>
                    </DialogHeader>
                    {isLoadingTask ? (
                        <div className="flex items-center justify-center flex-1 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : selectedTask ? (
                        <UpdateTaskDialog
                            users={users}
                            boards={boards}
                            boardId={selectedTask.assigned_section?.board || selectedTask.assigned_section?.boardId}
                            initialData={selectedTask}
                            onDone={() => {
                                setIsEditOpen(false);
                                router.refresh();
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-muted-foreground italic">
                            Mission data lost
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <WidgetWrapper
                title="Active Tasks"
                icon={CheckCircle2}
                iconColor="text-emerald-400"
                onSearch={setSearchTerm}
                searchValue={searchTerm}
                footerHref={`/projects/tasks/${userId}`}
                footerLabel="View Full Task Pipeline"
                count={tasks.length}
                rightAction={rightAction}
            >
                <div className="space-y-1.5 pb-4 mt-3">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                            <CheckCircle2 className="h-10 w-10 mb-2 opacity-10" />
                            <p className="text-[11px] font-medium italic">No active objectives</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => {
                            const pData = getPriorityData(task.priority);
                            const isOverdue = task.dueDateAt && new Date(task.dueDateAt) < new Date();

                            return (
                                <div
                                    key={task.id}
                                    className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.04] transition-colors duration-300"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="shrink-0">
                                            <div
                                                onClick={() => handleTaskComplete(task.id)}
                                                className="h-5 w-5 rounded-md border-2 border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer flex items-center justify-center transition-colors duration-200 group/check"
                                            >
                                                <div className="h-2 w-2 rounded-sm bg-emerald-500 opacity-0 scale-50 group-hover/check:opacity-50 group-hover/check:scale-100 transition-colors duration-200" />
                                            </div>
                                        </div>

                                        <div className="space-y-1 overflow-hidden flex-1">
                                            <div className="flex items-center gap-2">
                                                <TaskUrgencyIndicator dueDate={task.dueDateAt} priority={task.priority} />
                                                <span
                                                    className="text-sm font-bold text-white/90 truncate group-hover:text-primary transition-colors cursor-pointer"
                                                    onClick={() => handleTaskClick(task.id)}
                                                >
                                                    {task.title}
                                                </span>
                                                <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-0 shadow-none bg-white/5", pData?.color)}>
                                                    {task.priority}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 text-[10px] font-medium">
                                                {task.dueDateAt && (
                                                    <span className={cn(
                                                        "flex items-center gap-1",
                                                        isOverdue ? "text-rose-400 font-bold animate-pulse" : "text-muted-foreground opacity-60"
                                                    )}>
                                                        <Clock size={10} />
                                                        {isOverdue ? "Overdue" : format(new Date(task.dueDateAt), "MMM d")}
                                                    </span>
                                                )}
                                                {task.assigned_section?.title && (
                                                    <span className="text-muted-foreground opacity-60 truncate flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                                        {task.assigned_section.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {task.assigned_section?.board && (
                                            <Link href={`/projects/boards/${task.assigned_section.board}`}>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 transition-[color,background-color,border-color,opacity] duration-300"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </WidgetWrapper>
        </>
    );
};

