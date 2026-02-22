import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import { LearnLink } from "@/components/ui/LearnLink";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import SuspenseLoading from "@/components/loadings/suspense";
import MyProjectsView from "./_components/MyProjectsView";

export const maxDuration = 300;

const MyProjectsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session) return redirect("/sign-in");

    return (
        <Container
            title="My Projects"
            description={"Projects and lists assigned to you"}
        >
            <LearnLink
                tab="projects"
                overviewTitle="My Projects Overview"
                overviewWhat="A centralized workspace tracking all assigned projects, active lists, and pending tasks connected directly to your profile."
                overviewWhy="By bringing assigned active campaigns and internal task metrics into one portal, you can instantly see where action is required without scanning separate dashboards."
                overviewHow="Use the navigation buttons to toggle views, check timeline bottlenecks via Gantt charts, or drop directly into active Lead Outreach sequences."
            />
            <Suspense fallback={<SuspenseLoading />}>
                <MyProjectsView userId={session.user.id} />
            </Suspense>
        </Container>
    );
};

export default MyProjectsPage;
