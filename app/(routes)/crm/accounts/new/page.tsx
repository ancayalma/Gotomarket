import { getAllCrmData } from "@/actions/crm/get-crm-data";
import Container from "@/app/(routes)/components/ui/Container";
import { NewAccountFormWrapper } from "./components/NewAccountFormWrapper";

import { LearnLink } from "@/components/ui/LearnLink";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import type { CustomFieldDefinition } from "@/lib/crm/custom-field-defaults";

const NewAccountPage = async () => {
    const { users, industries } = await getAllCrmData();
    const currentUserInfo = await getCurrentUserTeamId();

    let customFieldDefs: CustomFieldDefinition[] = [];
    if (currentUserInfo?.teamId) {
        const team = await prismadb.team.findUnique({
            where: { id: currentUserInfo.teamId },
            select: { custom_field_definitions: true },
        });
        customFieldDefs = ((team as any)?.custom_field_definitions as CustomFieldDefinition[]) || [];
    }

    return (
        <Container
            title="Create New Account"
            description="Add a new company account to your CRM."
        >
            <LearnLink
                tab="accounts"
                overviewTitle="Account Onboarding"
                overviewWhat="The entry point for registering a new organization within the BASALT ecosystem."
                overviewWhy="Properly indexing an account early ensures that all future contacts, deals, and communication threads are correctly grouped from day one."
                overviewHow="Fill out the core legal name, industry, and assigned owner. You can also specify the initial account tier and region to ensure proper sales territory mapping."
            />
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-4xl mx-auto">
                <NewAccountFormWrapper
                    users={users}
                    industries={industries}
                    customFieldDefs={customFieldDefs}
                />
            </div>
        </Container>
    );
};

export default NewAccountPage;
