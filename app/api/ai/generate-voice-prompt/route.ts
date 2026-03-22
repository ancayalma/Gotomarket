import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiClient } from "@/lib/ai-helper";
import { generateText } from "ai";
import { systemLogger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        
        const { model } = await getAiClient((session.user as any)?.team_id || "default");
        
        const systemMessage = `You are an expert conversational AI prompt engineer.
Your job is to read the user's project details and lead context, and output a highly effective "System Prompt" designed explicitly for an ElevenLabs Voice agent making an outbound B2B sales call.

Follow these strict rules for the output:
1. Must be written in markdown or plain text.
2. Clearly define the agent's Persona, the Goal of the call, and Required Constraints (e.g., keep responses under 2 sentences, ask clarifying questions before pitching).
3. Do NOT include email instructions (no subjects, no HTML). This is for a live phone call.
4. Output ONLY the instructions that the ElevenLabs agent will follow. Do not include introductory text like "Here is the prompt:"

Context Provided By User:
${JSON.stringify(body, null, 2)}
`;

        const userPrompt = "Generate the ElevenLabs Voice Agent system prompt based on the provided context.";

        const { text } = await generateText({
            model: model,
            system: systemMessage,
            prompt: userPrompt,
        });

        return NextResponse.json({ prompt: text.trim() });
    } catch (error) {
        systemLogger.error("[AI_GENERATE_VOICE_PROMPT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
