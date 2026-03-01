
import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import SalesInsights from "../components/SalesInsights";
import SuspenseLoading from "@/components/loadings/suspense";
import { LearnLink } from "@/components/ui/LearnLink";

const SalesInsightsPage = async () => {
    return (
        <Container
            title="Sales Intelligence"
            description="Deep dive into your revenue performance, win rates, and sales pipeline health."
        >
            <LearnLink
                tab="insights"
                overviewTitle="Sales Intelligence Dashboard"
                overviewWhat="A strategic view of your sales organization's health, covering weighted pipeline values, cycle times, and conversion funnels."
                overviewWhy="Traditional dashboards show what happened; Intelligence shows what is LIKELY to happen. It helps you forecast revenue with win-rate adjusted metrics."
                overviewHow="Monitor your 'Sales Velocity' to identify bottlenecks in your funnel. Use 'Weighted Pipeline' to set realistic monthly targets based on deal probabilities."
            />

            <Suspense fallback={<SuspenseLoading />}>
                <SalesInsights />
            </Suspense>
        </Container>
    );
};

export default SalesInsightsPage;
