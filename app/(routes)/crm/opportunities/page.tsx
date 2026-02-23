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


        <Suspense fallback={<SuspenseLoading />}>
          <OpportunitiesView crmData={crmData} data={opportunities} />
        </Suspense>

        <LearnLink
          tab="opportunities"
          overviewTitle="Pipeline Opportunities"
          overviewWhat="The core revenue-tracking table mapping out active deals, their associated stages, projected values, and closing probabilities."
          overviewWhy="Essential for financial forecasting. Opportunities track the actual revenue potential, tying qualified Leads to structured negotiation stages."
          overviewHow="Directly manage your sales pipeline. Link opportunities to Leads or Accounts, move them through custom sales stages, and track deal velocity."
        />
      </div>
    </Container>
  );
};

export default AccountsPage;
