"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RelocatableEntityType, relocateEntity } from "@/actions/teams/relocate-data";
import { getTeams } from "@/actions/teams/get-teams";

interface Props {
    entityId: string;
    entityType: RelocatableEntityType;
    entityName: string;
    isGlobalAdmin: boolean;
}

export const RelocateEntityDialog = ({ entityId, entityType, entityName, isGlobalAdmin }: Props) => {
    const [open, setOpen] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeamSlug, setSelectedTeamSlug] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingTeams, setIsFetchingTeams] = useState(false);

    const fetchTeams = React.useCallback(async () => {
        setIsFetchingTeams(true);
        try {
            const data = await getTeams();
            setTeams(data);
        } catch (error) {
            toast.error("Failed to load teams");
        } finally {
            setIsFetchingTeams(false);
        }
    }, []);

    useEffect(() => {
        if (open && teams.length === 0) {
            fetchTeams();
        }
    }, [open, teams.length, fetchTeams]);

    const handleRelocate = async () => {
        if (!selectedTeamSlug) {
            toast.error("Please select a target team");
            return;
        }

        setIsLoading(true);
        try {
            const res = await relocateEntity(entityId, entityType, selectedTeamSlug);
            if (res.success) {
                toast.success(res.message);
                setOpen(false);
                // Reload or redirect as this data is now "gone" from this context
                window.location.reload();
            } else {
                toast.error(res.error || "Relocation failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isGlobalAdmin) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold uppercase tracking-wider"
                >
                    <ArrowRightLeft className="w-3 h-3 mr-1.5" />
                    Relocate Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-amber-500/20 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <DialogTitle className="text-amber-500 font-bold uppercase tracking-tight">God Mode Relocation</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        You are about to transfer <span className="text-white font-bold">"{entityName}"</span> and all of its associated records (Leads, Contacts, Opportunities, Tasks, etc.) to another team.
                        <br /><br />
                        <span className="text-amber-500/80 italic font-medium">This action bypasses all standard RBAC and moves records permanently between database buckets.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Team</label>
                        <Select onValueChange={setSelectedTeamSlug} disabled={isLoading || isFetchingTeams}>
                            <SelectTrigger className="bg-white/5 border-white/10 h-10">
                                <SelectValue placeholder={isFetchingTeams ? "Loading teams..." : "Select target team..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-white/10">
                                {teams.map((team) => (
                                    <SelectItem key={team.id} value={team.slug}>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="font-bold text-sm tracking-tight">{team.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{team.slug}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading} className="text-xs hover:bg-white/5 h-10">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRelocate}
                        disabled={isLoading || !selectedTeamSlug}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider h-10 px-6"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Transfer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
