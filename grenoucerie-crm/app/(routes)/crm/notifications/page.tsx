import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/actions/crm/notifications";
import { NotificationsClient } from "./components/NotificationsClient";
import { Bell } from "lucide-react";
import { Suspense } from "react";

import { LearnLink } from "@/components/ui/LearnLink";

export const metadata = {
    title: "Notifications | CRM",
    description: "Manage your alerts and activity"
};

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const notifications = await getNotifications(true); // Include cleared for the main page archive

    return (
        <div className="flex flex-col h-full">
            <LearnLink
                tab="notifications"
                overviewTitle="Activity Command Center"
                overviewWhat="A persistent log of all system triggers, direct mentions, task assignments, and approval requests."
                overviewWhy="Staying responsive to real-time events is critical for deal velocity. This feed ensures you never miss a stakeholder update or a critical automation status change."
                overviewHow="New alerts appear here and in the nav bar. You can clear individual notifications or 'Clear All' once reviewed to maintain a zero-inbox workflow."
            />
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                        <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-[1.2] py-2 mb-2">
                            Notifications
                        </h2>
                        <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                            Stay up to date with your CRM activity
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div>Loading notifications...</div>}>
                    <NotificationsClient initialNotifications={JSON.parse(JSON.stringify(notifications))} />
                </Suspense>
            </div>
        </div>
    );
}
