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

        const { url, teamId } = await req.json();

        if (!url || !teamId) {
            return new NextResponse("URL and Team ID are required", { status: 400 });
        }

        // Fetch website content
        let htmlText = "";
        try {
            const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                }
            });

            if (!res.ok) {
                return new NextResponse("Failed to fetch website", { status: 400 });
            }
            htmlText = await res.text();
        } catch (fetchErr) {
            systemLogger.error("[AI_SCRAPE_FETCH_ERROR]", fetchErr);
            return new NextResponse("Failed to connect to the provided URL.", { status: 400 });
        }

        // Basic HTML stripping to save tokens
        const bodyMatch = htmlText.match(/<body[^>]*>([\w|\W]*)<\/body>/im);
        const bodyContent = bodyMatch ? bodyMatch[1] : htmlText;
        
        const strictClean = bodyContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
            .replace(/<[^>]+>/ig, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Limit string to ~20,000 characters to prevent huge token limits
        const textContent = strictClean.substring(0, 20000);

        const { model } = await getAiClient(teamId);

        const systemMessage = `
            You are a rigorous Brand Identity AI extractor.
            Given the raw text content from a company's website, your job is to extract their Brand Identity.
            Return a JSON object with the following exact structure:
            {
                "company_name": "String",
                "industry": "String",
                "location": "String",
                "twitter_handle": "String (if found, else empty)",
                "mission_statement": "String",
                "core_philosophy": "String",
                "core_values": ["Value 1", "Value 2"],
                "strategic_focus_areas": ["Focus 1", "Focus 2"],
                "competitive_advantages": ["Advantage 1"],
                "audience_description": "String",
                "business_model_summary": "String",
                "persona_preset": "PROFESSIONAL",  // Choose between PROFESSIONAL, HUMOROUS, SNARKY
                "brand_voice": "String (e.g. Visionary, Authoritative, Cyber-Industrial)",
                "agent_tone": "String (e.g. Efficient, Precise, Direct)",
                "communication_style": "String",
                "engagement_style": "String",
                "hashtag_strategy": "String",
                "content_themes": ["Theme 1", "Theme 2"]
            }
            Do not include any other text out of the JSON. If a value isn't obvious, make your best inferential guess based on the text context.
        `;

        const { text } = await generateText({
            model: model,
            system: systemMessage,
            prompt: `Website content:\n\n${textContent}`,
        });

        const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const brandData = JSON.parse(cleanJsonText);

        const brandIdentityData = {
            company_name: brandData.company_name,
            industry: brandData.industry,
            location: brandData.location,
            twitter_handle: brandData.twitter_handle,
            mission_statement: brandData.mission_statement,
            core_philosophy: brandData.core_philosophy,
            core_values: brandData.core_values || [],
            strategic_focus_areas: brandData.strategic_focus_areas || [],
            competitive_advantages: brandData.competitive_advantages || [],
            audience_description: brandData.audience_description,
            business_model_summary: brandData.business_model_summary,
            persona_preset: brandData.persona_preset,
            brand_voice: brandData.brand_voice,
            agent_tone: brandData.agent_tone,
            communication_style: brandData.communication_style,
            engagement_style: brandData.engagement_style,
            hashtag_strategy: brandData.hashtag_strategy,
            content_themes: brandData.content_themes || [],
            setup_completed: true
        };

        const updatedBrand = await prismadb.teamBrandIdentity.upsert({
            where: {
                team_id: teamId
            },
            update: { ...brandIdentityData },
            create: {
                team_id: teamId,
                ...brandIdentityData
            }
        });

        return NextResponse.json(updatedBrand);

    } catch (error) {
        systemLogger.error("[AI_SCRAPE_BRAND_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
