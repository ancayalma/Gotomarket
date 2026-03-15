import { authOptions } from "@/lib/auth";
import { getAiSdkModel, logAiUsage } from "@/lib/openai";
import { streamText } from "ai";
import { getServerSession } from "next-auth";

// IMPORTANT! Set the runtime to edge
//export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { model, modelId, teamId } = await getAiSdkModel(session.user.id);

  if (!model) {
    return new Response("No openai key found", { status: 500 });
  }

  const { prompt } = await req.json();

  const result = await streamText({
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    onFinish: async ({ usage }: any) => {
      await logAiUsage({ teamId, userId: session.user.id, service: "general",
        model: modelId || "unknown",
        usage: { promptTokens: usage?.promptTokens || 0, completionTokens: usage?.completionTokens || 0 },
        description: "OpenAI completion" });
    }
  });

  return result.toTextStreamResponse();
}
