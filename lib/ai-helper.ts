import { getAiSdkModel } from "./varuni";

/**
 * Legacy wrapper around getAiSdkModel for backward compatibility.
 * All AI routing now goes through the centralized getAiSdkModel function
 * which respects System AI Config set by platform admins.
 */
export async function getAiClient(teamId: string) {
    const result = await getAiSdkModel({ teamId }, "general");
    return {
        client: result.model,
        model: result.model,
        provider: result.provider,
        modelId: result.modelId,
    };
}
