import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { checkTeamFeature } from "@/lib/subscription";
import { getQuests } from "@/actions/quests/get-quests";
import { getMyQuestProgress } from "@/actions/quests/get-my-quest-progress";
import { getActiveQuestCount } from "@/actions/quests/get-active-quest-count";
import { UpgradeGate } from "@/components/UpgradeGate";
import QuestsPageShell from "./_components/QuestsPageShell";

export default async function QuestsPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return null;

    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: {
            team_role: true,
            team_id: true,
        },
    });

    if (!user?.team_id) return null;

    // Plan gating check
    const team = await prismadb.team.findUnique({
        where: { id: user.team_id },
        select: {
            subscription_plan: true,
        },
    });

    const teamForCheck = {
        subscription_plan: team?.subscription_plan || "FREE",
    };

    const hasAccess = checkTeamFeature(teamForCheck, "quests");

    if (!hasAccess) {
        return (
            <UpgradeGate
                featureId="quests"
                title="Quests — Unlock Team Challenges"
                description="Drive your team's performance with custom quests, sprints, and real-time leaderboards. Available on Basic, Pro, and Enterprise plans."
            >
                <div />
            </UpgradeGate>
        );
    }

    const role = (user.team_role || "VIEWER").trim().toUpperCase();
    const isAdmin = ["SUPER_ADMIN", "OWNER", "ADMIN", "PLATFORM_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(role);

    // Fetch data in parallel
    const [quests, myProgress, activeCount] = await Promise.all([
        getQuests(),
        getMyQuestProgress(),
        getActiveQuestCount(),
    ]);

    return (
        <QuestsPageShell
            quests={quests}
            myProgress={myProgress}
            activeQuestCount={activeCount}
            isAdmin={isAdmin}
            userId={userId}
        />
    );
}
