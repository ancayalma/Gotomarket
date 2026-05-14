import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../../components/ui/Container";
import { getProducts } from "@/actions/crm/products";
import { prismadb } from "@/lib/prisma";
import { LearnLink } from "@/components/ui/LearnLink";
import QuoteBuilderClient from "./components/QuoteBuilderClient";

export const metadata = {
    title: "Quote Builder | CRM",
    description: "Create professional sales quotes with guided configuration."
};

export default async function QuoteBuilderPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as any).team_id;

    // Fetch necessary data for the builder
    const [products, accounts, contacts, leads] = await Promise.all([
        getProducts(),
        prismadb.crm_Accounts.findMany({ where: { team_id: teamId }, select: { id: true, name: true } }),
        prismadb.crm_Contacts.findMany({ where: { team_id: teamId }, select: { id: true, first_name: true, last_name: true, accountsIDs: true } }),
        prismadb.crm_Leads.findMany({ where: { team_id: teamId }, select: { id: true, firstName: true, lastName: true, accountsIDs: true } })
    ]);

    return (
        <Container
            title="Create Sales Quote"
            description="Configure products, quantities, and discounts to generate a new proposal."
        >
            <LearnLink
                tab="quotes"
                overviewTitle="Precision Quote Builder"
                overviewWhat="The core engine for generating production-grade sales proposals, enabling you to configure line items, apply targeted discounts, and finalize internal terms."
                overviewWhy="Detailed quoting ensures financial accuracy and legal compliance before a signature is requested. This stage converts opportunity interest into a concrete, actionable contract."
                overviewHow="Search and select an account to unlock associated contacts/leads. Configure your products below, add internal summary notes, and hit 'Deploy Proposal' to finalize the draft."
            />
            <QuoteBuilderClient
                products={JSON.parse(JSON.stringify(products))}
                initialAccounts={JSON.parse(JSON.stringify(accounts))}
                initialContacts={JSON.parse(JSON.stringify(contacts))}
                initialLeads={JSON.parse(JSON.stringify(leads))}
            />
        </Container>
    );
}
