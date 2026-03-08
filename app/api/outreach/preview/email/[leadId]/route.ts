import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";
import OutreachTemplate, { type ResourceLink } from "@/emails/OutreachTemplate";
import { render } from "@react-email/render";
import React from "react";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/outreach/preview/email/[leadId]
 * Body: {
 *   promptOverride?: string;
 *   includeResearch?: boolean;
 *   meetingLinkOverride?: string;
 * }
 *
 * Returns a preview payload without sending:
 * {
 *   subject: string,
 *   bodyText: string,
 *   html: string,
 *   project?: { title?: string, description?: string },
 *   researchSummary?: string
 * }
 *
 * Notes:
 * - References the project assigned to the lead (Boards relation) and the specific lead information.
 * - Performs lightweight company research based on the email domain when includeResearch is true.
 * - Uses the same structured prompt style as /api/outreach/send but returns preview only.
 */

type RequestBody = {
    promptOverride?: string;
    includeResearch?: boolean;
    meetingLinkOverride?: string;
    resourceLinksOverride?: ResourceLink[];
    signatureHtmlOverride?: string;
};

// Default resource configuration if user has none
const DEFAULT_RESOURCES: ResourceLink[] = [
    { id: "website", label: "Visit Website", href: "#", type: "primary", enabled: true },
    { id: "calendar", label: "Schedule a Call", href: "#", type: "primary", enabled: true },
    { id: "linkedin", label: "Follow on LinkedIn", href: "#", type: "secondary", enabled: true },
];

// Compose the strict system instruction to force JSON output
function systemInstruction() {
    return [
        "You are a professional BD specialist writing personalized VC outreach emails.",
        "Return ONLY JSON with keys 'subject' and 'body'.",
        "The 'body' must be plain text (no HTML), 250–300 words, in first person.",
        "Do not include headings or phrases like 'Founder note'.",
    ].join(" ");
}

import { buildOutreachPrompt } from "@/lib/outreach/prompt-builder";

// Lightweight website research using email domain
async function basicCompanyResearchFromEmail(email?: string | null): Promise<string | null> {
    try {
        if (!email || !email.includes("@")) return null;
        const domain = email.split("@")[1];
        if (!domain) return null;

        // Try https first, then http
        const candidates = [`https://${domain}`, `http://${domain}`, `https://www.${domain}`, `http://www.${domain}`];
        for (const url of candidates) {
            try {
                const res = await fetch(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
                if (!res.ok) continue;
                const html = await res.text();

                // meta name="description"
                const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
                const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

                const snippets: string[] = [];
                if (metaDescMatch?.[1]) snippets.push(metaDescMatch[1]);
                if (ogDescMatch?.[1]) snippets.push(ogDescMatch[1]);

                // Fallback: extract first few visible paragraph texts crudely
                if (snippets.length === 0) {
                    // Avoid using the 's' (dotAll) flag for broader TS compatibility; use [\s\S] instead.
                    const paragraphMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
                    const paragraphs = paragraphMatches
                        .map((inner) => inner.replace(/<[^>]+>/g, "").trim())
                        .filter((t) => t && t.length > 80 && !/cookie|privacy|copyright/i.test(t))
                        .slice(0, 2);
                    snippets.push(...paragraphs);
                }

                if (snippets.length > 0) {
                    const combined = snippets.slice(0, 2).join(" ");
                    return combined.length > 500 ? combined.slice(0, 497) + "..." : combined;
                }
            } catch {
                // continue to next candidate
            }
        }

        return null;
    } catch {
        return null;
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { leadId } = await params;
        if (!leadId) return new NextResponse("Missing leadId", { status: 400 });

        const body = (await req.json().catch(() => ({}))) as RequestBody;
        const includeResearch = !!body.includeResearch;
        const meetingLinkOverride = body.meetingLinkOverride?.trim();

        // Fetch user for signature/resources defaults
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                meeting_link: true,
                signature_html: true,
                resource_links: true,
                outreach_prompt_default: true,
                team_id: true,
            } as const,
        });
        if (!user) return new NextResponse("User not found", { status: 404 });

        let brandIdentity = null;
        if (user.team_id) {
            brandIdentity = await prismadb.teamBrandIdentity.findUnique({
                where: { team_id: user.team_id }
            });
        }

        // Fetch lead with assigned project info
        const lead = await prismadb.crm_Leads.findFirst({
            where: { id: leadId },
            include: { assigned_project: true },
        });
        if (!lead) return new NextResponse("Lead not found", { status: 404 });

        const project = (lead as any)?.assigned_project || null;
        const projectInfo = {
            title: String(project?.title || ""),
            description: String(project?.description || ""),
        };

        // Resolve meeting link for preview
        const meetingLink = meetingLinkOverride || lead.outreach_meeting_link || user.meeting_link || null;

        // Build prompt with optional research
        let researchSummary: string | null = null;
        if (includeResearch) {
            researchSummary = await basicCompanyResearchFromEmail(lead.email);
        }

        const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
        const basePrompt = body.promptOverride?.trim() || user.outreach_prompt_default || null;
        const userPrompt = buildOutreachPrompt({
            basePrompt,
            contact: {
                name: contactName || undefined,
                company: lead.company || undefined,
                jobTitle: lead.jobTitle || undefined,
                email: lead.email || undefined,
            },
            companyResearch: researchSummary,
            meetingLink,
            channel: "EMAIL",
            brandIdentity
        });

        // Append assigned project briefing if present to strengthen personalization
        const leadProject = (lead as any)?.assigned_project || null;
        const projectBlock = leadProject
            ? `
Project Briefing:
- Title: ${String(leadProject?.title || "")}
- Summary: ${String(leadProject?.description || "")}
`.trim()
            : "";
        const userPromptWithProject = [userPrompt, projectBlock].filter(Boolean).join("\\n\\n");

        // OpenAI client
        const { model } = await getAiSdkModel(session.user.id);
        if (!model) return new NextResponse("AI model not configured", { status: 500 });

        let subject = "Exploring Partnership Opportunities";
        let bodyText = "Hello,\n\nI'd like to explore how we could create value together.\n\nThanks.";
        try {
            const { object } = await generateObject({
                model,
                schema: z.object({
                    subject: z.string(),
                    body: z.string(),
                }),
                messages: [
                    { role: "system", content: systemInstruction() },
                    { role: "user", content: userPromptWithProject || userPrompt },
                ],
            });
            subject = object.subject || subject;
            bodyText = object.body || bodyText;
        } catch (err: any) {
            // leave defaults on error

            systemLogger.error("[OUTREACH_PREVIEW_EMAIL][AI_ERROR]", err?.message || err);
        }

        // Prepare resources/signature
        let resources: ResourceLink[] = DEFAULT_RESOURCES;
        try {
            if (user.resource_links && typeof user.resource_links === "object") {
                resources = (user.resource_links as any) as ResourceLink[];
                if (!Array.isArray(resources)) resources = DEFAULT_RESOURCES;
            }
        } catch {
            resources = DEFAULT_RESOURCES;
        }
        // Apply overrides if provided
        if (Array.isArray(body.resourceLinksOverride)) {
            resources = body.resourceLinksOverride;
        }
        const signatureHtml =
            typeof body.signatureHtmlOverride === "string" ? body.signatureHtmlOverride : (user.signature_html || undefined);

        // Render HTML using OutreachTemplate
        const html = await render(
            React.createElement(OutreachTemplate, {
                subjectPreview: subject,
                bodyText,
                resources,
                signatureHtml,
                brand: {
                    accentColor: "#F54029",
                    primaryText: "#1f2937",
                },
            }),
        );

        return NextResponse.json(
            {
                subject,
                bodyText,
                html,
                project: projectInfo,
                researchSummary: researchSummary || "",
            },
            { status: 200 },
        );
    } catch (error) {

        systemLogger.error("[OUTREACH_PREVIEW_EMAIL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
