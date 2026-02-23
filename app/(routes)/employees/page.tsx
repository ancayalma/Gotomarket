import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import React from "react";
import Container from "../components/ui/Container";
import { LearnLink } from "@/components/ui/LearnLink";

type Props = {};

const CrmPage = (props: Props) => {
  return (
    <Container
      title="Employees"
      description={"Everything you need to know about Human Resources"}
    >
      <LearnLink
        tab="employees"
        overviewTitle="Human Resources Hub"
        overviewWhat="The directory for all team members, staff, and contractors active within the CRM ecosystem."
        overviewWhy="Managing large organizations requires a unified view of people and their associated departments. This hub ensures that everyone on the team has the correct profile data and departmental alignment."
        overviewHow="Search through the employee list to find contact details or departmental assignments. Use the Filters to narrow down the view by team or role."
      />
      <div>Module content here</div>
    </Container>
  );
};

export default CrmPage;
