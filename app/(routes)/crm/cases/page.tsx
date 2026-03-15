import { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";
import { getCases } from "@/actions/crm/cases/get-cases";
import { getCaseStats } from "@/actions/crm/cases/get-case-stats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import CasesClient from "./components/CasesClient";
import { LearnLink } from "@/components/ui/LearnLink";

export const dynamic = "force-dynamic";

const CasesPage = async (props: { searchParams: Promise<any> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const searchParams = await props.searchParams;
    const view = searchParams.view || "list";

    // Common data
    const [cases, stats] = await Promise.all([
        getCases(),
        getCaseStats(),
    ]);

    // Fetch KB articles if in KB view
    let kbArticles: any[] = [];
    if (view === "kb") {
        kbArticles = await (prismadb as any).knowledgeArticle.findMany({
            where: { status: "PUBLISHED" },
            include: {
                category: { select: { id: true, name: true, icon: true } },
                author: { select: { id: true, name: true } },
                _count: { select: { article_links: true } },
            },
            take: 50,
            orderBy: { helpful_count: "desc" },
        });
    }

    // Get team members for assignment dropdown
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

    // Get contacts and accounts for case creation
    const contacts = await (prismadb as any).crm_Contacts.findMany({
        where: user?.team_id ? { team_id: user.team_id } : {},
        select: { id: true, first_name: true, last_name: true, email: true },
        take: 500,
    });

    const accounts = await (prismadb as any).crm_Accounts.findMany({
        where: user?.team_id ? { team_id: user.team_id } : {},
        select: { id: true, name: true },
        take: 500,
    });

    return (
        <div className="h-full w-full px-4 md:px-6 lg:px-8 pb-36 md:pb-4">
            <LearnLink
                tab="cases"
                overviewTitle="Service Console"
                overviewWhat="The central helpdesk system for tracking customer issues, support requests, and internal operational tickets."
                overviewWhy="Support tickets shouldn't live in a silo. Logging cases directly in the CRM ensures sales and account teams the customer's support health before attempting an upsell."
                overviewHow="Track resolution times, assign cases to specific team members, or build out Knowledge Base articles from frequently resolved tickets."
            />
            <Suspense fallback={<SuspenseLoading />}>
                <CasesClient
                    initialCases={cases || []}
                    stats={stats}
                    teamMembers={teamMembers}
                    contacts={contacts}
                    accounts={accounts}
                    initialView={view}
                    initialArticles={kbArticles}
                />
            </Suspense>
        </div>
    );
};

export default CasesPage;
