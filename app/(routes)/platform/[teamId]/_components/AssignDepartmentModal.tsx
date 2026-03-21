"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Building2, Check, X, Shield, User, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Department {
    id: string;
    name: string;
    slug: string;
    _count?: { members: number };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    teamId: string;
    currentDepartmentId?: string | null;
}

export function AssignDepartmentModal({ isOpen, onClose, userId, userName, teamId, currentDepartmentId }: Props) {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selected, setSelected] = useState<string | null>(currentDepartmentId || null);
    const [selectedRole, setSelectedRole] = useState("MEMBER");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (isOpen && teamId) {
            setIsFetching(true);
            setSelected(currentDepartmentId || null);
            setSelectedRole("MEMBER");
            fetch(`/api/teams/${teamId}/departments`)
                .then((res) => res.json())
                .then((data) => {
                    setDepartments(data.departments || []);
                })
                .catch(() => toast.error("Failed to load departments"))
                .finally(() => setIsFetching(false));
        }
    }, [isOpen, teamId, currentDepartmentId]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/department`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    departmentId: selected,
                    role: selectedRole,
                    organizationId: teamId,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Failed to assign department");
            } else {
                toast.success(selected ? `${userName} assigned to department` : `${userName} moved to organization level`);
                onClose();
                router.refresh();
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                        Assign Department
                    </DialogTitle>
                    <DialogDescription>
                        Choose a department for <strong>{userName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {isFetching ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                                Loading departments...
                            </div>
                        ) : departments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
                                <Building2 className="w-8 h-8 opacity-50" />
                                <p>No departments created yet.</p>
                                <p className="text-xs">Create departments from the Departments tab first.</p>
                            </div>
                        ) : (
                            <>
                                {/* Unassigned option — return to org level */}
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 ${
                                        selected === null
                                            ? "bg-primary/10 border-primary/40 shadow-sm"
                                            : "bg-card/50 border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                            selected === null ? "bg-primary text-primary-foreground" : "bg-muted"
                                        }`}>
                                            <X className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">No Department</p>
                                            <p className="text-xs text-muted-foreground">Organization level only</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        selected === null ? "border-primary bg-primary" : "border-muted-foreground/30"
                                    }`}>
                                        {selected === null && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                </button>

                                {departments.map((dept) => {
                                    const isActive = selected === dept.id;
                                    return (
                                        <button
                                            key={dept.id}
                                            type="button"
                                            onClick={() => setSelected(dept.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 ${
                                                isActive
                                                    ? "bg-primary/10 border-primary/40 shadow-sm"
                                                    : "bg-card/50 border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                                                }`}>
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{dept.name}</p>
                                                    <p className="text-xs text-muted-foreground">{dept.slug}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {dept._count && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {dept._count.members} members
                                                    </Badge>
                                                )}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                }`}>
                                                    {isActive && <Check className="w-3 h-3 text-primary-foreground" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Role selection — only shown when assigning to a department */}
                    {selected && (
                        <div className="space-y-2 border rounded-md p-4 bg-muted/20 animate-in fade-in-0 slide-in-from-top-2">
                            <label className="text-sm font-medium">Department Role</label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-amber-500" />
                                            <span>Department Admin</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="MEMBER">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <span>Member</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="VIEWER">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-slate-500" />
                                            <span>Viewer</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {selectedRole === "ADMIN" && "Can manage department settings and members."}
                                {selectedRole === "MEMBER" && "Standard access to department resources."}
                                {selectedRole === "VIEWER" && "Read-only access to department resources."}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || isFetching || departments.length === 0}>
                        {isLoading ? "Saving..." : "Save Assignment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
