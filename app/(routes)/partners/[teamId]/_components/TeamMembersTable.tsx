// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MoreHorizontal, Shield, User, Trash, Search, Plus, KeyRound, Ban, CheckCircle, Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { updateMemberRole, removeMember, searchUsers, addMember, changePassword, toggleUserStatus } from "@/actions/teams/member-actions";
import { TeamChangeRoleModal, RoleOption } from "./TeamChangeRoleModal";

// Define base roles available to all teams
const BASE_ROLES: RoleOption[] = [
    {
        value: "ADMIN",
        label: "Admin",
        description: "Full access to manage team settings and members.",
        icon: Shield,
    },
    {
        value: "MEMBER",
        label: "Member",
        description: "Can access standard features and modules.",
        icon: User,
    },
];

// Define Platform Admin role
const PLATFORM_ADMIN_ROLE: RoleOption = {
    value: "PLATFORM_ADMIN",
    label: "Platform Admin",
    description: "Full control over the entire platform (Super Admin).",
    icon: Shield,
};


type Member = {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    team_role: string | null;
};

type Props = {
    teamId: string;
    teamSlug: string;
    members: Member[];
    isSuperAdmin?: boolean;
    isGlobalAdmin?: boolean;
    ownerId?: string | null;
};

const TeamMembersTable = ({ teamId, teamSlug, members, isSuperAdmin, isGlobalAdmin, ownerId }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Add Member State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    // Role Change State
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Migration State
    const [migrationOpen, setMigrationOpen] = useState(false);
    const [selectedMigrationMember, setSelectedMigrationMember] = useState<Member | null>(null);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamSlug, setNewTeamSlug] = useState("");

    // Move to Existing Team State
    const [moveExistingOpen, setMoveExistingOpen] = useState(false);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [teamSearchQuery, setTeamSearchQuery] = useState("");
    const [selectedTargetTeamId, setSelectedTargetTeamId] = useState("");
    const [selectedTargetRole, setSelectedTargetRole] = useState("MEMBER");
    const [isFetchingTeams, setIsFetchingTeams] = useState(false);

    const fetchAllTeams = async () => {
        setIsFetchingTeams(true);
        try {
            const { getTeams } = await import("@/actions/teams/get-teams");
            const data = await getTeams();
            setAllTeams(data);
        } catch (error) {
            toast.error("Failed to load teams");
        } finally {
            setIsFetchingTeams(false);
        }
    };

    // Password Reset State
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordChange = async () => {
        if (!selectedUser || !newPassword) return;
        try {
            setIsLoading(true);
            const res = await changePassword(selectedUser, newPassword);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Password updated successfully");
                setPasswordOpen(false);
                setNewPassword("");
                setSelectedUser(null);
            }
        } catch (error) {
            toast.error("Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string | null) => {
        const newStatus = currentStatus === "INACTIVE" ? "ACTIVE" : "INACTIVE";
        try {
            setIsLoading(true);
            const res = await toggleUserStatus(userId, newStatus);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`User ${newStatus === "ACTIVE" ? "Enabled" : "Disabled"}`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, role: string) => {
        try {
            // setIsLoading(true); // Handled by modal
            const res = await updateMemberRole(userId, role);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Role updated");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure? This will remove the user from the team.")) return;
        try {
            setIsLoading(true);
            const res = await removeMember(userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Member removed");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to remove");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length > 2) {
            setSearchLoading(true);
            const users = await searchUsers(val);
            setSearchResults(users);
            setSearchLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleAdd = async (userId: string) => {
        try {
            const res = await addMember(teamId, userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Member added!");
                setAddOpen(false);
                setSearchQuery("");
                setSearchResults([]);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to add");
        }
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Manage users assigned to this team.
                    </CardDescription>
                </div>

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Search for existing system users to add to this team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            <div className="space-y-2 border rounded-md p-2 h-[200px] overflow-y-auto">
                                {searchLoading && <p className="text-sm text-center py-2">Searching...</p>}
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar || undefined} />
                                                <AvatarFallback>{(user.name?.[0] || "U")}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        {user.team_id ? (
                                            <Badge variant="secondary" className="text-xs">In Team</Badge>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => handleAdd(user.id)}>Add</Button>
                                        )}
                                    </div>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && !searchLoading && (
                                    <p className="text-sm text-center py-4 text-muted-foreground">No users found.</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </CardHeader>

            {/* Change Role Modal */}
            {selectedMember && (
                <TeamChangeRoleModal
                    isOpen={roleModalOpen}
                    onClose={() => { setRoleModalOpen(false); setSelectedMember(null); }}
                    memberId={selectedMember.id}
                    memberName={selectedMember.name || "User"}
                    currentRole={selectedMember.team_role || "MEMBER"}
                    onConfirm={handleRoleUpdate}
                    allowedRoles={
                        ["ledger1", "basalthq", "basalt"].includes(teamSlug) && isGlobalAdmin
                            ? [PLATFORM_ADMIN_ROLE, ...BASE_ROLES]
                            : BASE_ROLES
                    }
                />
            )}

            <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for this user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 property-wrapper">
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword((prev) => !prev)}
                                disabled={isLoading}
                            >
                                <Fingerprint className={`h-4 w-4 ${showPassword ? "text-primary" : "text-muted-foreground"}`} />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
                        <Button onClick={handlePasswordChange} disabled={isLoading || !newPassword}>Update Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => {
                        const isOwner = ownerId && member.id === ownerId;
                        return (
                            <div key={member.id} className={`flex items-center justify-between p-4 border rounded-lg ${isOwner ? "bg-amber-500/5 border-amber-500/30" : "bg-card/50"}`}>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={member.avatar || undefined} />
                                        <AvatarFallback>{(member.name || member.email)[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{member.name || "Unknown Name"}</p>
                                            {isOwner && (
                                                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                                                    Owner
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={member.team_role === "PLATFORM_ADMIN" ? "destructive" : member.team_role === "OWNER" ? "default" : member.team_role === "ADMIN" ? "secondary" : "outline"}>
                                        {member.team_role || "MEMBER"}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isLoading}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            {/* Unified Change Role Option */}
                                            {/* Hide for OWNER to prevent accidental changes (System-Wide Protection) */}
                                            {member.team_role !== "OWNER" && (
                                                <DropdownMenuItem onClick={() => { setSelectedMember(member); setRoleModalOpen(true); }}>
                                                    <Shield className="w-4 h-4 mr-2" /> Change Role
                                                </DropdownMenuItem>
                                            )}

                                            {isGlobalAdmin && member.team_role !== "OWNER" && (
                                                <>
                                                    <DropdownMenuItem className="text-blue-600" onClick={() => { setSelectedMigrationMember(member); setMigrationOpen(true); }}>
                                                        <Shield className="w-4 h-4 mr-2" /> Spawn New Team
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-amber-600" onClick={() => {
                                                        setSelectedMigrationMember(member);
                                                        setMoveExistingOpen(true);
                                                        if (allTeams.length === 0) fetchAllTeams();
                                                    }}>
                                                        <Shield className="w-4 h-4 mr-2" /> Move to Team
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleRemove(member.id)}>
                                                <Trash className="w-4 h-4 mr-2" /> Remove from Team
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Admin</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { setSelectedUser(member.id); setPasswordOpen(true); }}>
                                                <KeyRound className="w-4 h-4 mr-2" /> Change Password
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(member.id, (member as any).userStatus)}>
                                                {(member as any).userStatus === "INACTIVE" ? (
                                                    <><CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Enable Account</>
                                                ) : (
                                                    <><Ban className="w-4 h-4 mr-2 text-red-600" /> Disable Account</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}

                    {members.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No members in this team yet.
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Migration Dialog */}
            <Dialog open={migrationOpen} onOpenChange={setMigrationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Spawn New Team</DialogTitle>
                        <DialogDescription>
                            Create a new team/bucket and move {selectedMigrationMember?.name || selectedMigrationMember?.email} to it as the Owner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Team Name</Label>
                            <Input
                                placeholder="e.g. Acme Corp"
                                value={newTeamName}
                                onChange={(e) => {
                                    setNewTeamName(e.target.value);
                                    // Auto-generate slug
                                    if (!newTeamSlug) {
                                        setNewTeamSlug(e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, ""));
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Team Slug / ID</Label>
                            <Input
                                placeholder="e.g. acme-corp"
                                value={newTeamSlug}
                                onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, ""))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMigrationOpen(false)}>Cancel</Button>
                        <Button
                            onClick={async () => {
                                if (!selectedMigrationMember || !newTeamName || !newTeamSlug) return;
                                try {
                                    setIsLoading(true);
                                    const { moveMemberToNewTeam } = await import("@/actions/teams/move-member-to-new-team");
                                    const res = await moveMemberToNewTeam(selectedMigrationMember.id, newTeamName, newTeamSlug);
                                    if (res.error) {
                                        toast.error(res.error);
                                    } else {
                                        toast.success(res.message);
                                        setMigrationOpen(false);
                                        setNewTeamName("");
                                        setNewTeamSlug("");
                                        router.refresh();
                                    }
                                } catch (error) {
                                    toast.error("An error occurred during migration");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading || !newTeamName || !newTeamSlug}
                        >
                            Move to New Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Move to Existing Team Dialog */}
            <Dialog open={moveExistingOpen} onOpenChange={setMoveExistingOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold uppercase tracking-tight">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Move to Existing Team
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Relocate {selectedMigrationMember?.name || selectedMigrationMember?.email} to an existing team bucket.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Team</Label>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Search teams by name or slug..."
                                    value={teamSearchQuery}
                                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                                    className="bg-white/5 h-10 text-sm"
                                />
                                <div className="border border-white/10 rounded-lg h-[180px] overflow-y-auto bg-black/20 backdrop-blur-sm">
                                    {isFetchingTeams ? (
                                        <p className="text-xs text-center py-8 text-muted-foreground">Loading teams...</p>
                                    ) : (
                                        allTeams
                                            .filter(t => t.id !== teamId) // Don't show current team
                                            .filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) || t.slug.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                                            .map(team => (
                                                <div
                                                    key={team.id}
                                                    onClick={() => setSelectedTargetTeamId(team.id)}
                                                    className={`p-3 flex flex-col cursor-pointer transition-all border-b border-white/5 last:border-0 ${selectedTargetTeamId === team.id ? "bg-amber-500/10 border-l-4 border-amber-500" : "hover:bg-white/5"}`}
                                                >
                                                    <span className="text-sm font-bold tracking-tight">{team.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">{team.slug}</span>
                                                </div>
                                            ))
                                    )}
                                    {!isFetchingTeams && allTeams.length > 0 && allTeams.filter(t => t.id !== teamId).filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) || t.slug.toLowerCase().includes(teamSearchQuery.toLowerCase())).length === 0 && (
                                        <p className="text-xs text-center py-8 text-muted-foreground">No matching teams found.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assigned Role</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["ADMIN", "MEMBER"].map(role => (
                                    <Button
                                        key={role}
                                        type="button"
                                        variant={selectedTargetRole === role ? "default" : "outline"}
                                        className={`h-10 text-xs font-bold uppercase tracking-widest transition-all ${selectedTargetRole === role ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-white/10 hover:bg-white/5"}`}
                                        onClick={() => setSelectedTargetRole(role)}
                                    >
                                        {role}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setMoveExistingOpen(false)} disabled={isLoading} className="text-xs h-10">
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!selectedMigrationMember || !selectedTargetTeamId) return;
                                try {
                                    setIsLoading(true);
                                    const { moveMemberToExistingTeam } = await import("@/actions/teams/move-member-to-existing-team");
                                    const res = await moveMemberToExistingTeam(selectedMigrationMember.id, selectedTargetTeamId, selectedTargetRole);
                                    if (res.error) {
                                        toast.error(res.error);
                                    } else {
                                        toast.success(res.message);
                                        setMoveExistingOpen(false);
                                        setSelectedTargetTeamId("");
                                        setTeamSearchQuery("");
                                        router.refresh();
                                    }
                                } catch (error) {
                                    toast.error("An error occurred during transfer");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading || !selectedTargetTeamId}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider h-10 px-8 shadow-lg shadow-amber-500/20"
                        >
                            Complete Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card >
    );
};

export default TeamMembersTable;
