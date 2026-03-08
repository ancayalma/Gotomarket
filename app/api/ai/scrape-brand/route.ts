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
            You are a rigorous Brand Identity AI extractor for a CRM outreach platform (email, SMS, phone calls).
            Given the raw text content from a company's website, your job is to extract their Brand Identity.
            Focus on information that would be useful for crafting personalized outreach emails, SMS messages, and phone call scripts.
            Return a JSON object with the following exact structure:
            {
                "company_name": "String",
                "industry": "String",
                "location": "String (city, state/country)",
                "website_url": "String (the URL being scraped)",
                "phone_number": "String (if found, else empty)",
                "company_email": "String (if found, else empty)",
                "tagline": "String (one-liner elevator pitch)",
                "mission_statement": "String",
                "core_philosophy": "String",
                "core_values": ["Value 1", "Value 2"],
                "strategic_focus_areas": ["Focus 1", "Focus 2"],
                "competitive_advantages": ["Advantage 1"],
                "key_products_services": ["Product 1", "Service 1"],
                "pain_points_solved": ["Pain Point 1", "Pain Point 2"],
                "audience_description": "String",
                "business_model_summary": "String",
                "ideal_customer_profile": "String (who is the ideal buyer? job title, company size, industry)",
                "persona_preset": "PROFESSIONAL",
                "brand_voice": "String (e.g. Visionary, Authoritative, Approachable)",
                "agent_tone": "String (e.g. Efficient, Precise, Direct)",
                "communication_style": "String (e.g. Technical but Accessible, Conversational)",
                "outreach_approach": "String (how should outreach feel? e.g. Consultative, Value-led)",
                "messaging_themes": ["Theme 1", "Theme 2"],
                "cta_preferences": ["Book a Demo", "Start Free Trial"],
                "objection_handling": "String (common objections and suggested responses)",
                "do_not_say": ["Word or phrase to avoid"],
                "email_compliance_footer": "String (physical address if found)",
                "sms_opt_out_message": "Reply STOP to unsubscribe",
                "call_script_intro": "String (suggested phone introduction)",
                "follow_up_cadence": "String (suggested days between follow-ups)",
                "business_hours": "String (if found, else empty)",
                "preferred_channel_priority": ["EMAIL", "SMS", "PHONE"]
            }
            Do not include any other text outside of the JSON. If a value isn't obvious, make your best inferential guess based on the text context.
        `;

        const { text } = await generateText({
            model: model,
            system: systemMessage,
            prompt: `Website URL: ${url}\n\nWebsite content:\n\n${textContent}`,
        });

        const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const brandData = JSON.parse(cleanJsonText);

        const brandIdentityData = {
            company_name: brandData.company_name,
            industry: brandData.industry,
            location: brandData.location,
            website_url: brandData.website_url || url,
            phone_number: brandData.phone_number,
            company_email: brandData.company_email,
            tagline: brandData.tagline,
            mission_statement: brandData.mission_statement,
            core_philosophy: brandData.core_philosophy,
            core_values: brandData.core_values || [],
            strategic_focus_areas: brandData.strategic_focus_areas || [],
            competitive_advantages: brandData.competitive_advantages || [],
            key_products_services: brandData.key_products_services || [],
            pain_points_solved: brandData.pain_points_solved || [],
            audience_description: brandData.audience_description,
            business_model_summary: brandData.business_model_summary,
            ideal_customer_profile: brandData.ideal_customer_profile,
            persona_preset: brandData.persona_preset,
            brand_voice: brandData.brand_voice,
            agent_tone: brandData.agent_tone,
            communication_style: brandData.communication_style,
            outreach_approach: brandData.outreach_approach,
            messaging_themes: brandData.messaging_themes || [],
            cta_preferences: brandData.cta_preferences || [],
            objection_handling: brandData.objection_handling,
            do_not_say: brandData.do_not_say || [],
            email_compliance_footer: brandData.email_compliance_footer,
            sms_opt_out_message: brandData.sms_opt_out_message,
            call_script_intro: brandData.call_script_intro,
            follow_up_cadence: brandData.follow_up_cadence,
            business_hours: brandData.business_hours,
            preferred_channel_priority: brandData.preferred_channel_priority || [],
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
