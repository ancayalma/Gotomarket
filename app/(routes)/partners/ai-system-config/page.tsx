
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import UnifiedAiCard from "@/app/cms/(dashboard)/_components/UnifiedAiCard";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import { AddProviderModal } from "./_components/AddProviderModal";
import { AddModelModal } from "./_components/AddModelModal";
import { ProviderRegistrySection } from "./_components/ProviderRegistrySection";
import { PendingRequestsSection } from "./_components/PendingRequestsSection";
import { HuggingFaceBrowser } from "@/components/ai/HuggingFaceBrowser";
import {
    Cpu,
    Box,
    Key,
    Layers,
    Sparkles,
} from "lucide-react";

export default async function PartnerAiConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/sign-in");

    // Verify Partner/Admin Status
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email! },
        include: { assigned_team: true }
    });

    const isPartner = user?.is_admin ||
        user?.assigned_team?.slug === "ledger1" ||
        user?.assigned_team?.slug === "basalt" ||
        user?.assigned_team?.slug === "basalthq";

    if (!isPartner) {
        return redirect("/admin");
    }

    // Fetch all data in parallel
    const [providers, allModels, pendingRequests] = await Promise.all([
        prismadb.aiProviderRegistry.findMany({
            orderBy: { slug: "asc" }
        }),
        prismadb.aiModel.findMany({
            orderBy: [{ provider: "asc" }, { name: "asc" }]
        }),
        prismadb.customModelRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" }
        }),
    ]);

    const activeProviders = (providers as any[]).filter(p => p.isActive);
    const providerOptions = activeProviders.map(p => ({ slug: p.slug, name: p.name }));

    return (
        <Container
            title="System AI Configuration"
            description="Manage the Platform's AI Providers, Models, and System API Keys."
        >
            <div className="p-4 space-y-8 max-w-5xl">

                {/* ─── Section 1: Provider Registry ─── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Cpu className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Provider Registry</h2>
                                <p className="text-xs text-muted-foreground">
                                    {activeProviders.length} active providers · {providers.length} total
                                </p>
                            </div>
                        </div>
                        <AddProviderModal userId={user?.id} />
                    </div>

                    <ProviderRegistrySection
                        providers={providers as any}
                        models={(allModels as any[]).map(m => ({
                            id: m.id,
                            name: m.name,
                            modelId: m.modelId,
                            provider: m.provider,
                            isActive: m.isActive,
                        }))}
                    />
                </section>

                {/* ─── Divider ─── */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-background px-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Layers className="w-3 h-3" />
                        </span>
                    </div>
                </div>

                {/* ─── Section 2: Model Registry (Add Model + Stats) ─── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/5 flex items-center justify-center">
                                <Box className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground tracking-tight">Model Registry</h2>
                                <p className="text-xs text-muted-foreground">
                                    {(allModels as any[]).filter(m => m.isActive).length} active models across {activeProviders.length} providers
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HuggingFaceBrowser />
                            <AddModelModal providers={providerOptions} />
                        </div>
                    </div>

                    {/* Model counts by provider — compact pills  */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {activeProviders.map(provider => {
                            const count = (allModels as any[]).filter(m => m.provider === provider.slug && m.isActive).length;
                            return (
                                <div
                                    key={provider.slug}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/30 text-xs"
                                >
                                    <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${provider.gradient || "from-gray-400 to-gray-500"}`} />
                                    <span className="font-medium text-foreground">{provider.name}</span>
                                    <span className="text-muted-foreground">{count}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pending Model Requests */}
                    {pendingRequests.length > 0 && (
                        <PendingRequestsSection
                            requests={pendingRequests as any}
                            reviewerId={user?.id || ""}
                        />
                    )}
                </section>

                {/* ─── Divider ─── */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-background px-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="w-3 h-3" />
                        </span>
                    </div>
                </div>

                {/* ─── Section 3: System Keys Configuration ─── */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/5 flex items-center justify-center">
                            <Key className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">System Keys</h2>
                            <p className="text-xs text-muted-foreground">
                                Configure API keys and default models. Teams inherit these unless they provide their own.
                            </p>
                        </div>
                    </div>
                    <UnifiedAiCard />
                </section>
            </div>
        </Container>
    );
}
