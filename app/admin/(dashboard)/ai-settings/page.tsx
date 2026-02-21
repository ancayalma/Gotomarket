import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import { AiConfigManager } from "@/components/ai/AiConfigManager";

export default async function AdminAiSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
        redirect("/");
    }

    // Get current user's team
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email || "" },
        include: { assigned_team: true },
    });

    const teamId = user?.assigned_team?.id;

    if (!teamId) {
        return (
            <Container
                title="AI Settings"
                description="No team found for your account"
            >
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Please contact support to be assigned to a team.
                </div>
            </Container>
        );
    }

    // Fetch AI data in parallel
    const [teamConfig, systemConfigs, activeModels, teamModelRequests] = await Promise.all([
        prismadb.teamAiConfig.findUnique({
            where: { team_id: teamId },
        }),
        prismadb.systemAiConfig.findMany(),
        prismadb.aiModel.findMany({
            where: { isActive: true },
            orderBy: [{ provider: "asc" }, { name: "asc" }],
        }),
        prismadb.customModelRequest.findMany({
            where: { team_id: teamId },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ]);

    // Determine which providers have system keys configured
    const providersWithSystemKey = systemConfigs
        .filter((c) => c.apiKey && c.apiKey.trim().length > 0)
        .map((c) => c.provider);

    // Fetch available providers for the request form
    let providerOptions: { slug: string; name: string }[] = [];
    try {
        const registeredProviders = await prismadb.aiProviderRegistry.findMany({
            where: { isActive: true },
            orderBy: { slug: "asc" },
            select: { slug: true, name: true },
        });
        providerOptions = registeredProviders;
    } catch {
        providerOptions = Array.from(new Set(activeModels.map(m => m.provider))).map(p => ({ slug: p, name: p }));
    }

    return (
        <Container
            title="AI Settings"
            description="Configure your team's AI model preferences and API keys"
        >
            <AiConfigManager
                teamId={teamId}
                currentConfig={teamConfig ? {
                    ...teamConfig,
                    apiKey: teamConfig.apiKey ? "********" : null
                } : null}
                models={activeModels}
                providersWithSystemKey={providersWithSystemKey}
                userId={user?.id || ""}
                teamName={user?.assigned_team?.name || ""}
                modelRequests={teamModelRequests as any}
                providerOptions={providerOptions}
            />
        </Container>
    );
}
