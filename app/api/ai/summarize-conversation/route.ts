import { streamText } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { systemLogger } from "@/lib/logger";
import { getAiSdkModel, logAiUsage } from "@/lib/varuni";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { messages, leadName } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new NextResponse("Messages array is required", { status: 400 });
        }

        const transcript = messages.map((m: any) => {
            const sender = m.from?.emailAddress?.name || m.from?.emailAddress?.address || m.payload?.headers?.find((h: any) => h.name === "From")?.value || "Unknown";
            const body = m.body?.content || m.snippet || m.bodyPreview || "";
            return `From: ${sender}\nContent: ${body}\n---`;
        }).join("\n");

        const prompt = `As an AI CRM Assistant, provide a high-level "AI Overview" of this email conversation with the lead "${leadName}".
Focus on:
1. What the lead initially provided or asked for.
2. Any specific requests, objections, or timelines mentioned.
3. The latest status and requested next steps.

Format the output as a clean bulleted list, similar to a executive summary. Keep it concise but professional.

Conversation Transcript:
${transcript}`;

        const { model, modelId, teamId } = await getAiSdkModel(session.user.id);

        const result = streamText({
            model,
            prompt: prompt,
            onFinish: async ({ usage }: any) => {
                await logAiUsage({ teamId, userId: session.user.id, service: "analysis",
                    model: modelId || "unknown",
                    usage: { promptTokens: usage?.promptTokens || 0, completionTokens: usage?.completionTokens || 0 },
                    description: "Conversation summarization" });
            }
        });

        return result.toTextStreamResponse();
    } catch (error) {
        systemLogger.error("[AI_SUMMARIZE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
