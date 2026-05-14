import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkflows } from "@/actions/crm/workflows";
import { WorkflowList } from "./components/WorkflowList";
import { CreateWorkflowDialog } from "./components/CreateWorkflowDialog";
import { Workflow, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export const metadata = {
    title: "FlowState | Visual Automation",
    description: "Visual builder for automating CRM processes with FlowState"
};

import { MermaidEditor } from "./components/MermaidEditor";
import ExecutionHistoryPanel from "./components/ExecutionHistoryPanel";

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const awaitedSearchParams = await searchParams;
    const isEditorView = awaitedSearchParams?.view === "editor";
    const isHistoryView = awaitedSearchParams?.view === "history";

    // Get user's team_id from session or user record
    const teamId = (session.user as { team_id?: string }).team_id;
    const workflows = await getWorkflows(teamId);

    return (
        <UpgradeGate featureId="workflows" title="FlowState Automation Locked" description="Visual workflow automation requires an upgraded workspace plan.">
            <div className="flex flex-col h-full bg-[#06080a]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-white/5 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">
                                    FlowState
                                </h1>
                                <p className="text-muted-foreground/80 mt-2 text-base font-medium tracking-wide italic border-l-2 border-primary/30 pl-4">
                                    Visual workflow automation for your CRM
                                </p>
                            </div>
                        </div>
                        {workflows.length > 0 && (
                            <CreateWorkflowDialog teamId={teamId || ""}>
                                <Button className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                                    <Plus className="h-4 w-4" />
                                    New FlowState
                                </Button>
                            </CreateWorkflowDialog>
                        )}
                    </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-6 overflow-auto pb-36 md:pb-6">
                    {workflows.length > 0 ? (
                        <WorkflowList workflows={workflows} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="p-4 bg-muted/10 border border-white/5 shadow-2xl rounded-full mb-4">
                                <Workflow className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-white">No FlowStates yet</h2>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Create your first FlowState to automate repetitive tasks like
                                sending follow-up emails, creating tasks, or notifying your team.
                            </p>
                            <CreateWorkflowDialog teamId={teamId || ""}>
                                <Button size="lg" className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                                    <Plus className="h-5 w-5" />
                                    Create Your First FlowState
                                </Button>
                            </CreateWorkflowDialog>
                        </div>
                    )}
                </div>

                <LearnLink
                    tab="workflows"
                    overviewTitle="FlowState Automation"
                    overviewWhat="The central dashboard for designing 'if-this-then-that' style automated workflows tied to your CRM."
                    overviewWhy="Removes manual data entry. By configuring a FlowState, you guarantee that standard operating procedures—like sending an email quote when a deal reaches the final stage—execute without human intervention."
                    overviewHow="Create a new workflow, define triggers (like 'Lead Status Changed'), and stack automated Actions below it."
                />
            </div>
        </UpgradeGate>
    );
}
