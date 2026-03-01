
"use client";

import React, { useState, useEffect } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from "@hello-pangea/dnd";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateLeadPipelineStage } from "@/actions/crm/lead/update-stage";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Calendar, User, Zap, MessageSquare } from "lucide-react";

interface Lead {
    id: string;
    firstName?: string | null;
    lastName: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    pipeline_stage: string;
    assigned_to_user?: {
        name: string;
        avatar?: string;
    } | null;
}

interface PipelineStage {
    id: string;
    name: string;
    order: number;
}

const DEFAULT_STAGES: PipelineStage[] = [
    { id: "Identify", name: "Identify", order: 1 },
    { id: "Engage_AI", name: "Engage (AI)", order: 2 },
    { id: "Engage_Human", name: "Engage (Human)", order: 3 },
    { id: "Offering", name: "Offering", order: 4 },
    { id: "Finalizing", name: "Finalizing", order: 5 },
    { id: "Closed", name: "Closed / Lost", order: 6 },
    { id: "Converted", name: "Converted", order: 7 },
];

interface LeadsKanbanBoardProps {
    leads: Lead[];
}

export function LeadsKanbanBoard({ leads }: LeadsKanbanBoardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [localLeads, setLocalLeads] = useState(leads);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setLocalLeads(leads);
    }, [leads]);

    if (!isMounted) return null;

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStageId = destination.droppableId;
        const leadId = draggableId;

        // Optimistic UI Update
        const updatedLeads = localLeads.map(lead =>
            lead.id === leadId ? { ...lead, pipeline_stage: newStageId } : lead
        );
        setLocalLeads(updatedLeads);

        try {
            const res = await updateLeadPipelineStage(leadId, newStageId);
            if (!res.success) {
                toast.error("Failed to update stage");
                setLocalLeads(leads); // Revert
            } else {
                toast.success("Lead moved to " + newStageId);
            }
        } catch (error) {
            toast.error("An error occurred");
            setLocalLeads(leads); // Revert
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-[calc(100vh-320px)] overflow-x-auto pb-4 custom-scrollbar">
                {DEFAULT_STAGES.map((stage) => {
                    const stageLeads = localLeads.filter(l => l.pipeline_stage === stage.id);

                    return (
                        <div key={stage.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-xl border border-border/50">
                            <div className="p-4 flex items-center justify-between border-b bg-background/40 backdrop-blur-sm rounded-t-xl">
                                <div className="flex flex-col">
                                    <h3 className="font-black uppercase tracking-tighter text-sm italic bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent italic">
                                        {stage.name}
                                    </h3>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        {stageLeads.length} PROSPECTS
                                    </span>
                                </div>
                                <Zap className="w-3.5 h-3.5 text-yellow-500/50" />
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 p-2 gap-3 flex flex-col overflow-y-auto min-h-[100px] transition-colors duration-200",
                                            snapshot.isDraggingOver ? "bg-indigo-500/5" : ""
                                        )}
                                    >
                                        {stageLeads.map((lead, index) => (
                                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "group p-3 bg-background border border-border/50 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all cursor-grab active:cursor-grabbing",
                                                            snapshot.isDragging ? "shadow-xl border-indigo-500 ring-1 ring-indigo-500/20 scale-[1.02]" : ""
                                                        )}
                                                    >
                                                        <Link href={`/crm/leads/${lead.id}`} className="space-y-3 block">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex flex-col">
                                                                    <h4 className="font-bold text-sm leading-tight text-foreground group-hover:text-indigo-500 transition-colors line-clamp-1">
                                                                        {lead.firstName} {lead.lastName}
                                                                    </h4>
                                                                    <span className="text-[10px] text-muted-foreground font-semibold truncate uppercase tracking-tighter">
                                                                        {lead.company || "Individual"}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-1.5 ">
                                                                {lead.email && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold hover:text-foreground transition-colors truncate">
                                                                        <Mail className="w-3 h-3 text-indigo-400" />
                                                                        <span className="truncate">{lead.email}</span>
                                                                    </div>
                                                                )}
                                                                {lead.phone && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold hover:text-foreground transition-colors">
                                                                        <Phone className="w-3 h-3 text-emerald-400" />
                                                                        <span>{lead.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Avatar className="h-5 w-5 border border-background">
                                                                        <AvatarImage src={lead.assigned_to_user?.avatar || undefined} />
                                                                        <AvatarFallback className="text-[8px] bg-indigo-500/10 text-indigo-500">
                                                                            {lead.assigned_to_user?.name?.substring(0, 2).toUpperCase() || "SY"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[80px]">
                                                                        {lead.assigned_to_user?.name || "System"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <div className="h-4 w-4 rounded bg-muted/50 flex items-center justify-center">
                                                                        <MessageSquare className="w-2.5 h-2.5 text-muted-foreground/50" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
