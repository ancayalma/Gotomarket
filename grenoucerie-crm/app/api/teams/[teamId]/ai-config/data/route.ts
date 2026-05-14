import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";
import { getTeamLeadGenCredits } from "@/lib/scraper/credits";
import { getTeamAiTokenBalance } from "@/lib/ai-tokens";

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
            const config = (systemConfigs as any[]).find(c => c.provider === providerSlug);
            return config ? config.isActive : true;
        };

        // Get all registered providers, then filter to enabled ones
        let registeredProviders: string[] = [];
        try {
            const providerRegistry = await prismadb.aiProviderRegistry.findMany({
                where: { isActive: true },
                select: { slug: true }
            });
            registeredProviders = (providerRegistry as any[]).map(p => p.slug);
        } catch {
            // Fallback: derive unique providers from active models
            registeredProviders = Array.from(new Set((activeModels as any[]).map(m => m.provider)));
        }

        const enabledProviders = registeredProviders.filter(isProviderEnabled);

        const providersWithSystemKey = (systemConfigs as any[])
            .filter(c => c.apiKey && c.apiKey.trim().length > 0)
            .map(c => c.provider);

        const [leadgenCredits, aiTokensBalance] = await Promise.all([
            getTeamLeadGenCredits(teamId),
            getTeamAiTokenBalance(teamId)
        ]);

        return NextResponse.json({
            teamConfig: teamConfig ? {
                ...teamConfig,
                apiKey: teamConfig.apiKey ? "********" : null
            } : null,
            activeModels,
            enabledProviders,
            providersWithSystemKey,
            leadgenCredits,
            aiTokensBalance
        });
    } catch (error) {
        systemLogger.error("[TEAM_AI_CONFIG_DATA_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
