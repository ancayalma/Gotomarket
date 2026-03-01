
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import TeamAiSettings from "./_components/TeamAiSettings";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";
import { TeamSubscriptionSettings } from "./_components/TeamSubscriptionSettings";

export default async function TeamSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        include: {
            assigned_team: {
                include: { assigned_plan: { select: { slug: true } } }
            }
        }
    });

    if (!user?.assigned_team) {
        return (
            <Container title="Team Settings" description="Manage your team preferences.">
                <div className="p-4">
                    <p>You are not assigned to any team.</p>
                </div>
            </Container>
        );
    }

    return (
        <Container title="Team Settings" description="Manage your team preferences.">
            <div className="space-y-8">
                <TeamSubscriptionSettings
                    planName={user.assigned_team.assigned_plan?.name || "Free Tier"}
                    planSlug={user.assigned_team.assigned_plan?.slug || user.assigned_team.subscription_plan || "FREE"}
                />
                <TeamAiSettings teamId={user.assigned_team.id} />
                <div className="grid gap-6 md:grid-cols-2">
                    <TeamEmailSettings
                        teamId={user.assigned_team.id}
                        planSlug={user.assigned_team.assigned_plan?.slug || user.assigned_team.subscription_plan || "FREE"}
                    />
                    <EmailDeliveryStats teamId={user.assigned_team.id} />
                </div>
            </div>
        </Container>
    );
}
