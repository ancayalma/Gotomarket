"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Eye, Clock, ArrowRight, PlusCircle, ExternalLink, Activity, ShieldCheck } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDealRoom } from "@/actions/crm/create-deal-room";

interface DealRoomsGridProps {
    data: any[];
}

export const DealRoomsGrid = ({ data }: DealRoomsGridProps) => {
    const router = useRouter();

    const handleCreateRoom = async (contractId: string) => {
        toast.promise(createDealRoom(contractId), {
            loading: "Creating deal room...",
            success: (res) => {
                if (res.success) {
                    router.refresh();
                    return "Deal room created!";
                } else {
                    throw new Error("Failed");
                }
            },
            error: "Could not create deal room"
        });
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-3xl border-2 border-dashed border-primary/10 space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Globe className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold">No Rooms Found</h3>
                    <p className="text-muted-foreground">Get started by creating a deal room for one of your contracts.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/crm/contracts')} className="border-primary/20">
                    View All Contracts
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {data.map((contract) => {
                const room = contract.deal_room;
                const hasRoom = room && room.is_active;

                return (
                    <Card key={contract.id} className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-[color,background-color,border-color,box-shadow] duration-300 bg-background/50 backdrop-blur-sm shadow-lg shadow-black/5 hover:shadow-primary/5">
                        <CardHeader className="pb-3 relative">
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant={hasRoom ? "default" : "outline"} className={hasRoom ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"}>
                                    {hasRoom ? 'Active Room' : 'Draft'}
                                </Badge>
                                {hasRoom && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        Updated {moment(contract.updatedAt).fromNow()}
                                    </div>
                                )}
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">{contract.title}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {contract.assigned_account?.name || "No Account"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            {hasRoom ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/30 rounded-xl p-3 border border-primary/5 hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <Eye className="w-3 h-3" />
                                                Views
                                            </div>
                                            <div className="text-2xl font-black text-primary">{room.total_views || 0}</div>
                                        </div>
                                        <div className="bg-muted/30 rounded-xl p-3 border border-primary/5 hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                                <Activity className="w-3 h-3" />
                                                Engagement
                                            </div>
                                            <div className="text-2xl font-black text-emerald-500">
                                                {room.engagement_score || 0}%
                                            </div>
                                        </div>
                                    </div>

                                    {room.last_viewed_at && (
                                        <div className="flex items-center gap-2 text-xs bg-emerald-500/5 text-emerald-600 p-2 rounded-lg border border-emerald-500/10 animate-pulse-subtle">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Last viewed {moment(room.last_viewed_at).fromNow()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-primary/20">
                                    <Globe className="w-10 h-10 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground px-4">No digital sales room has been created for this contract yet.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="pt-2 gap-2">
                            {hasRoom ? (
                                <>
                                    <Button variant="outline" className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 transition-colors" onClick={() => window.open(`/proposal/${room.slug}`, '_blank')}>
                                        <ExternalLink className="w-4 h-4" />
                                        View Live
                                    </Button>
                                    <Button className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-none" size="icon" onClick={() => router.push(`/crm/contracts/${contract.id}`)}>
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] transition-transform" onClick={() => handleCreateRoom(contract.id)}>
                                    <PlusCircle className="w-4 h-4" />
                                    Create Deal Room
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
};
