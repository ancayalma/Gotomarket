import React, { Suspense } from "react";
import SearchResult from "./components/SearchResult";
import SuspenseLoading from "@/components/loadings/suspense";
import { LearnLink } from "@/components/ui/LearnLink";

const FulltextPage = () => {
  return (
    <>
      <LearnLink
        tab="search"
        overviewTitle="Global Intelligence Search"
        overviewWhat="The high-speed indexing engine that scans every field in the CRM—including account names, contact emails, and case notes—to find the data you need."
        overviewWhy="As a CRM grows, manually navigating menus becomes a bottleneck. The Global Search allows you to jump directly to deep records from anywhere in the platform."
        overviewHow="Type your query into the top navigation bar or the search block below. Use the category filters to refine results to specific entities like 'Accounts only' or 'Leads only'."
      />
      <Suspense fallback={<SuspenseLoading />}>
        <SearchResult />
      </Suspense>
    </>
  );
};

export default FulltextPage;
