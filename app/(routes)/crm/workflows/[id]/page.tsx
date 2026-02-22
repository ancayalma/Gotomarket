import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getWorkflow } from "@/actions/crm/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";
import { LearnLink } from "@/components/ui/LearnLink";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
        notFound();
    }

    return (
        <>
            <LearnLink
                tab="workflows"
                overviewTitle="FlowState Canvas"
                overviewWhat="The visual dragging interface for linking event triggers to resulting actions."
                overviewWhy="By representing logic visually, you don't need to write custom code or webhooks to pass data between CRM modules. Just draw the line."
                overviewHow="Drag a Trigger onto the blank canvas (e.g. 'Account Created'), connect it to a Condition/Filter, and drag an Action (e.g. 'Send SMS Welcome') to the end of the chain. Hit 'Save & Activate'."
            />
            <WorkflowEditor workflow={workflow} />
        </>
    );
}
