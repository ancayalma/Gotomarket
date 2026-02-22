
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiClient } from "@/lib/ai-helper";
import { generateText } from "ai";

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

        const { model } = await getAiClient(user.assigned_team.id);

        const systemMessage = `
            You are a helpful AI assistant for a CRM called BasaltCRM.
            You help users draft content, rewrite text, and improve communication.
            ${context ? `Current context: ${context}` : ""}
            Keep the response concise and professional.
            Do not include any conversational filler.
        `;

        const { text } = await generateText({
            model: model,
            system: systemMessage,
            prompt: prompt,
        });

        return NextResponse.json({ text });

    } catch (error) {
        console.error("[AI_GENERATE_TEXT_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
