import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";

import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        select: {
            assigned_team: {
                select: {
                    id: true,
                    assigned_plan: { select: { slug: true } },
                    subscription_plan: true,
                }
            }
        }
    });

    const planSlug = user?.assigned_team?.assigned_plan?.slug || user?.assigned_team?.subscription_plan || undefined;

    return (
        <Container title="Company Email Settings" description="Manage email sender identity and system keys for General, Outreach, and Inbound channels.">
            <div className="space-y-8 p-4">
                {user?.assigned_team?.id ? (
                    <>
                        <TeamEmailSettings teamId={user.assigned_team.id} planSlug={planSlug} />
                        <EmailDeliveryStats teamId={user.assigned_team.id} />
                    </>
                ) : (
                    <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                        You do not have a team assigned. Please contact support.
                    </div>
                )}
            </div>
        </Container>
    );
}
