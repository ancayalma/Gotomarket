import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiClient } from "@/lib/ai-helper";
import { generateText } from "ai";
import { systemLogger } from "@/lib/logger";
import { logAiUsage } from "@/lib/varuni";

export const maxDuration = 60;

/**
 * POST /api/ai/generate-outreach-prompt
 * 
 * Generates an AI-written outreach prompt that references:
 * - The team's brand identity (name, mission, products, voice, CTAs, etc.)
 * - The selected list/pool context (name, description, ICP, audience)
 * - Lead count for the batch
 * 
 * Returns { prompt: string }
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        if (!user?.team_id) {
            return new NextResponse("No team found", { status: 400 });
        }

        const teamId = user.team_id;
        const { listContext, leadCount, brandId, senderName: overrideName, senderTitle: overrideTitle } = await req.json();

        // Fetch brand identity — use specific brand if selected, otherwise default
        let brand = null;
        if (brandId) {
            brand = await prismadb.teamBrandIdentity.findUnique({
                where: { id: brandId },
            });
        }
        if (!brand) {
            brand = await prismadb.teamBrandIdentity.findFirst({
                where: { team_id: teamId, is_default: true },
            });
        }

        // Build the brand context block
        const brandBlock = brand ? [
            `Company: ${brand.company_name || "Unknown"}`,
            brand.industry ? `Industry: ${brand.industry}` : "",
            brand.tagline ? `Tagline: "${brand.tagline}"` : "",
            brand.mission_statement ? `Mission: ${brand.mission_statement}` : "",
            brand.core_philosophy ? `Philosophy: ${brand.core_philosophy}` : "",
            brand.key_products_services?.length ? `Products/Services: ${(brand.key_products_services as string[]).join(", ")}` : "",
            brand.competitive_advantages?.length ? `Competitive Advantages: ${(brand.competitive_advantages as string[]).join(", ")}` : "",
            brand.pain_points_solved?.length ? `Pain Points Solved: ${(brand.pain_points_solved as string[]).join(", ")}` : "",
            brand.audience_description ? `Target Audience: ${brand.audience_description}` : "",
            brand.ideal_customer_profile ? `ICP: ${brand.ideal_customer_profile}` : "",
            brand.brand_voice ? `Brand Voice: ${brand.brand_voice}` : "",
            brand.agent_tone ? `Agent Tone: ${brand.agent_tone}` : "",
            brand.communication_style ? `Communication Style: ${brand.communication_style}` : "",
            brand.outreach_approach ? `Outreach Approach: ${brand.outreach_approach}` : "",
            brand.messaging_themes?.length ? `Messaging Themes: ${(brand.messaging_themes as string[]).join(", ")}` : "",
            brand.cta_preferences?.length ? `CTA Preferences: ${(brand.cta_preferences as string[]).join("; ")}` : "",
            brand.do_not_say?.length ? `Do Not Say: ${(brand.do_not_say as string[]).join(", ")}` : "",
            brand.location ? `Location: ${brand.location}` : "",
            // AI Generation Settings
            brand.grammar_accuracy != null ? `Grammar Accuracy: ${brand.grammar_accuracy}% (0=casual, 100=perfect)` : "",
            brand.avoid_em_dashes ? `Writing Rule: Avoid EM dashes (—) — use hyphens or commas instead` : "",
            brand.emoji_frequency != null ? `Emoji Frequency: ${brand.emoji_frequency}% (0=none, 100=heavy)` : "",
            brand.emoji_allowed_in?.length ? `Emojis Allowed In: ${(brand.emoji_allowed_in as string[]).join(", ")}` : "",
            // Ecosystem
            (brand.subsidiaries as string[] | undefined)?.length ? `Subsidiaries / Sub-brands: ${(brand.subsidiaries as string[]).join(", ")}` : "",
            (brand.partner_categories as string[] | undefined)?.length ? `Partner Categories: ${(brand.partner_categories as string[]).join(", ")}` : "",
        ].filter(Boolean).join("\n") : "No brand identity configured.";

        // Build list context block
        const listBlock = listContext ? [
            `List Name: ${listContext.name || "Unnamed List"}`,
            listContext.description ? `List Description: ${listContext.description}` : "",
            listContext.contactsCount ? `Contacts in List: ${listContext.contactsCount}` : "",
            listContext.icpConfig?.target_industry ? `Target Industry: ${listContext.icpConfig.target_industry}` : "",
            listContext.icpConfig?.target_company_size ? `Target Company Size: ${listContext.icpConfig.target_company_size}` : "",
            listContext.icpConfig?.target_titles?.length ? `Target Titles: ${listContext.icpConfig.target_titles.join(", ")}` : "",
            listContext.icpConfig?.geographic_focus ? `Geographic Focus: ${listContext.icpConfig.geographic_focus}` : "",
            listContext.icpConfig?.natural_language_icp ? `ICP Description: ${listContext.icpConfig.natural_language_icp}` : "",
        ].filter(Boolean).join("\n") : "No list context provided.";

        const { model } = await getAiClient(teamId);

        const userName = overrideName || session.user?.name || "the user";
        const userTitle = overrideTitle || "";
        const titleClause = userTitle ? ` (${userTitle})` : "";

        const systemMessage = `You are an expert B2B outreach strategist and copywriting specialist.
Your job is to write a comprehensive AI PROMPT that will later be used by another AI to generate personalized outreach emails.

You are NOT writing the email itself. You are writing the INSTRUCTIONS (prompt) that will guide an email-writing AI.

CRITICAL: The emails will be sent by ${userName}${titleClause}. The prompt MUST instruct the AI to:
- Ghostwrite in first person (I/me) AS ${userName}
- Present the sender as ${userName}${titleClause} — use this title/role, NOT any other title from the brand identity
- Never refer to ${userName} in third person
- Write as if ${userName} is personally reaching out in their capacity as ${userTitle || "a company representative"}

The prompt you write must:
1. Define the sender persona as ${userName} using the brand identity provided
2. Reference the specific list/audience context so emails are tailored
3. Include clear structural requirements (JSON output with "subject" and "body" keys)
4. Set tone, voice, and style constraints from the brand identity
5. Include specific CTAs from the brand preferences
6. Specify email length (250-300 words), format (plain text, no HTML), and style (narrative, insight-driven, no section headings)
7. Include any "do not say" restrictions from the brand
8. Reference the number of leads in the batch for context
9. Instruct the AI to use company research when available to personalize each email

Write the prompt in a clear, structured format with labeled sections (Persona, Goal, Audience Context, Requirements, Constraints).
Output ONLY the prompt text — no explanation, no preamble, no markdown formatting.`;

        const userPrompt = `Generate an outreach email prompt based on this context:

=== BRAND IDENTITY ===
${brandBlock}

=== LIST/AUDIENCE CONTEXT ===
${listBlock}

=== BATCH INFO ===
Leads selected: ${leadCount || "unknown"}

Write the AI prompt now.`;

        const { text, usage } = await generateText({
            model: model,
            system: systemMessage,
            prompt: userPrompt,
        });

        await logAiUsage({
            teamId,
            userId: session.user.id,
            service: "general",
            model: model.modelId || "outreach-prompt-generator",
            usage: {
                promptTokens: (usage as any)?.promptTokens || 0,
                completionTokens: (usage as any)?.completionTokens || 0,
            },
            description: `Generate outreach prompt for list: ${listContext?.name || "unknown"}`,
        });

        return NextResponse.json({ prompt: text.trim() });
    } catch (error) {
        systemLogger.error("[AI_GENERATE_OUTREACH_PROMPT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
