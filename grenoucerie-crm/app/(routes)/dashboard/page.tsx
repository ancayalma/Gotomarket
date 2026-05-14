import React, { Suspense } from "react";
import Container from "../components/ui/Container";
import DashboardRoleManager from "../crm/dashboard/_components/DashboardRoleManager";
import SuspenseLoading from "@/components/loadings/suspense";
import { LearnLink } from "@/components/ui/LearnLink";

const DashboardPage = async () => {
  return (
    <Container>
      <LearnLink
        tab="dashboard"
        overviewTitle="Overview Dashboard"
        overviewWhat="The central aggregate view of all active company operations, synthesizing recent leads, impending tasks, and high-level health metrics."
        overviewWhy="Allows managers to take a rapid pulse of organizational health. Instead of checking tables individually, immediate fires or pipeline blockages surface here."
        overviewHow="From here you can customize widget placement, click through charts into associated reports, or approve pending operational workflows queued up by your team."
      />
      <Suspense fallback={<SuspenseLoading />}>
        <DashboardRoleManager />
      </Suspense>
    </Container>
  );
};

export default DashboardPage;
