
import { prismadb } from "@/lib/prisma";
import { AiConfigManager } from "@/components/ai/AiConfigManager";

interface TeamAiSettingsProps {
    teamId: string;
}

const TeamAiSettings = async ({ teamId }: TeamAiSettingsProps) => {

    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: teamId }
    });

    // Fetch system configs to determine which providers are enabled
    const systemConfigs = await prismadb.systemAiConfig.findMany();

    // Fetch all active models to populate dropdowns
    const activeModels = await prismadb.aiModel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    // Helper to check if provider is enabled (default to true if no config exists)
    const isProviderEnabled = (providerSlug: string) => {
        const config = systemConfigs.find(c => c.provider === providerSlug);
        return config ? config.isActive : true;
    };

    // Get all registered providers dynamically
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

    // Helper to check if provider has system key configured
    // Note: We check if apiKey is present AND not empty string.
    const providersWithSystemKey = systemConfigs
        .filter(c => c.apiKey && c.apiKey.trim().length > 0)
        .map(c => c.provider);

    return (
        <AiConfigManager
            teamId={teamId}
            currentConfig={teamConfig}
            models={activeModels}
            providersWithSystemKey={providersWithSystemKey}
        />
    );
};

export default TeamAiSettings;
