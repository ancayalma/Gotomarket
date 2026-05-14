"use client";

import { useState } from "react";
import axios from "axios";
import { Clock, Mail, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

const SCHEDULE_PRESETS = {
    "daily_9am": { label: "Daily at 9:00 AM", cron: "0 9 * * *" },
    "weekdays_9am": { label: "Weekdays at 9:00 AM", cron: "0 9 * * 1-5" },
    "weekly_monday": { label: "Weekly on Monday at 9:00 AM", cron: "0 9 * * 1" },
    "weekly_friday": { label: "Weekly on Friday at 5:00 PM", cron: "0 17 * * 5" },
    "biweekly": { label: "Every 2 Weeks on Monday", cron: "0 9 1,15 * *" },
    "monthly_first": { label: "Monthly on the 1st at 9:00 AM", cron: "0 9 1 * *" },
    "quarterly": { label: "Quarterly (Jan, Apr, Jul, Oct 1st)", cron: "0 9 1 1,4,7,10 *" },
} as const;

const TIMEZONES = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Toronto", "America/Sao_Paulo", "Europe/London", "Europe/Paris",
    "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai",
    "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

interface ReportScheduleModalProps {
    reportId: string;
    reportTitle: string;
    initialSchedule?: {
        schedule_enabled: boolean;
        schedule_cron: string | null;
        schedule_recipients: string[];
        schedule_format: string | null;
        schedule_timezone: string | null;
    };
    onScheduled?: () => void;
}

export default function ReportScheduleModal({ reportId, reportTitle, initialSchedule, onScheduled }: ReportScheduleModalProps) {
    const [open, setOpen] = useState(false);
    const [enabled, setEnabled] = useState(initialSchedule?.schedule_enabled ?? false);
    const [presetKey, setPresetKey] = useState<string>("weekly_monday");
    const [recipients, setRecipients] = useState(initialSchedule?.schedule_recipients?.join(", ") || "");
    const [format, setFormat] = useState(initialSchedule?.schedule_format || "HTML");
    const [timezone, setTimezone] = useState(initialSchedule?.schedule_timezone || "America/Chicago");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const recipientList = recipients.split(",").map(e => e.trim()).filter(Boolean);
        if (enabled && recipientList.length === 0) {
            toast.error("Add at least one recipient email");
            return;
        }

        setSaving(true);
        try {
            const preset = SCHEDULE_PRESETS[presetKey as keyof typeof SCHEDULE_PRESETS];
            await axios.post("/api/reports/scheduled", {
                reportId,
                schedule_enabled: enabled,
                schedule_cron: preset?.cron || "0 9 * * 1",
                schedule_recipients: recipientList,
                schedule_format: format,
                schedule_timezone: timezone,
            });
            toast.success(enabled ? "Report schedule saved" : "Schedule disabled");
            setOpen(false);
            onScheduled?.();
        } catch {
            toast.error("Failed to save schedule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Schedule
                    {initialSchedule?.schedule_enabled && <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] ml-1">Active</Badge>}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Schedule Report Delivery
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="text-sm text-muted-foreground">
                        <span className="text-white font-medium">{reportTitle}</span> will be emailed automatically on the chosen schedule.
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className="text-sm">Enable Scheduled Delivery</Label>
                        <Switch checked={enabled} onCheckedChange={setEnabled} />
                    </div>

                    {enabled && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Frequency</Label>
                                <Select value={presetKey} onValueChange={setPresetKey}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SCHEDULE_PRESETS).map(([key, { label }]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Timezone</Label>
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map(tz => (
                                            <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Recipients (comma-separated)
                                </Label>
                                <Input
                                    placeholder="email1@example.com, email2@example.com"
                                    value={recipients}
                                    onChange={e => setRecipients(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Format</Label>
                                <Select value={format} onValueChange={setFormat}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HTML">HTML Email</SelectItem>
                                        <SelectItem value="PDF">PDF Attachment</SelectItem>
                                        <SelectItem value="CSV">CSV Attachment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        {saving ? "Saving..." : "Save Schedule"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
