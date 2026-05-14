"use client";

import moment from "moment";
import Link from "next/link";

import { TeamConversations } from "../../tasks/viewtask/[taskId]/components/team-conversation";
import { useToast } from "@/components/ui/use-toast";

import { useRouter } from "next/navigation";
import { getTaskDone } from "../../actions/get-task-done";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CheckSquare, Eye, MessagesSquare, Pencil, Clock } from "lucide-react";
import UpdateTaskDialog from "../../dialogs/UpdateTask";
import { Button } from "@/components/ui/button";
import { Sections } from "@prisma/client";
import { ElementRef, useRef, useState } from "react";
import FormSheet from "@/components/sheets/form-sheet";
import { priorities } from "../../tasks/data/data";
import { cn } from "@/lib/utils";

interface DashboardData {
  getTaskPastDue: Tasks[];
  getTaskPastDueInSevenDays: Tasks[];
}

export interface Tasks {
  id: string;
  title: string;
  content: string;
  dueDateAt: Date;
  priority: string;
  section: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDashboardCockpit = ({
  dashboardData,
  users,
  boards,
  sections,
}: {
  dashboardData: DashboardData;
  users: any;
  boards: any;
  sections: Sections[];
}) => {
  const { toast } = useToast();
  const router = useRouter();

  const [updateOpenSheet, setUpdateOpenSheet] = useState(false);
  const closeRef = useRef<ElementRef<"button">>(null);

  //Actions
  const onDone = async (taskId: string) => {
    try {
      await getTaskDone(taskId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, task not marked as done.",
      });
    } finally {
      toast({
        title: "Success, task marked as done.",
      });
      router.refresh();
    }
  };

  //Console logs

  return (
    <div className="flex flex-col md:flex-row items-start justify-center h-full w-full overflow-auto">
      <div className="w-full md:w-1/2">
        <div>
          <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent tracking-tight uppercase leading-relaxed py-1 px-1">
            Tasks due Today <span className="text-primary/40 ml-2">({dashboardData?.getTaskPastDue?.length})</span>
          </h2>
          {/*         <pre>
            <code>{JSON.stringify(dashboardData, null, 2)}</code>
          </pre> */}
        </div>

        {dashboardData?.getTaskPastDue?.map((task: Tasks) => (
          <Card
            key={task.id}
            className="m-2 group relative overflow-hidden border-primary/10 bg-background/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/5 transition-shadow duration-500 rounded-3xl"
          >
            {/* Ambient background glow */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="relative z-10">
              <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                {task.title === "" ? "Untitled" : task.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">{task.content}</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-md w-fit flex items-center gap-1.5",
                  task.dueDateAt < new Date() ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                Due {moment(task.dueDateAt).format("MMM Do")}
              </div>
              <div>
                {(() => {
                  const priorityObj = priorities.find(p => p.value === task.priority) || priorities.find(p => p.value === "normal");
                  const Icon = priorityObj?.icon;
                  return (
                    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full w-fit mt-3", priorityObj?.bgColor)}>
                      {Icon && <Icon className={cn("w-3 h-3", priorityObj?.color)} />}
                      <span className={priorityObj?.color}>{priorityObj?.label}</span>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
            <CardFooter className="relative z-10 space-x-2 bg-primary/5 border-t border-primary/5 mt-2 p-3">
              <Link href={`/projects/tasks/viewtask/${task.id}`}>
                <Badge variant={"outline"} className="hover:bg-primary/20 transition-colors cursor-pointer border-primary/20 text-primary">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  <span>Open</span>
                </Badge>
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Badge variant={"outline"} className="cursor-pointer hover:bg-primary/20 border-primary/20 text-primary">
                    <MessagesSquare className="w-3.5 h-3.5 mr-1.5" />
                    <span>Chat</span>
                  </Badge>
                </SheetTrigger>
                <SheetContent className="rounded-l-[40px] border-l-primary/20">
                  <SheetHeader>
                    <SheetTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Team Pulse</SheetTitle>
                  </SheetHeader>
                  <TeamConversations taskId={task.id} data={task.comments} />
                </SheetContent>
              </Sheet>

              <Badge
                variant={"outline"}
                onClick={() => onDone(task.id)}
                className="cursor-pointer hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-500 ml-auto"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                <span>Done</span>
              </Badge>

              <FormSheet
                trigger={"Edit"}
                title="Update task"
                description=""
                onClose={closeRef}
              >
                <UpdateTaskDialog
                  users={users}
                  boards={boards}
                  boardId={
                    sections.find(
                      (section: Sections) => section.id === task.section
                    )?.board
                  }
                  initialData={task}
                  onDone={() => closeRef.current?.click()}
                />
                <div className="w-full justify-end items-end flex pt-2">
                  <Button
                    className="ml-auto"
                    variant={"destructive"}
                    onClick={() => closeRef.current?.click()}
                  >
                    Close
                  </Button>
                </div>
              </FormSheet>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="w-full pt-5 md:w-1/2 md:pt-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent tracking-tight uppercase leading-relaxed py-1 px-1">
            Tasks due in 7 days <span className="text-primary/40 ml-2">({dashboardData?.getTaskPastDueInSevenDays?.length})</span>
          </h2>
        </div>
        {dashboardData?.getTaskPastDueInSevenDays?.map((task: Tasks) => (
          <Card
            key={task.id}
            className="m-2 group relative overflow-hidden border-primary/10 bg-background/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/5 transition-shadow duration-500 rounded-3xl"
          >
            {/* Ambient background glow */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="relative z-10">
              <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                {task.title === "" ? "Untitled" : task.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">{task.content}</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-md w-fit flex items-center gap-1.5",
                  task.dueDateAt < new Date() ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                Due {moment(task.dueDateAt).format("MMM Do")}
              </div>
              <div>
                {(() => {
                  const priorityObj = priorities.find(p => p.value === task.priority) || priorities.find(p => p.value === "normal");
                  const Icon = priorityObj?.icon;
                  return (
                    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full w-fit mt-3", priorityObj?.bgColor)}>
                      {Icon && <Icon className={cn("w-3 h-3", priorityObj?.color)} />}
                      <span className={priorityObj?.color}>{priorityObj?.label}</span>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
            <CardFooter className="relative z-10 space-x-2 bg-primary/5 border-t border-primary/5 mt-2 p-3">
              <Link href={`/projects/tasks/viewtask/${task.id}`}>
                <Badge variant={"outline"} className="hover:bg-primary/20 transition-colors cursor-pointer border-primary/20 text-primary">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  <span>Open</span>
                </Badge>
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Badge variant={"outline"} className="cursor-pointer hover:bg-primary/20 border-primary/20 text-primary">
                    <MessagesSquare className="w-3.5 h-3.5 mr-1.5" />
                    <span>Chat</span>
                  </Badge>
                </SheetTrigger>
                <SheetContent className="rounded-l-[40px] border-l-primary/20">
                  <SheetHeader>
                    <SheetTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Team Pulse</SheetTitle>
                  </SheetHeader>
                  <TeamConversations taskId={task.id} data={task.comments} />
                </SheetContent>
              </Sheet>

              <Badge
                variant={"outline"}
                onClick={() => onDone(task.id)}
                className="cursor-pointer hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-500 ml-auto"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                <span>Done</span>
              </Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectDashboardCockpit;
