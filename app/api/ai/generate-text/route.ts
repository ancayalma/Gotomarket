
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiClient } from "@/lib/ai-helper";
import { generateText } from "ai";
import { systemLogger } from "@/lib/logger";

export const maxDuration = 300;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { prompt, context } = await req.json();

        if (!prompt) {
            return new NextResponse("Prompt is required", { status: 400 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            include: { assigned_team: true }
        });

        if (!user?.assigned_team) {
            return new NextResponse("Team not found", { status: 400 });
        }

        const { model, modelId, provider } = await getAiClient(user.assigned_team.id);

        // SOC2 CC6.1 / A1.2: Check AI credit quotas before allowing request
        const { checkTeamQuota } = await import("@/lib/quota-service");
        const quota = await checkTeamQuota(user.assigned_team.id, "CREDITS");
        if (!quota.allowed) {
            return NextResponse.json({ error: quota.message }, { status: 403 });
        }

        const systemMessage = `
            You are a helpful AI assistant for a CRM called BasaltCRM.
            You help users draft content, rewrite text, and improve communication.
            ${context ? `Current context: ${context}` : ""}
            Keep the response concise and professional.
            Do not include any conversational filler.
        `;

        const { text, usage } = await generateText({
            model: model,
            system: systemMessage,
            prompt: prompt,
        });

        // Log usage for quota enforcement
        try {
            await prismadb.crm_AiUsageLog.create({
                data: {
                    tenant_id: user.assigned_team.id,
                    user_id: user.id,
                    service: "text_generation",
                    model_used: `${provider}:${modelId}`,
                    tokens_in: (usage as any)?.promptTokens || 0,
                    tokens_out: (usage as any)?.completionTokens || 0,
                    cost: 0, // In standard implementation, we can calculate this if needed
                    description: `Generated text for prompt: ${prompt.substring(0, 50)}...`
                }
            });
        } catch (logError) {
            systemLogger.error("[AI_USAGE_LOG_ERROR]", logError);
        }

        return NextResponse.json({ text });

    } catch (error) {
        systemLogger.error("[AI_GENERATE_TEXT_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
