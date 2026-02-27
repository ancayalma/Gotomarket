"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Folder,
    Clock,
    Users,
    ArrowRight,
    Star,
    Shield,
    CheckCircle2,
    Layout
} from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectsGridProps {
    data: any[];
}

export const ProjectsGrid = ({ data }: ProjectsGridProps) => {
    const router = useRouter();

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-background/50 backdrop-blur-sm border-primary/10">
                <div className="p-4 rounded-full bg-primary/5 mb-4">
                    <Folder className="w-12 h-12 text-primary/40" />
                </div>
                <h3 className="text-xl font-bold">No Projects Found</h3>
                <p className="text-muted-foreground mb-6">Start by creating your first project board.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((board) => (
                <Card
                    key={board.id}
                    className="group relative overflow-hidden border-primary/10 bg-background/50 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl cursor-pointer"
                    onClick={() => router.push(`/projects/boards/${board.id}`)}
                >
                    {/* Ambient Background Glow */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardHeader className="relative z-10 pb-2">
                        <div className="flex items-start justify-between">
                            <div className={cn(
                                "p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 transition-transform duration-500",
                                board.brand_primary_color && `bg-${board.brand_primary_color}/10`
                            )}>
                                {board.icon ? (
                                    <span className="text-2xl">{board.icon}</span>
                                ) : (
                                    <Folder className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex gap-2">
                                {board.favourite && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-lg">
                                        <Star className="w-3 h-3 fill-current mr-1" />
                                        Fav
                                    </Badge>
                                )}
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg">
                                    {board.visibility || "Private"}
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-4">
                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                                {board.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                                {board.description || "No description provided."}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="relative z-10 pb-4">
                        <div className="space-y-4">
                            {/* Stats or Details */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{moment(board.updatedAt).fromNow()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span>{board.sharedWith?.length || 0} Members</span>
                                </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center gap-3">
                                {board.status === "ACTIVE" ? (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                        <Clock className="w-3 h-3" />
                                        {board.status || "Draft"}
                                    </div>
                                )}
                                {board.require_approval && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                        <Shield className="w-3 h-3" />
                                        Locked
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="relative z-10 border-t border-primary/5 pt-4 bg-primary/5">
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <span className="text-[10px] font-bold text-primary">
                                        {board.assigned_user?.name?.charAt(0) || "U"}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner</span>
                                    <span className="text-xs font-semibold">{board.assigned_user?.name || "Unassigned"}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="group/btn gap-2 text-primary hover:bg-primary/10 rounded-xl">
                                Open Board
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};
