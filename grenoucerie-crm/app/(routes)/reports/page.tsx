export const dynamic = "force-dynamic";

import React from "react";
import Container from "../components/ui/Container";
import ReportsDashboard from "./components/ReportsDashboard";
import { getUsersByMonth } from "@/actions/get-users";
import { getOpportunitiesByMonth } from "@/actions/crm/get-opportunities";
import { getTasksByMonth } from "@/actions/projects/get-tasks";
import { getFinancialsByMonth } from "@/actions/reports/get-financials";

import { getLeadsByMonth } from "@/actions/crm/get-leads";
import { getDepartments } from "@/actions/departments/get-departments";
import { getSavedReports } from "@/actions/reports/get-saved-reports";
import { LearnLink } from "@/components/ui/LearnLink";
import { UpgradeGate } from "@/components/UpgradeGate";

type Props = {};

const ReportsPage = async (props: Props) => {
  // Fetch initial data (defaults to current year in actions if no dates provided)
  const [usersData, oppsData, tasksData, financialsData, leadsData, deptsResult, savedReports] = await Promise.all([
    getUsersByMonth(),
    getOpportunitiesByMonth(),
    getTasksByMonth(),
    getFinancialsByMonth(),
    getLeadsByMonth(),
    getDepartments(),
    getSavedReports()
  ]);

  const departments = deptsResult.success ? deptsResult.departments || [] : [];

  return (
    <UpgradeGate featureId="reports" title="Reports & Analytics Locked" description="Advanced reporting and performance analytics require a Growth plan or higher.">
      <Container
        title="Reports"
        description={
          "Comprehensive analytics overview of your CRM performance."
        }
      >
        <LearnLink
          tab="reports"
          overviewTitle="Performance Analytics"
          overviewWhat="A data visualization engine that transforms raw CRM records into actionable insights regarding revenue, team velocity, and lead conversion rates."
          overviewWhy="Raw data is difficult to interpret at scale. Reports aggregate these data points into charts and tables, allowing you to identify trends and optimize your sales strategy based on historical performance."
          overviewHow="Review the pre-built dashboards for a quick pulse, or build custom reports to drill down into specific departments or date Ranges."
        />
        <div className="pt-5">
          <ReportsDashboard
            usersInitial={usersData}
            oppsInitial={oppsData}
            tasksInitial={tasksData}
            financialsInitial={financialsData}
            leadsInitial={leadsData}
            departments={departments}
            savedReports={savedReports || []}
          />
        </div>
      </Container>
    </UpgradeGate>
  );
};

export default ReportsPage;
