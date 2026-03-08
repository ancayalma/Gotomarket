export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LearnLink } from "@/components/ui/LearnLink";
import CampaignsList from "./_components/CampaignsList";

const CampaignsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) return null;

    return (
        <div className="h-full w-full p-4 md:px-6 lg:px-8">
            <CampaignsList />
            <div className="mt-12">
                <LearnLink
                    tab="campaigns"
                    overviewTitle="Strategic Outreach Campaigns"
                    overviewWhat="The top-level container for your go-to-market strategies. Campaigns group together specific lead lists, messaging themes, and performance goals."
                    overviewWhy="Random outreach is inefficient. Campaigns provide the structural guardrails to ensure that your sales efforts are aligned with specific business objectives and can be measured for ROI."
                    overviewHow="Click 'New Campaign' to initialize a campaign. Define your ICP, select a product focus, and use the LeadGen Wizard to scrape accounts into Lists. Then push Lists to Outreach."
                />
            </div>
        </div>
    );
};

export default CampaignsPage;
