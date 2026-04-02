"use server";

import { prismadb } from "@/lib/prisma";

export async function getActiveAiModels() {
    try {
        const systemConfigs = await prismadb.systemAiConfig.findMany({
            where: { isActive: true },
            select: { id: true, modelId: true, provider: true }
        });
        
        // Strip duplicate models if any
        const models = Array.from(new Set(systemConfigs.map((c) => c.modelId))).map(id => {
            return systemConfigs.find((c) => c.modelId === id);
        }).filter(Boolean);

        return models.map((m) => ({
            id: m!.id,
            label: `${m!.provider}: ${m!.modelId.split('/').pop()?.split(':').shift() || m!.modelId}`,
            value: m!.modelId
        }));
    } catch (e) {
        console.error("Error fetching AI models:", e);
        return [];
    }
}
