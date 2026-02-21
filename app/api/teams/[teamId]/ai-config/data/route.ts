import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET /api/teams/[teamId]/ai-config/data - Get all AI config data for the form
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;

        const [teamConfig, systemConfigs, activeModels] = await Promise.all([
            prismadb.teamAiConfig.findUnique({
                where: { team_id: teamId }
            }),
            prismadb.systemAiConfig.findMany(),
            prismadb.aiModel.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            })
        ]);

        // Determine which providers are enabled (check system config isActive flag)
        const isProviderEnabled = (providerSlug: string) => {
            const config = systemConfigs.find(c => c.provider === providerSlug);
            return config ? config.isActive : true;
        };

        // Get all registered providers, then filter to enabled ones
        let registeredProviders: string[] = [];
        try {
            const providerRegistry = await prismadb.aiProviderRegistry.findMany({
                where: { isActive: true },
                select: { slug: true }
            });
            registeredProviders = providerRegistry.map(p => p.slug);
        } catch {
            // Fallback: derive unique providers from active models
            registeredProviders = Array.from(new Set(activeModels.map(m => m.provider)));
        }

        const enabledProviders = registeredProviders.filter(isProviderEnabled);

        const providersWithSystemKey = systemConfigs
            .filter(c => c.apiKey && c.apiKey.trim().length > 0)
            .map(c => c.provider);

        return NextResponse.json({
            teamConfig: teamConfig ? {
                ...teamConfig,
                apiKey: teamConfig.apiKey ? "********" : null
            } : null,
            activeModels,
            enabledProviders,
            providersWithSystemKey
        });
    } catch (error) {
        console.error("[TEAM_AI_CONFIG_DATA_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
