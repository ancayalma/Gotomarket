
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiClient } from "@/lib/ai-helper";
import { streamText } from 'ai';
import { systemLogger } from "@/lib/logger";
import { logAiUsage } from "@/lib/openai";

export const maxDuration = 300;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { subject, message, instruction } = await req.json();

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            include: { assigned_team: true }
        });

        if (!user?.assigned_team) {
            return new NextResponse("Team not found", { status: 400 });
        }

        const { model, provider } = await getAiClient(user.assigned_team.id);

        const prompt = `
      You are an expert professional email assistant. 
      Your task is to rewrite / enhance the following email draft based on this instruction: "${instruction || "Improve clarity and tone"}".
      
      Original Subject: ${subject}
      Original Message: ${message}
      
      Return ONLY the rewritten message body. Do not include the subject line in the body unless explicitly asked. 
      Do not include any conversational filler like "Here is the rewritten email:".
    `;

        const result = streamText({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            onFinish: async ({ usage }: any) => {
                await logAiUsage({
                    teamId: user.assigned_team.id, userId: user.id, service: "email",
                    model: `${provider}:enhance-email`,
                    usage: { promptTokens: usage?.promptTokens || 0, completionTokens: usage?.completionTokens || 0 },
                    description: "Email enhancement"
                });
            }
        });

        return result.toTextStreamResponse();

    } catch (error) {
        systemLogger.error("[EMAIL_ENHANCE_AI]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
