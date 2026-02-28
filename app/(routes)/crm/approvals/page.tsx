import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovalProcesses, getMyPendingApprovals } from "@/actions/crm/approvals";
import { ApprovalsClient } from "./components/ApprovalsClient";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";
import { LearnLink } from "@/components/ui/LearnLink";

export const metadata = {
    title: "Approval Chains | CRM",
    description: "Create approval chains and manage pending approvals"
};

export default async function ApprovalsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as { team_id?: string }).team_id || "";
    const [processes, pendingApprovals] = await Promise.all([
        getApprovalProcesses(teamId),
        getMyPendingApprovals(teamId),
    ]);

    return (
        <div className="flex flex-col h-full w-full">
            <LearnLink
                tab="approvals"
                overviewTitle="Approval Workflows"
                overviewWhat="A centralized queue for reviewing, rejecting, or signing off on account-related processes."
                overviewWhy="Creating a formal paper trail for account downgrades, discount requests, or feature flags prevents rogue actions and ensures managerial oversight before system changes occur."
                overviewHow="Navigate the Pending tab to review requests awaiting your input, or open the Processes tab to define the actual logic flow for how an approval propagates across the team."
            />
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tight uppercase leading-[1.2] py-2 mb-2">
                            Approval Chains
                        </h2>
                        <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                            Define approval chains and manage pending requests
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div>Loading approvals...</div>}>
                    <ApprovalsClient
                        processes={JSON.parse(JSON.stringify(processes))}
                        pendingApprovals={JSON.parse(JSON.stringify(pendingApprovals))}
                        teamId={teamId}
                        currentUserId={session.user.id}
                    />
                </Suspense>
            </div>
        </div>
    );
}
