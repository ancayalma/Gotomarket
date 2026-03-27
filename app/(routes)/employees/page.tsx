import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import React from "react";
import Container from "../components/ui/Container";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

type Props = {};

import { getEmployees } from "@/actions/get-employees";
import StaffDashboard from "./components/StaffDashboard";
import { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";

const CrmPage = async () => {
  const employees = await getEmployees();

  return (
    <UpgradeGate featureId="employee" title="Staff Management Locked" description="HR and employee management requires a Growth plan or higher.">
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

        <Suspense fallback={<SuspenseLoading />}>
          <StaffDashboard employees={employees} />
        </Suspense>
      </Container>
    </UpgradeGate>
  );
};

export default CrmPage;
