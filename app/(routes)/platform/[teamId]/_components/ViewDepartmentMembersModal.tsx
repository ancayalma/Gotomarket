"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, UserMinus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromDepartment } from "@/actions/departments/assign-to-department";
import { updateMemberRole } from "@/actions/teams/member-actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserModulesModal } from "./UserModulesModal";
import { TeamChangeRoleModal, RoleOption } from "./TeamChangeRoleModal";

// Define base roles available to all teams
const BASE_ROLES: RoleOption[] = [
    {
        value: "ADMIN",
        label: "Admin",
        description: "Full access to manage company settings and members.",
        icon: Shield,
    },
    {
        value: "MEMBER",
        label: "Member",
        description: "Can access standard features and modules.",
        icon: Mail,
    },
    {
        value: "VIEWER",
        label: "Viewer",
        description: "Read-only access.",
        icon: Mail,
    }
];

interface Member {
    id: string;
    name: string | null;
    email: string;
    team_role: string | null;
    avatar?: string | null;
}

interface ViewDepartmentMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentName: string;
    members: Member[];
    isSuperAdmin?: boolean;
    departmentAllowedModules?: string[];
}

export function ViewDepartmentMembersModal({
    isOpen,
    onClose,
    departmentName,
    members,
    isSuperAdmin = false,
    departmentAllowedModules = []
}: ViewDepartmentMembersModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [userForModules, setUserForModules] = useState<Member | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);

    const handleRoleUpdate = async (userId: string, role: string) => {
        try {
            const res = await updateMemberRole(userId, role);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Role updated");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        setIsLoading(userId);
        try {
            const result = await removeFromDepartment(userId);
            if (result.success) {
                toast.success("Member removed from department");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to remove member from department");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">Department Members</DialogTitle>
                        <DialogDescription>
                            Members of {departmentName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {members.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No members in this department.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => {
                                    const initials = (member.name || "")
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={member.avatar || undefined} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {initials || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">
                                                            {member.name || "Unknown"}
                                                        </span>
                                                        {member.team_role === "ADMIN" && (
                                                            <Badge variant="secondary" className="text-[10px] h-4">
                                                                Admin
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center truncate">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {isSuperAdmin && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 text-muted-foreground hover:text-primary"
                                                        onClick={() => { setSelectedMember(member); setRoleModalOpen(true); }}
                                                        title="Change Role"
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 text-muted-foreground hover:text-primary"
                                                        onClick={() => setUserForModules(member)}
                                                        title="Configure Modules"
                                                    >
                                                        <Layers className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        disabled={isLoading === member.id}
                                                        title="Remove from Department"
                                                    >
                                                        {isLoading === member.id ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        ) : (
                                                            <UserMinus className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Modules Modal */}
            {userForModules && (
                <UserModulesModal
                    isOpen={!!userForModules}
                    onClose={() => setUserForModules(null)}
                    userId={userForModules.id}
                    userName={userForModules.name || userForModules.email}
                    departmentAllowedModules={departmentAllowedModules}
                />
            )}

            {/* Change Role Modal */}
            {selectedMember && (
                <TeamChangeRoleModal
                    isOpen={roleModalOpen}
                    onClose={() => { setRoleModalOpen(false); setSelectedMember(null); }}
                    memberId={selectedMember.id}
                    memberName={selectedMember.name || selectedMember.email}
                    currentRole={selectedMember.team_role || "MEMBER"}
                    onConfirm={handleRoleUpdate}
                    allowedRoles={BASE_ROLES}
                />
            )}
        </>
    );
}
