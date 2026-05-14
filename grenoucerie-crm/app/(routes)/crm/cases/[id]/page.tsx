import { getCase } from "@/actions/crm/cases/get-case";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CaseDetailClient from "./components/CaseDetailClient";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export const dynamic = "force-dynamic";

interface CaseDetailPageProps {
    params: Promise<{ id: string }>;
}

const CaseDetailPage = async ({ params }: CaseDetailPageProps) => {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/login");

    const caseData = await getCase(id);
    if (!caseData) return redirect("/crm/cases");

    // Get team members for reassignment
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_id: true },
    });

    let teamMembers: any[] = [];
    if (user?.team_id) {
        teamMembers = await prismadb.users.findMany({
            where: { team_id: user.team_id },
            select: { id: true, name: true, email: true, avatar: true },
        });
    }

    return (
        <UpgradeGate featureId="cases" title="Service Console Locked" description="The helpdesk and case management module requires a Growth plan or higher.">
            <>
                <LearnLink
                    tab="cases"
                    overviewTitle="Service Case Management"
                    overviewWhat="A comprehensive view of a specific customer issue, including communication threads, severity levels, and resolution status."
                    overviewWhy="Detailed tracking ensures that customer problems don't get 'lost' in emails. By logging every update here, the entire organization knows exactly where a ticket stands at any moment."
                    overviewHow="Use the 'Status' dropdown to move a case from New to Resolved. Add comments to collaborate with colleagues, and use the 'Related' tab to link this issue to a specific Account or Contact for long-term tracking."
                />
                <CaseDetailClient
                    caseData={caseData}
                    currentUserId={session.user.id}
                    teamMembers={teamMembers}
                />
            </>
        </UpgradeGate>
    );
};

export default CaseDetailPage;
