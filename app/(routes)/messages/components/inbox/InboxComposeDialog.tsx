"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    PenBox,
    Pencil,
    Send,
} from "lucide-react";

interface TeamMember {
    id: string;
    name: string | null;
    email: string | null;
}

interface InboxComposeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamMembers: TeamMember[];
    currentUserId: string;
    composeToUserId: string;
    composeSubject: string;
    composeBody: string;
    isSending: boolean;
    onToUserChange: (id: string) => void;
    onSubjectChange: (s: string) => void;
    onBodyChange: (b: string) => void;
    onSend: () => void;
    onSaveDraft: () => void;
}

export function InboxComposeDialog({
    open,
    onOpenChange,
    teamMembers,
    currentUserId,
    composeToUserId,
    composeSubject,
    composeBody,
    isSending,
    onToUserChange,
    onSubjectChange,
    onBodyChange,
    onSend,
    onSaveDraft,
}: InboxComposeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl shadow-black/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                            <PenBox className="h-4 w-4 text-indigo-400" />
                        </div>
                        New Message
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Send a message to a team member
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="to" className="text-[12px] text-zinc-400 font-medium">To</Label>
                        <Select value={composeToUserId} onValueChange={onToUserChange}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-[13px] h-9 focus:ring-indigo-500/30">
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {teamMembers
                                    .filter(m => m.id !== currentUserId)
                                    .map((member) => (
                                        <SelectItem key={member.id} value={member.id} className="text-zinc-200 text-[13px] focus:bg-zinc-700 focus:text-white">
                                            {member.name || member.email || "Unknown"}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="subject" className="text-[12px] text-zinc-400 font-medium">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Message subject"
                            value={composeSubject}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-[13px] h-9 placeholder:text-zinc-500 focus-visible:ring-indigo-500/30"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="body" className="text-[12px] text-zinc-400 font-medium">Message</Label>
                        <Textarea
                            id="body"
                            placeholder="Write your message..."
                            rows={8}
                            value={composeBody}
                            onChange={(e) => onBodyChange(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-[13px] placeholder:text-zinc-500 focus-visible:ring-indigo-500/30 resize-none"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between border-t border-zinc-800/60 pt-4">
                    <Button type="button" variant="ghost" onClick={onSaveDraft} disabled={isSending} className="gap-1.5 text-zinc-400 hover:text-zinc-200 text-[12px]">
                        <Pencil className="w-3.5 h-3.5" />
                        Save Draft
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[12px]">
                            Cancel
                        </Button>
                        <Button onClick={onSend} disabled={isSending} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] shadow-lg shadow-indigo-500/20">
                            <Send className="h-3.5 w-3.5" />
                            {isSending ? "Sending..." : "Send Message"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ─── Permanent Delete Confirmation ─── */
interface InboxDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isSubmission: boolean;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function InboxDeleteDialog({
    open,
    onOpenChange,
    isSubmission,
    isDeleting,
    onConfirm,
    onCancel,
}: InboxDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-100">
                        <div className="h-8 w-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                        </div>
                        Delete Forever?
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-[13px]">
                        This action cannot be undone. This will permanently delete the {isSubmission ? "form submission" : "message"} and all its data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="outline" onClick={onCancel} className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[12px]">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="text-[12px]">
                        {isDeleting ? "Deleting..." : "Delete Forever"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
