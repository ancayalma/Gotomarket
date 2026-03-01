
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
import { updateOpportunitySalesStage } from "@/actions/crm/opportunity/update-stage";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Calendar, User } from "lucide-react";

interface SalesStage {
    id: string;
    name: string;
    order: number;
}

interface Opportunity {
    id: string;
    name: string;
    expected_revenue: number;
    close_date: string;
    sales_stage: string;
    assigned_to_user?: {
        name: string;
        avatar?: string;
    } | null;
    assigned_account?: {
        name: string;
    } | null;
}

interface KanbanBoardProps {
    opportunities: Opportunity[];
    stages: SalesStage[];
}

export function KanbanBoard({ opportunities, stages }: KanbanBoardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [localDeals, setLocalDeals] = useState(opportunities);

    // Sorting stages by order
    const sortedStages = [...stages].sort((a, b) => (a.order || 0) - (b.order || 0));

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setLocalDeals(opportunities);
    }, [opportunities]);

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
        const opportunityId = draggableId;

        // Optimistic UI Update
        const updatedDeals = localDeals.map(deal =>
            deal.id === opportunityId ? { ...deal, sales_stage: newStageId } : deal
        );
        setLocalDeals(updatedDeals);

        try {
            const res = await updateOpportunitySalesStage(opportunityId, newStageId);
            if (!res.success) {
                toast.error("Failed to update stage");
                setLocalDeals(opportunities); // Revert
            } else {
                toast.success("Stage updated");
            }
        } catch (error) {
            toast.error("An error occurred");
            setLocalDeals(opportunities); // Revert
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-[calc(100vh-320px)] overflow-x-auto pb-4 custom-scrollbar">
                {sortedStages.map((stage) => {
                    const stageDeals = localDeals.filter(d => d.sales_stage === stage.id);
                    const totalValue = stageDeals.reduce((sum, d) => sum + (d.expected_revenue || 0), 0);

                    return (
                        <div key={stage.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-muted/30 rounded-xl border border-border/50">
                            <div className="p-4 flex items-center justify-between border-b bg-background/40 backdrop-blur-sm rounded-t-xl">
                                <div className="flex flex-col">
                                    <h3 className="font-black uppercase tracking-tighter text-sm italic bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
                                        {stage.name}
                                    </h3>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                        {stageDeals.length} DEALS • ${totalValue.toLocaleString()}
                                    </span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5">
                                    {stage.order}
                                </Badge>
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 p-2 gap-3 flex flex-col overflow-y-auto min-h-[100px] transition-colors duration-200",
                                            snapshot.isDraggingOver ? "bg-primary/5" : ""
                                        )}
                                    >
                                        {stageDeals.map((deal, index) => (
                                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "group p-3 bg-background border border-border/50 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing",
                                                            snapshot.isDragging ? "shadow-xl border-primary ring-1 ring-primary/20 scale-[1.02]" : ""
                                                        )}
                                                    >
                                                        <Link href={`/crm/opportunities/${deal.id}`} className="space-y-3 block">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-sm leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                                    {deal.name}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-primary font-black tracking-tighter text-base">
                                                                <DollarSign className="w-3.5 h-3.5" />
                                                                <span>{deal.expected_revenue?.toLocaleString()}</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                                                                {deal.assigned_account && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium truncate">
                                                                        <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                            <User className="w-2.5 h-2.5 text-blue-500" />
                                                                        </div>
                                                                        <span className="truncate">{deal.assigned_account.name}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                                    <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                                        <Calendar className="w-2.5 h-2.5 text-orange-500" />
                                                                    </div>
                                                                    <span>{new Date(deal.close_date).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Avatar className="h-5 w-5 border border-background">
                                                                        <AvatarImage src={deal.assigned_to_user?.avatar || undefined} />
                                                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                                            {deal.assigned_to_user?.name?.substring(0, 2).toUpperCase() || "UN"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[80px]">
                                                                        {deal.assigned_to_user?.name || "Unassigned"}
                                                                    </span>
                                                                </div>
                                                                <div className="h-1 w-8 rounded-full bg-muted overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{
                                                                            width: `${(stage.order * 100) / (stages.length || 1)}%`
                                                                        }}
                                                                    />
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
