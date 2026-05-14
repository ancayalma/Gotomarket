import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import { ElevenLabsAgentEditor } from "@/app/admin/(dashboard)/integrations/_components/ElevenLabsAgentEditor";
import Container from "@/app/(routes)/components/ui/Container";

/**
 * Platform-only Voice AI Configuration page.
 * Only accessible to platform admins (SUPER_ADMIN, OWNER, PLATFORM_ADMIN, or global admin).
 * Controls the default ElevenLabs agent used across all tenants.
 */
export default async function VoiceConfigPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId) redirect("/");

    // Gate to platform admins only
    const user = (session as any)?.user;
    const role = (user?.team_role || "").toUpperCase().trim();
    const isPlatformAdmin = teamInfo.isGlobalAdmin
        || ["SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(role);

    if (!isPlatformAdmin) {
        redirect("/admin");
    }

    return (
        <Container>
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Voice AI Configuration</h2>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Platform Admin
                </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
                Configure the default ElevenLabs AI agent used for outbound calls across all tenants.
                Individual tenants can override with their own agent through Integrations → Voice & Telephony.
            </p>

            <ElevenLabsAgentEditor />
        </Container>
    );
}
