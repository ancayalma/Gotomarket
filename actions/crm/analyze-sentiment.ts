import { getAiSdkModel, logAiUsage } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { systemLogger } from "@/lib/logger";

export interface SentimentResult {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  reasoning: string;
  suggestedAction: string;
}

/**
 * Analyzes the sentiment of a reply to an outreach email using AI.
 *
 * - POSITIVE: Interested, wants to meet, asks follow-up questions, requests pricing
 * - NEGATIVE: Not interested, wrong person, do not contact, unsubscribe intent
 * - NEUTRAL: Auto-reply, OOO, generic acknowledgment, forwarded to someone else
 *
 * @param snippet The reply text or snippet to analyze
 * @param context Additional context about the outreach (original subject, lead info)
 * @param userId The user ID for AI model resolution
 */
export async function analyzeReplySentiment(
  snippet: string,
  context: {
    originalSubject?: string;
    leadName?: string;
    leadCompany?: string;
  },
  userId: string
): Promise<SentimentResult> {
  const fallback: SentimentResult = {
    sentiment: "NEUTRAL",
    reasoning: "Could not analyze sentiment — defaulting to neutral for human review.",
    suggestedAction: "REVIEW",
  };

  if (!snippet || snippet.trim().length < 5) return fallback;

  try {
    const { model, modelId, teamId } = await getAiSdkModel(userId);
    if (!model) return fallback;

    const systemPrompt = [
      "You are a CRM AI assistant classifying the sentiment of a reply to a sales/outreach email.",
      "Classify the reply into exactly one of: POSITIVE, NEGATIVE, or NEUTRAL.",
      "",
      "POSITIVE indicators: interest in meeting, asking about pricing/features, requesting a demo,",
      "asking follow-up questions, expressing curiosity, wanting to learn more, scheduling intent.",
      "",
      "NEGATIVE indicators: 'not interested', 'please remove me', 'do not contact',",
      "'wrong person', 'stop emailing', explicit rejection, hostile tone.",
      "",
      "NEUTRAL indicators: out-of-office auto-reply, generic acknowledgment ('thanks for reaching out'),",
      "'I'll forward this to...', vacation messages, automated responses, ambiguous one-liners.",
      "",
      "Also suggest the next action:",
      "- POSITIVE → 'CREATE_OPPORTUNITY' (move to sales pipeline)",
      "- NEGATIVE → 'TAG_FOR_REVIEW' (flag for human decision)",
      "- NEUTRAL → 'SCHEDULE_RECHECK' (check again later)",
    ].join("\n");

    const userPrompt = [
      "Analyze this reply to our outreach email:",
      "",
      `Original subject: "${context.originalSubject || "N/A"}"`,
      `Lead: ${context.leadName || "Unknown"} at ${context.leadCompany || "Unknown"}`,
      "",
      "--- Reply ---",
      snippet.substring(0, 2000), // Cap at 2000 chars to control token usage
      "--- End ---",
    ].join("\n");

    const { object, usage } = await generateObject({
      model,
      schema: z.object({
        sentiment: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
        reasoning: z.string(),
        suggestedAction: z.string(),
      }),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    // Track AI usage
    await logAiUsage({
      teamId,
      userId,
      service: "sentiment_analysis" as any,
      model: modelId || "unknown",
      usage: {
        promptTokens: (usage as any)?.promptTokens || 0,
        completionTokens: (usage as any)?.completionTokens || 0,
      },
      description: "Reply sentiment analysis",
    });

    systemLogger.info(
      `[SENTIMENT] Result: ${object.sentiment} — ${object.reasoning.substring(0, 100)}`
    );

    return {
      sentiment: object.sentiment,
      reasoning: object.reasoning,
      suggestedAction: object.suggestedAction,
    };
  } catch (err: any) {
    systemLogger.error(`[SENTIMENT] Analysis failed: ${err?.message}`);
    return fallback;
  }
}
