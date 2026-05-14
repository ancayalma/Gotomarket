import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import { getQuotes } from "@/actions/crm/quotes";
import QuotesClient from "./components/QuotesClient";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

export const metadata = {
    title: "Quotes | CRM",
    description: "Manage your sales quotes and proposals."
};

export default async function QuotesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const quotes = await getQuotes();

    return (
        <Container
            title="Quotes & Proposals"
            description="View and manage all customer quotes and status tracking."
        >
            <UpgradeGate featureId="quotes" title="Quotes & Proposals Locked" description="Quote builder requires a Growth plan or higher.">
            <LearnLink
                tab="quotes"
                overviewTitle="Quote Builder"
                overviewWhat="The central staging ground for designing, sending, and tracking digital sales proposals tied to your CRM ecosystem."
                overviewWhy="Provides a unified interface to present dynamic pricing and formal terms to clients. Quotes seamlessly update the deal's forecast value when tied to an active opportunity."
                overviewHow="Click 'Create Quote' to build a new pricing table, or manage the status of existing draft, sent, or rejected proposals."
            />
            <QuotesClient initialQuotes={JSON.parse(JSON.stringify(quotes))} />
            </UpgradeGate>
        </Container>
    );
}
