
import React from "react";
import Container from "../components/ui/Container";
import ListsView from "./components/ListsView";
import { LearnLink } from "@/components/ui/LearnLink";

const ListsPage = () => {
    return (
        <Container title="Lists" description="Manage your lead lists">
            <LearnLink
                tab="lists"
                overviewTitle="Lead List Management"
                overviewWhat="A high-level view of all your segmented lead cohorts. These lists act as the primary containers for organizing prospects before you launch an outreach campaign."
                overviewWhy="Segmenting leads into lists allows for hyper-targeted messaging. Instead of one-size-fits-all emails, you can craft specific 'briefings' for each cohort based on their shared characteristics."
                overviewHow="Click 'New List' to create a manually curated group, or use the 'LeadGen Wizard' in the Accounts tab to automatically populate high-value targets."
            />
            <ListsView />
        </Container>
    );
};

export default ListsPage;
