import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import { LearnLink } from "@/components/ui/LearnLink";
import { ApiKeysManager } from "./_components/ApiKeysManager";
import { ApiLogsViewer } from "./_components/ApiLogsViewer";
import { ApiUsageQuota } from "./_components/ApiUsageQuota";
import { ApiDocsViewer } from "./_components/ApiDocsViewer";
import Container from "@/app/(routes)/components/ui/Container";

export default async function ApiKeysSettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.isAdmin || !teamInfo.teamId) redirect("/");

    const team = await prismadb.team.findUnique({
        where: { id: teamInfo.teamId },
        select: {
            slug: true,
            subscription_plan: true,
            assigned_plan: { select: { slug: true, name: true } }
        }
    });

    const activePlan = team?.assigned_plan?.slug || team?.subscription_plan || "FREE";
    const isExempt = team?.slug === "basalthq";
    const hasPlan = activePlan.toUpperCase() !== "FREE" || isExempt;

    // Fetch existing API keys for this tenant
    const apiKeys = await prismadb.crm_ApiKeys.findMany({
        where: { tenant_id: teamInfo.teamId },
        orderBy: { createdAt: "desc" }
    });

    // Fetch API Logs for this tenant
    const apiLogs = await prismadb.crm_ApiLogs.findMany({
        where: { tenant_id: teamInfo.teamId },
        orderBy: { timestamp: "desc" },
        take: 50
    });

    return (
        <Container
            title="API & Webhooks"
            description="Manage API keys and view real-time API request audit logs for Headless configurations."
            fluid
        >
            <LearnLink
                tab="admin"
                overviewTitle="API & Webhooks Management"
                overviewWhat="Generate secure API keys to connect external applications (like your Next.js Headless E-commerce site) to your CRM."
                overviewWhy="This consolidates your business onto a single source of truth. The CRM acts as your Headless API, serving customer profiles, orders, and subscriptions instantly to your custom storefront."
                overviewHow="Click 'Generate New API Key'. Copy the secret key (it will only be shown once) and place it in your external application's .env file."
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="col-span-1 xl:col-span-2">
                    <ApiUsageQuota currentPlan={activePlan} />
                </div>

                {/* Manage Keys & Logs */}
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold tracking-tight">API Keys</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Secure Access
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                                {isExempt ? "Exempt Plan Ready" : hasPlan ? `${activePlan} Plan Ready` : "Select Plan"}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ApiKeysManager initialKeys={apiKeys} teamId={teamInfo.teamId} hasPlan={hasPlan} />
                    </div>
                </div>

                <div className="flex flex-col gap-6 h-full">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold tracking-tight">API Audit Logs</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Real-time
                        </span>
                    </div>
                    <div className="flex-1">
                        <ApiLogsViewer initialLogs={apiLogs} />
                    </div>
                </div>

                {/* Developer Instructions Guide */}
                <div className="col-span-1 xl:col-span-2 bg-[#18181b] border border-primary/20 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 pointer-events-none" />
                    <h3 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 relative z-10">
                        <span className="text-primary">{'< >'}</span> Headless E-Commerce Integration Guide
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-4 relative z-10">
                        <p>To connect your Next.js frontend to this CRM database, follow these steps:</p>
                        <ol className="list-decimal pl-5 space-y-2 text-primary/80">
                            <li><strong>Generate an API Key</strong> below and store it securely in your Next.js <code>.env</code> file as <code>CRM_API_KEY=sk_live_...</code></li>
                            <li><strong>Set up the Surge Webhook</strong> in your Surge account to point to <code>https://your-crm-domain.com/api/webhooks/surge</code> so payments are synced instantly.</li>
                            <li><strong>Authenticate Requests:</strong> When making calls from Next.js to the CRM, include the header <code>Authorization: Bearer YOUR_API_KEY</code>.</li>
                        </ol>
                        <div className="p-4 bg-black/40 rounded-xl font-mono text-xs border border-white/5 overflow-x-auto">
                            <span className="text-green-400">{'// Example Next.js Fetch'}</span><br />
                            const res = await fetch('https://api.yourcrm.com/api/v1/customers/123/subscriptions', {'{'}<br />
                            &nbsp;&nbsp;headers: {'{'}<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;'Authorization': `Bearer ${'{'}process.env.CRM_API_KEY{'}'}`<br />
                            &nbsp;&nbsp;{'}'}<br />
                            {'}'});
                        </div>
                    </div>
                </div>

                {/* API Reference Documentation */}
                <div className="col-span-1 xl:col-span-2">
                    <ApiDocsViewer />
                </div>
            </div>
        </Container>
    );
}
