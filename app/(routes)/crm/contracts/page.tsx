import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getContractsWithIncludes } from "@/actions/crm/get-contracts";
import ContractsView from "../components/ContractsView";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

const ContractsPage = async () => {
  const crmData = await getAllCrmData();
  const contracts = await getContractsWithIncludes();
  return (
    <Container
      title="Contracts"
      description={"Everything you need to know about your contracts"}
    >
      <UpgradeGate featureId="contracts" title="Contracts Locked" description="Contract management requires a Growth plan or higher.">
      <LearnLink
        tab="contracts"
        overviewTitle="Contracts Management"
        overviewWhat="A centralized secure vault for all generated and uploaded legal documents tied to your CRM Accounts."
        overviewWhy="Legal signatures require strict auditing. This system ensures active proposals and binding agreements remain securely linked to the specific entities and people who signed them."
        overviewHow="Select 'Add' to upload a new executed document, and associate it with a known company footprint."
      />
      <Suspense fallback={<SuspenseLoading />}>
        <ContractsView crmData={crmData} data={contracts} />
      </Suspense>
      </UpgradeGate>
    </Container>
  );
};

export default ContractsPage;
