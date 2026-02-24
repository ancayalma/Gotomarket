
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import { SurgeSettingsForm } from "./_components/SurgeSettingsForm";
import { MercurySettingsForm } from "./_components/MercurySettingsForm";
import { CloudflareSettingsForm } from "./_components/CloudflareSettingsForm";
import { ShopifySettingsForm, WooCommerceSettingsForm } from "./_components/ECommerceSettingsForm";
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
        <div className="flex-1 space-y-8 p-8 pt-6">
            <LearnLink
                tab="admin"
                overviewTitle="External Service Integrations"
                overviewWhat="The configuration terminal for linking your CRM to third-party providers like payment gateways (Mercury/Surge) and infrastructure security (Cloudflare)."
                overviewWhy="Authenticating these services here unlocks automated financial tracking and advanced bot protection across your entire team's LeadGen forms and outreach sequences."
                overviewHow="Locate your API keys or Access Tokens in the provider's dashboard, paste them into the appropriate card below, and hit 'Save Integration' to activate the link."
            />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
                    <p className="text-sm text-muted-foreground mt-1">Connect your CRM to external services for payments, commerce, and security.</p>
                </div>
            </div>

            {/* Payments & E-Commerce */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold tracking-tight">Payments & E-Commerce</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Crypto + Inventory
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 -mt-2">Accept payments and manage product inventory in one platform. Products sync bidirectionally.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    <SurgeSettingsForm initialData={integration} />
                </div>
            </div>

            {/* Banking & Invoicing */}
            <div className="pt-2 border-t border-primary/10">
                <div className="flex items-center gap-3 mb-4 pt-4">
                    <h3 className="text-xl font-semibold tracking-tight">Banking & Invoicing</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Payments Only
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 -mt-2">Connect your banking provider for payment processing and financial tracking.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    <MercurySettingsForm initialData={integration} />
                </div>
            </div>

            {/* Security */}
            <div className="pt-2 border-t border-primary/10">
                <div className="flex items-center gap-3 mb-4 pt-4">
                    <h3 className="text-xl font-semibold tracking-tight">Security & Bot Protection</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Captcha
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 -mt-2">Protect your LeadGen forms and outreach sequences from spam and bot traffic.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    <CloudflareSettingsForm
                        teamId={teamInfo.teamId}
                        initialConfig={captchaConfig}
                    />
                </div>
            </div>

            {/* E-Commerce Platforms */}
            <div className="pt-2 border-t border-primary/10">
                <div className="flex items-center gap-3 mb-4 pt-4">
                    <h3 className="text-xl font-semibold tracking-tight">E-Commerce Platforms</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Product Sync
                    </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 -mt-2">Connect your online stores to import and sync product catalogs. Edits in the CRM auto-push back to each store.</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                    <ShopifySettingsForm initialData={integration} />
                    <WooCommerceSettingsForm initialData={integration} />
                </div>
            </div>
        </div>
    );
}
