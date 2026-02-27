"use client";

import React, { useState } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CRM_MODULES } from "@/lib/role-permissions";
import { ShieldAlert, Save, RotateCcw, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { updateModuleOverrides } from "@/actions/teams/update-module-overrides";

type Props = {
    teamId: string;
    teamName: string;
    currentPlan: any;
    initialOverrides: string[];
};

const TeamModulesView = ({ teamId, teamName, currentPlan, initialOverrides }: Props) => {
    const [overrides, setOverrides] = useState<string[]>(initialOverrides || []);
    const [isSaving, setIsSaving] = useState(false);

    const toggleModule = (id: string) => {
        setOverrides(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateModuleOverrides(teamId, overrides);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team module overrides updated successfully");
            }
        } catch (error) {
            toast.error("An error occurred while saving overrides");
        } finally {
            setIsSaving(false);
        }
    };

    const clearOverrides = () => {
        if (confirm("Are you sure you want to clear all overrides for this team? They will revert to their plan's default modules.")) {
            setOverrides([]);
        }
    };

    const planFeatures = currentPlan?.features || [];
    const isEnterprise = planFeatures.includes("all");

    return (
        <div className="space-y-6">
            <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Team Module Overrides</CardTitle>
                            <CardDescription>
                                Grant specific modules to <strong>{teamName}</strong> regardless of their assigned plan.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <PackageCheck className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold uppercase tracking-wider text-amber-500">Current Plan Context</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            This team is currently on the <span className="text-foreground font-bold">{currentPlan?.name || "Unknown"}</span> plan.
                            {isEnterprise ? (
                                " This plan already includes ALL modules."
                            ) : (
                                ` This plan includes ${planFeatures.length} core modules. Overrides will be added ON TOP of these.`
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-primary/20 bg-primary/5 col-span-full">
                            <Checkbox
                                id="all-modules"
                                checked={overrides.includes("all")}
                                onCheckedChange={() => toggleModule("all")}
                            />
                            <Label htmlFor="all-modules" className="font-bold text-primary flex-1 cursor-pointer">
                                GRANT FULL ACCESS (All 29 Modules)
                            </Label>
                        </div>

                        {!overrides.includes("all") && CRM_MODULES.map((module) => {
                            const isInherited = planFeatures.includes(module.id) || isEnterprise;
                            return (
                                <div
                                    key={module.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${isInherited
                                            ? "bg-zinc-900/40 border-white/5 opacity-60"
                                            : "bg-card border-border hover:border-amber-500/50"
                                        }`}
                                >
                                    <Checkbox
                                        id={module.id}
                                        checked={overrides.includes(module.id)}
                                        onCheckedChange={() => toggleModule(module.id)}
                                        disabled={isInherited}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <Label
                                            htmlFor={module.id}
                                            className={`text-sm font-medium leading-none cursor-pointer ${isInherited ? "text-muted-foreground" : "text-foreground"}`}
                                        >
                                            {module.name}
                                        </Label>
                                        {isInherited && (
                                            <p className="text-[10px] text-amber-500 mt-1 italic">Inherited from tier</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-amber-500/10 pt-6">
                    <Button variant="ghost" onClick={clearOverrides} disabled={overrides.length === 0}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Tier Defaults
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving Overrides..." : "Apply Overrides"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TeamModulesView;
