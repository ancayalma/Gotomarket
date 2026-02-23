import { getAllCrmData } from "@/actions/crm/get-crm-data";
import Container from "@/app/(routes)/components/ui/Container";
import { NewOpportunityFormWrapper } from "./components/NewOpportunityFormWrapper";

import { LearnLink } from "@/components/ui/LearnLink";

const NewOpportunityPage = async () => {
    const data = await getAllCrmData();

    return (
        <Container
            title="Create New Opportunity"
            description="Add a new sales opportunity to your CRM."
        >
            <LearnLink
                tab="opportunities"
                overviewTitle="Deal Origination"
                overviewWhat="The starting point for tracking potential revenue and formalizing a sales path with an account."
                overviewWhy="Creating an opportunity allows the system to calculate weighted forecasts and track your sales velocity. It transforms a simple contact into a strategic financial goal."
                overviewHow="Link the deal to an Account and Contact. Set the initial 'Sale Stage' and projected 'Close Date' to ensure your pipeline reporting remains accurate for the executive team."
            />
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-4xl mx-auto">
                <NewOpportunityFormWrapper
                    users={data.users}
                    accounts={data.accounts}
                    contacts={data.contacts}
                    leads={data.leads}
                    salesType={data.saleTypes}
                    saleStages={data.saleStages}
                    boards={data.boards}
                />
            </div>
        </Container>
    );
};

export default NewOpportunityPage;
