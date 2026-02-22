import { Suspense } from "react";

import SuspenseLoading from "@/components/loadings/suspense";

import Container from "../../components/ui/Container";
import OpportunitiesView from "../components/OpportunitiesView";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunitiesFull } from "@/actions/crm/get-opportunities-with-includes";
import ProjectOpportunitiesPanel from "../dashboard/_components/ProjectOpportunitiesPanel";
import { LearnLink } from "@/components/ui/LearnLink";

const AccountsPage = async () => {
  const crmData = await getAllCrmData();
  const opportunities = await getOpportunitiesFull();

  return (
    <Container
      title="Opportunities"
      description={"Everything you need to know about your opportinities"}
    >
      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Project Feature Requests</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Sales can post feature buildouts or commissioned work tied to a specific project. These can be referenced from project tasks.
          </p>
          <div className="mt-2">
            <ProjectOpportunitiesPanel />
          </div>
        </div>

        <Suspense fallback={<SuspenseLoading />}>
          <OpportunitiesView crmData={crmData} data={opportunities} />
        </Suspense>

        <LearnLink
          tab="opportunities"
          overviewTitle="Pipeline Opportunities"
          overviewWhat="The core revenue-tracking table mapping out active deals, their associated stages, projected values, and closing probabilities."
          overviewWhy="Essential for financial forecasting. Opportunities track the actual money on the line, separating general interest (Leads) from structured, ongoing negotiations."
          overviewHow="Filter by pipeline stage or owner. Click 'New Opportunity' to log a deal, attach it to an existing Account, and push it through your custom sales stages."
        />
      </div>
    </Container>
  );
};

export default AccountsPage;
