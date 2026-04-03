// Force Rebuild
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;
import { getAiSdkModel, isReasoningModel, logAiUsage } from "@/lib/varuni";
import { streamText, tool } from "ai";
import { z } from "zod";
import { retrieveRelevantFacts } from "@/lib/vector-search";

type Params = {
  params: { sessionId: string };
};

import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

// ... existing imports ...

// Helper to check access
async function checkAccess(sessionUserId: string, targetUserId: string) {
  if (sessionUserId === targetUserId) return true;

  const currentUser = await prismadb.users.findUnique({
    where: { id: sessionUserId },
    select: { id: true, team_id: true, is_admin: true, team_role: true },
  });

  const isAdmin = currentUser?.is_admin || currentUser?.team_role === "OWNER" || currentUser?.team_role === "ADMIN";
  if (!isAdmin || !currentUser?.team_id) return false;

  const targetUser = await prismadb.users.findUnique({
    where: { id: targetUserId },
    select: { team_id: true },
  });

  return targetUser?.team_id === currentUser.team_id;
}

// GET /api/chat/sessions/:sessionId/messages
// Returns all messages in a session, ordered chronologically.
export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const chatSession = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      console.warn(`[CHAT_MESSAGES_GET] Session not found: ${sessionId}`);
      return new NextResponse("Not Found", { status: 404 });
    }

    const hasAccess = await checkAccess(session.user.id, chatSession.user);
    if (!hasAccess) {
      console.warn(`[CHAT_MESSAGES_GET] Access denied for user ${session.user.id} to session ${sessionId} (owner: ${chatSession.user})`);
      return new NextResponse("Not Found", { status: 404 });
    }

    const where: any = { session: sessionId };
    const messages = await db.chat_Messages.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    systemLogger.error("[CHAT_MESSAGES_GET]", error);
    return new NextResponse("Failed to fetch messages", { status: 500 });
  }
}

// POST /api/chat/sessions/:sessionId/messages
export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await getServerSession(authOptions);
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const payload = await req.json();
    const parentId: string | undefined = payload.parentId;
    const incomingMessages: { role: "user" | "assistant" | "system"; content: string }[] | undefined =
      payload.messages;
    const content: string | undefined = payload.content;

    const chatSession = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const hasAccess = await checkAccess(auth.user.id, chatSession.user);
    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Build conversation for the model
    let modelMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
    let lastUserContent = content;

    if (incomingMessages && Array.isArray(incomingMessages)) {
      modelMessages = incomingMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })) as any;
      const last = [...incomingMessages].reverse().find((m) => m.role === "user");
      if (!lastUserContent && last) {
        lastUserContent = last.content;
      }
    } else if (content) {
      modelMessages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content },
      ];
    } else {
      return new NextResponse("No content or messages provided", { status: 400 });
    }

    // Create user message if the session is not temporary
    let userMessageId: string | null = null;
    if (!chatSession.isTemporary && lastUserContent) {
      const userMessage = await db.chat_Messages.create({
        data: {
          session: sessionId,
          parent: parentId,
          role: "user",
          content: lastUserContent,
          model: undefined,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
        },
      });
      userMessageId = userMessage.id;
      await db.chat_Sessions.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Resolve AI model via centralized config
    const aiResult = await getAiSdkModel(auth.user.id);
    const { model } = aiResult;
    console.log("[CHAT_DEBUG] Resolved AI model:", { provider: aiResult.provider, modelId: aiResult.modelId, teamId: aiResult.teamId, hasModel: !!model });
    if (!model) {
      return new NextResponse("No AI model configured", { status: 500 });
    }

    let result: any;
    try {
      // Omit temperature for reasoning models (o1, etc.)
      const temperature = isReasoningModel(aiResult.modelId) ? undefined : 1;

      const textStreamPromise = streamText({
        model,
        messages: modelMessages,
        temperature,
        tools: {
          searchCRMKnowledge: tool({
            description: "Search the deep Synthesis Layer memory for insights, facts, and context regarding a specific Account or Lead based on their historical actions, tasks, emails, sms, invoices, or subscriptions.",
            parameters: z.object({
              entityName: z.string().describe("The exact or partial name of the Account (e.g., 'Acme Corp') or Lead (e.g., 'John Doe')"),
              query: z.string().describe("The specific question or topic to extract from memory (e.g., 'recent SMS replies', 'billing issues')"),
            }),
            execute: async ({ entityName, query }: any): Promise<any> => {
              try {
                  const targetEntity = entityName.split(' ')[0]; // Basic tokenization
                  // 1. Resolve Entity Context Node
                  const contextNode = await prismadb.contextNode.findFirst({
                    where: {
                       OR: [
                         { account: { name: { contains: targetEntity, mode: 'insensitive' } } },
                         { lead: { lastName: { contains: targetEntity, mode: 'insensitive' } } },
                         { lead: { firstName: { contains: targetEntity, mode: 'insensitive' } } },
                         { lead: { company: { contains: targetEntity, mode: 'insensitive' } } }
                       ]
                    },
                    include: { account: true, lead: true }
                  });

                  if (!contextNode) return { success: false, reason: `No memory node found for '${entityName}'` };

                  // 2. Compute Embedding targeting 'text-embedding-3-small'
                  let embedding: number[] = [];
                  if (process.env.OPENAI_API_KEY) {
                      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
                          method: "POST",
                          headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ input: query, model: "text-embedding-3-small" })
                      });
                      const embedData = await embedRes.json();
                      if (embedData?.data?.[0]?.embedding) {
                          embedding = embedData.data[0].embedding;
                      }
                  }

                  if (!embedding.length) return { success: false, reason: "Math matrix generation failed (API Key missing)." };

                  // 3. Retrieve scored facts mathematically in Node.js
                  const facts = await retrieveRelevantFacts({
                      contextNodeId: contextNode.id,
                      queryEmbedding: embedding,
                      topK: 10,
                      minScore: 0.30
                  });

                  return {
                      entity: contextNode.account?.name || `${contextNode.lead?.firstName} ${contextNode.lead?.lastName}`,
                      lifecycleStatus: contextNode.lifecycleStatus,
                      intentLevel: contextNode.intentLevel,
                      sentimentScore: contextNode.sentimentScore,
                      relevantFacts: facts
                  };
              } catch (e) {
                  systemLogger.error("[KnowledgeToolError]", e);
                  return { success: false, reason: "Internal error retrieving memory." };
              }
            }
          } as any)
        },
        maxSteps: 3,
        onFinish: async ({ text: completion, usage }: any) => {
          try {
            if (!chatSession.isTemporary) {
              await db.chat_Messages.create({
                data: {
                  session: sessionId,
                  parent: userMessageId || parentId || undefined,
                  role: "assistant",
                  content: completion,
                  model: undefined,
                  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                },
              });
              await db.chat_Sessions.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
              });
            }
            // Track AI token usage
            if (usage) {
              await logAiUsage({
                teamId: aiResult.teamId, userId: auth.user.id, service: "chat",
                model: aiResult.modelId || "unknown",
                usage: { promptTokens: usage.promptTokens || 0, completionTokens: usage.completionTokens || 0 },
                description: "Chat session message"
              });
            }
          } catch (e) {
            systemLogger.error("[CHAT_MESSAGES_ON_COMPLETION_SAVE_ERROR]", e);
          }
        },
      } as any);

      // Handle both promise and sync return (SDK robust handling)
      if (textStreamPromise instanceof Promise) {
        result = await textStreamPromise;
      } else {
        result = textStreamPromise;
      }
    } catch (err: any) {
      systemLogger.error("[CHAT_STREAM_TEXT_ERROR]", err);
      return new NextResponse(`Error calling streamText: ${err?.message || "Unknown error"}`, { status: 500 });
    }

    // Attempt to use known response methods
    if (result && typeof result.toDataStreamResponse === 'function') {
      return result.toDataStreamResponse();
    } else if (result && typeof result.toTextStreamResponse === 'function') {
      return result.toTextStreamResponse();
    } else if (result instanceof Response) {
      return result;
    } else {
      systemLogger.error("[CHAT_STREAM_ERROR] Invalid result object:", result);
      return new NextResponse("Stream generation failed: Invalid result", { status: 500 });
    }

  } catch (error) {
    systemLogger.error("[CHAT_MESSAGES_POST]", error);
    return new NextResponse("Failed to process message", { status: 500 });
  }
}
