
import { Suspense } from "react";
import Container from "../../components/ui/Container";
import ProjectCalendarView from "@/app/(routes)/projects/calendar/components/ProjectCalendarView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { LearnLink } from "@/components/ui/LearnLink";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/");
    }

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_role: true }
    });

    return (
        <Container
            title="Calendar"
            description="Manage your tasks and schedule events."
        >
            <LearnLink
                tab="calendar"
                overviewTitle="Tactical Command: Temporal Intelligence"
                overviewWhat="The core engine for strategic mission planning. It transforms raw CRM data into an actionable temporal grid, integrating project milestones, lead follow-ups, and operational tasks."
                overviewWhy="Mission success depends on anticipating temporal conflicts. By centralizing all time-bound data, you can optimize squad deployment, prevent objective overlap, and maintain high-fidelity operational tempo."
                overviewHow="Leverage the AI Energy Pulse for real-time load forecasting. Use 'Prep for Mission' on any objective to generate an intelligence briefing. Optimize timelines using high-speed drag-and-drop rescheduling."
            />
            <Suspense fallback={<div>Loading calendar...</div>}>
                <ProjectCalendarView userId={session.user.id} />
            </Suspense>
        </Container>
    );
}
