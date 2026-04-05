"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Shield, BellRing, Mail, Smartphone } from "lucide-react";
import { logUserMetric } from "@/actions/university/log-user-metric";

export function NotificationSettings({ data }: { data: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Placeholder states for future implementation
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [marketingAlerts, setMarketingAlerts] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Simulate saving to backend
            await new Promise(resolve => setTimeout(resolve, 800));
            await logUserMetric("updated_notification_settings");

            toast({
                title: "Settings Saved",
                description: "Your notification preferences have been successfully updated."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update notification settings.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/50">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" /> Email Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Receive daily digests and critical internal messages directly to your inbox.
                        </p>
                    </div>
                    <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/50">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <BellRing className="w-4 h-4 text-emerald-500" /> Push Notifications
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Receive real-time push alerts in the browser when leads are assigned or tasks are updated.
                        </p>
                    </div>
                    <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/50">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-amber-500" /> SMS Alerts
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Receive texts for highly critical assignments (requires mobile number linked).
                        </p>
                    </div>
                    <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-background/50 opacity-80">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-500" /> Marketing & Updates
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Occasional updates on platform features, educational webinars, and new templates.
                        </p>
                    </div>
                    <Switch checked={marketingAlerts} onCheckedChange={setMarketingAlerts} />
                </div>

            </div>
            
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                    {isLoading ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
}
