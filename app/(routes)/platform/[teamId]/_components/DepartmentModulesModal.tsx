"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Layers, Check, X as XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CRM_MODULES } from "@/lib/role-permissions";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    departmentId: string;
    departmentName: string;
}

export function DepartmentModulesModal({ isOpen, onClose, departmentId, departmentName }: Props) {
    const [selected, setSelected] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Get top-level modules only for simplicity
    const topLevelModules = CRM_MODULES.map((m) => ({ id: m.id, name: m.name, description: m.description }));

    useEffect(() => {
        if (isOpen && departmentId) {
            setIsFetching(true);
            fetch(`/api/departments/${departmentId}/modules`)
                .then((res) => res.json())
                .then((data) => {
                    setSelected(data.modules || []);
                })
                .catch(() => toast.error("Failed to load modules"))
                .finally(() => setIsFetching(false));
        }
    }, [isOpen, departmentId]);

    const toggleModule = (moduleId: string) => {
        setSelected((prev) =>
            prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
        );
    };

    const selectAll = () => setSelected(topLevelModules.map((m) => m.id));
    const clearAll = () => setSelected([]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/departments/${departmentId}/modules`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modules: selected }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to save modules");
            } else {
                toast.success(`Module access updated for ${departmentName}`);
                onClose();
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                        Department Modules
                    </DialogTitle>
                    <DialogDescription>
                        Configure which modules are available to <strong>{departmentName}</strong> personnel.
                        Department admins can further refine per-member access within this selection.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                            {selected.length} / {topLevelModules.length} modules enabled
                        </Badge>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                                Select All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                        {isFetching ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                                Loading modules...
                            </div>
                        ) : (
                            topLevelModules.map((mod) => {
                                const isActive = selected.includes(mod.id);
                                return (
                                    <button
                                        key={mod.id}
                                        type="button"
                                        onClick={() => toggleModule(mod.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 ${
                                            isActive
                                                ? "bg-primary/10 border-primary/40 shadow-sm"
                                                : "bg-card/50 border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                                                }`}
                                            >
                                                {isActive ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <Layers className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{mod.name}</p>
                                                {mod.description && (
                                                    <p className="text-xs text-muted-foreground">{mod.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                                            }`}
                                        >
                                            {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || isFetching}>
                        {isLoading ? "Saving..." : "Save Module Access"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
