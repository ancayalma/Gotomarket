
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import { SurgeSettingsForm } from "./_components/SurgeSettingsForm";
import { MercurySettingsForm } from "./_components/MercurySettingsForm";
import { CloudflareSettingsForm } from "./_components/CloudflareSettingsForm";
import { LearnLink } from "@/components/ui/LearnLink";

export default async function IntegrationsSettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.isAdmin || !teamInfo.teamId) redirect("/");

    const integration = await prismadb.tenant_Integrations.findUnique({
        where: { tenant_id: teamInfo.teamId }
    });

    const captchaConfig = await (prismadb as any).teamCaptchaConfig.findUnique({
        where: { team_id: teamInfo.teamId }
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <LearnLink
                tab="admin"
                overviewTitle="External Service Integrations"
                overviewWhat="The configuration terminal for linking your CRM to third-party providers like payment gateways (Mercury/Surge) and infrastructure security (Cloudflare)."
                overviewWhy="Authenticating these services here unlocks automated financial tracking and advanced bot protection across your entire team's LeadGen forms and outreach sequences."
                overviewHow="Locate your API keys or Access Tokens in the provider's dashboard, paste them into the appropriate card below, and hit 'Save Integration' to activate the link."
            />
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                <SurgeSettingsForm
                    initialData={integration}
                />

                <MercurySettingsForm
                    initialData={integration}
                />

                <CloudflareSettingsForm
                    teamId={teamInfo.teamId}
                    initialConfig={captchaConfig}
                />
            </div>
        </div>
    );
}
