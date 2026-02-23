
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
                overviewTitle="Enterprise Scheduling"
                overviewWhat="A unified temporal view of all CRM-wide events, task deadlines, and project milestones."
                overviewWhy="Centralizing your schedule ensures that project bottlenecks and overlapping commitments are visible at a glance, allowing for better resource allocation."
                overviewHow="Synced directly with your project tasks and personal events. Click any entry to view full record details or adjust deadlines in real-time."
            />
            <Suspense fallback={<div>Loading calendar...</div>}>
                <ProjectCalendarView userId={session.user.id} />
            </Suspense>
        </Container>
    );
}
