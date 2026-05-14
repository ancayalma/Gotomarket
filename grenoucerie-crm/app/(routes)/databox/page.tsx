import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import React from "react";
import Container from "../components/ui/Container";
import { LearnLink } from "@/components/ui/LearnLink";

type Props = {};

const CrmPage = (props: Props) => {
  return (
    <Container
      title="Databox"
      description={
        "Everything you need to know about Databox alias Datové schránky"
      }
    >
      <LearnLink
        tab="databox"
        overviewTitle="Official Databox Integration"
        overviewWhat="The secure gateway for managing Czech 'Datové schránky' official government communications directly within your CRM."
        overviewWhy="Allows your legal and account teams to receive and respond to official government notices without leaving the CRM environment, ensuring that deadlines and compliance requirements are never missed."
        overviewHow="Authenticate your Databox credentials in the integration settings. Once linked, you can scan for new messages, download official PDFs, and link them directly to the relevant Account or Case record."
      />
      <div>Module content here</div>
    </Container>
  );
};

export default CrmPage;
