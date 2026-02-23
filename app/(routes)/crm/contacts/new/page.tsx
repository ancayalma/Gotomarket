import { getAllCrmData } from "@/actions/crm/get-crm-data";
import Container from "@/app/(routes)/components/ui/Container";
import { NewContactFormWrapper } from "./components/NewContactFormWrapper";

import { LearnLink } from "@/components/ui/LearnLink";

const NewContactPage = async () => {
    const { users, accounts } = await getAllCrmData();

    return (
        <Container
            title="Create New Contact"
            description="Add a new contact to your CRM."
        >
            <LearnLink
                tab="contacts"
                overviewTitle="Contact Registry"
                overviewWhat="The primary interface for manually indexing stakeholders, decision-makers, and individual contributors."
                overviewWhy="While 'Accounts' represent companies, 'Contacts' represent the human relationships that drive revenue. Accurate profiles here enable personalized outreach and clear accountability."
                overviewHow="Input the colleague's personal details and link them to an existing Account. You can also assign them to a specific user to ensure lead ownership is clear from the start."
            />
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-4xl mx-auto">
                <NewContactFormWrapper
                    users={users}
                    accounts={accounts}
                />
            </div>
        </Container>
    );
};

export default NewContactPage;
