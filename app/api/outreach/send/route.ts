import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { sendTeamEmail } from "@/lib/email/team-mailer";
import sendSystemEmail from "@/lib/sendmail";
import { render } from "@react-email/render";
import OutreachTemplate, { type ResourceLink } from "@/emails/OutreachTemplate";
import { getAiSdkModel, logAiUsage } from "@/lib/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { sendViaGmail } from "@/lib/gmail";
import React from "react";
import { ensureContactForLead } from "@/actions/crm/lead-conversions";
import { claimOnboardingBonus } from "@/actions/crm/onboarding-bonus";
import { systemLogger } from "@/lib/logger";
import { researchCompany } from "@/lib/outreach/company-research";
import { renderOutreachTemplate } from "@/lib/outreach/outreach-templates";
import { resolveIconUrl, inferIconFromResource } from "@/lib/outreach/outreach-icons";

/**
 * POST /api/outreach/send
 * Body: {
 *   leadIds: string[];
 *   test?: boolean;
 *   promptOverride?: string;
 *   meetingLinkOverride?: string;
 * }
 *
 * Behavior:
 * - Loads leads (scoped to current user unless admin).
 * - For each lead, generates a personalized email (subject/body in plain text) using OpenAI (Azure/OpenAI).
 * - Renders OutreachTemplate (HTML) including resources, signature, and a tracking pixel.
 * - Sends via nodemailer (SMTP) using lib/sendmail.ts.
 * - Updates lead outreach fields and inserts crm_Lead_Activities.
 */

type RequestBody = {
  leadIds: string[];
  test?: boolean;
  testEmail?: string;
  inlineLeads?: Array<{ id: string; firstName?: string; lastName?: string; company?: string; jobTitle?: string; email?: string }>;
  promptOverride?: string;
  meetingLinkOverride?: string;
  brandId?: string;
  senderMode?: "company" | "personal";
  senderOverride?: { name?: string; title?: string } | null; // Override sender identity for AI ghostwriting
  // Pre-generated content to skip AI regeneration (for test sends using preview)
  preGeneratedSubject?: string;
  preGeneratedBody?: string;
  preGeneratedHtml?: string;
  templateId?: string;
  themeColorOverride?: string;
  secondaryColorOverride?: string;
  leadData?: Array<{ id: string; firstName?: string; lastName?: string; company?: string; jobTitle?: string; email?: string }>;
  templateOptions?: import("@/lib/outreach/outreach-styles").TemplateOptions;
};


// Default generic resource configuration if user has none
const DEFAULT_RESOURCES: ResourceLink[] = [
  { id: "website", label: "Visit Website", href: "#", type: "primary", enabled: true },
  { id: "calendar", label: "Schedule a Call", href: "#", type: "primary", enabled: true },
  { id: "linkedin", label: "Follow on LinkedIn", href: "#", type: "secondary", enabled: true }
];

// Lightweight HTML stripper for plaintext fallback
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

// Compose the strict system instruction to force JSON output
function systemInstruction(senderName?: string, senderTitle?: string) {
  const name = senderName || "the sender";
  const titlePart = senderTitle ? ` (${senderTitle})` : "";
  return [
    `You are ghostwriting a personalized outreach email ON BEHALF of ${name}${titlePart}.`,
    `Write in first person (I/me) as ${name}. Never refer to ${name} in third person.`,
    "Return ONLY JSON with keys 'subject' and 'body'.",
    "The 'body' must be plain text (no HTML), 250–300 words.",
    `The body MUST start with a proper greeting addressing the recipient by first name (e.g. 'Hi John,' or 'Dear Sarah,').`,
    `The body MUST end with a professional sign-off that fits the email tone (e.g. Sincerely, Regards, Cheers, Looking forward) followed by the sender's name: ${name}.`,
    "Do not include headings or phrases like 'Founder note'.",
  ].join(" ");
}

import { buildOutreachPrompt } from "@/lib/outreach/prompt-builder";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    if (!Array.isArray(body.leadIds) || body.leadIds.length === 0) {
      return new NextResponse("No leads provided", { status: 400 });
    }

    // Check current user (for admin privileges)
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        is_admin: true,
        is_account_admin: true,
        meeting_link: true,
        signature_html: true,
        resource_links: true,
        outreach_prompt_default: true,
        team_id: true,
      } as const,
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const isAdmin = !!(user.is_admin || user.is_account_admin);

    // Fetch Team Brand Identity
    let brandIdentity = null;
    if (user.team_id) {
      brandIdentity = await prismadb.teamBrandIdentity.findFirst({
        where: { team_id: user.team_id, is_default: true },
        select: { logo_url: true, company_name: true, primary_brand_color: true },
      });
    }

    // Fetch leads, scoped by user if not admin
    // Partition IDs: valid Mongo ObjectIDs vs compound candidate IDs (e.g., "candidateId_contactId")
    const validObjectIds = body.leadIds.filter((id: string) => /^[a-f0-9]{24}$/i.test(id));
    const candidateIds = body.leadIds.filter((id: string) => !/^[a-f0-9]{24}$/i.test(id));

    systemLogger.info(`[OUTREACH_SEND] Query: leadIds=${body.leadIds.length} (${validObjectIds.length} valid, ${candidateIds.length} candidates), isAdmin=${isAdmin}, userId=${session.user.id}, teamId=${user.team_id}`);
    
    let dbLeads: any[] = [];
    if (validObjectIds.length > 0) {
      dbLeads = await prismadb.crm_Leads.findMany({
        where: {
          id: { in: validObjectIds },
          ...(isAdmin ? {} : { assigned_to: session.user.id }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          jobTitle: true,
          email: true,
          assigned_to: true,
          outreach_meeting_link: true,
          outreach_status: true,
        },
      });
    }

    systemLogger.info(`[OUTREACH_SEND] Found ${dbLeads.length} leads from DB. Candidate IDs: ${candidateIds.length}`);

    // For candidate IDs, use client-supplied leadData or inlineLeads (pool candidates aren't in crm_Leads)
    const candidateLeads: any[] = [];
    const clientData = body.leadData || body.inlineLeads || [];
    if (candidateIds.length > 0 && Array.isArray(clientData) && clientData.length > 0) {
      for (const cid of candidateIds) {
        const match = clientData.find((ld: any) => ld.id === cid);
        if (match && match.email) {
          candidateLeads.push({
            id: cid,
            firstName: match.firstName || '',
            lastName: match.lastName || '',
            company: match.company || '',
            jobTitle: match.jobTitle || '',
            email: match.email,
            assigned_to: null,
            outreach_meeting_link: null,
            outreach_status: 'IDLE',
          });
        }
      }
    }

    let leads: any[] = [...dbLeads, ...candidateLeads];

    if (leads.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, errors: 0, results: [], message: `No leads found. Requested ${body.leadIds.length} IDs. isAdmin=${isAdmin}` });
    }

    // A subtle compliance: skip contacts with unsubscribed email if we can match them
    // (Best effort, optional)
    const leadEmails = leads.map((l: any) => l.email).filter(Boolean) as string[];
    const unsubscribedContacts = await prismadb.crm_Contacts.findMany({
      where: { email: { in: leadEmails } },
      select: { email: true, email_unsubscribed: true },
    });
    const unsubSet = new Set(
      unsubscribedContacts.filter((c: any) => c.email_unsubscribed).map((c: any) => (c.email || "").toLowerCase()),
    );

    // Prepare OpenAI client
    const { model, modelId, teamId } = await getAiSdkModel(session.user.id);
    if (!model) {
      return new NextResponse("AI model not configured", { status: 500 });
    }

    // Base URL for links/pixel
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // User resources/signature (defaults)
    let resources: ResourceLink[] = DEFAULT_RESOURCES;
    try {
      if (user.resource_links && typeof user.resource_links === "object") {
        // resource_links is JSON in DB; Prisma type is unknown (Json)
        resources = (user.resource_links as any) as ResourceLink[];
        if (!Array.isArray(resources)) resources = DEFAULT_RESOURCES;
      }
    } catch {
      resources = DEFAULT_RESOURCES;
    }
    let signatureHtml = user.signature_html || undefined;
    let brandAccentColor = brandIdentity?.primary_brand_color || "#F54029";
    let brandLogoUrl = brandIdentity?.logo_url || undefined;
    let brandCompanyName = brandIdentity?.company_name || undefined;

    // Override with brand-level signature/resources if brandId is provided
    if (body.brandId) {
      try {
        const brand = await prismadb.teamBrandIdentity.findUnique({
          where: { id: body.brandId },
          select: { signature_html: true, resource_links: true, logo_url: true, company_name: true, primary_brand_color: true },
        });
        if (brand?.signature_html) {
          signatureHtml = brand.signature_html;
        }
        if (brand?.resource_links && Array.isArray(brand.resource_links)) {
          resources = brand.resource_links as any as ResourceLink[];
        }
        if (brand?.logo_url) {
          brandLogoUrl = brand.logo_url;
        }
        if (brand?.company_name) {
          brandCompanyName = brand.company_name;
        }
        if (brand?.primary_brand_color) {
          brandAccentColor = brand.primary_brand_color;
        }
      } catch { }
    }

    const testMode = !!body.test;
    const testEmailOverride = body.testEmail?.trim();
    const meetingLinkOverride = body.meetingLinkOverride?.trim();
    const promptOverride = body.promptOverride?.trim();

    // Pre-generated content (skip AI if provided)
    const preGeneratedSubject = body.preGeneratedSubject?.trim();
    const preGeneratedBody = body.preGeneratedBody?.trim();
    const preGeneratedHtml = body.preGeneratedHtml;

    const results: Array<{
      leadId: string;
      status: "skipped" | "sent" | "error";
      reason?: string;
      subject?: string;
      to?: string;
      messageId?: string;
    }> = [];

    for (const lead of leads) {
      // Basic validation
      let toEmails: string[] = [];
      if (testMode) {
        // Parse comma-separated test emails — send to ALL of them
        const testEmails = (testEmailOverride || "")
          .split(",")
          .map((e: string) => e.trim())
          .filter((e: string) => e.length > 0 && e.includes("@"));
        if (testEmails.length > 0) {
          toEmails = testEmails;
        } else {
          toEmails = [process.env.TEST_EMAIL || session.user.email || ""].filter(Boolean);
        }
      } else {
        toEmails = [lead.email || ""].filter(Boolean);
      }
      if (toEmails.length === 0) {
        results.push({ leadId: lead.id, status: "skipped", reason: "No lead email" });
        continue;
      }
      // Check if any of the target emails are unsubscribed
      const unsubscribedTargetEmails = toEmails.filter(email => unsubSet.has(email.toLowerCase()));
      if (unsubscribedTargetEmails.length > 0) {
        results.push({ leadId: lead.id, status: "skipped", reason: `Unsubscribed contact(s): ${unsubscribedTargetEmails.join(', ')}` });
        continue;
      }

      // Choose meeting link: override > lead's outreach_meeting_link > user's profile meeting link
      const meetingLink = meetingLinkOverride || lead.outreach_meeting_link || user.meeting_link || null;

      // Create or reuse tracking token (generate new on send)
      const token = (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) || `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const trackingPixelUrl = baseUrl ? `${baseUrl}/api/outreach/open/${encodeURIComponent(token)}.png` : undefined;

      // Build LLM prompt
      const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
      const basePrompt = promptOverride || user.outreach_prompt_default || null;

      // Research the lead's company for personalization
      let companyResearch: string | null = null;
      if (lead.email) {
        try {
          companyResearch = await researchCompany(lead.email);
        } catch (researchErr: any) {
          systemLogger.warn(`[OUTREACH_SEND] Company research failed for ${lead.email}: ${researchErr?.message}`);
        }
      }

      // Determine sender identity (override or user profile)
      const senderName = body.senderOverride?.name || (user as any).name || session.user.name || "the sender";
      const senderTitle = body.senderOverride?.title || "";
      const senderCompany = brandIdentity?.company_name || "";

      const userPrompt = buildOutreachPrompt({
        basePrompt,
        contact: {
          name: contactName || undefined,
          company: lead.company || undefined,
          jobTitle: lead.jobTitle || undefined,
          email: lead.email || undefined,
        },
        sender: {
          name: senderName,
          title: senderTitle,
          company: senderCompany,
        },
        companyResearch,
        meetingLink,
        channel: "EMAIL",
        brandIdentity
      });

      // Use pre-generated content if provided (skips AI call - faster for test sends)
      let subject = preGeneratedSubject || "Exploring Partnership Opportunities";
      let bodyText = preGeneratedBody || "Hello,\n\nI'd like to explore how we could align with your investment thesis.\n\nThanks.";

      // Only call AI if no pre-generated content provided
      if (!preGeneratedSubject || !preGeneratedBody) {
        try {
          const { object, usage } = await generateObject({
            model,
            schema: z.object({
              subject: z.string(),
              body: z.string(),
            }),
            messages: [
              { role: "system", content: systemInstruction(senderName, senderTitle) },
              { role: "user", content: userPrompt },
            ],
          });

          subject = object.subject || subject;
          bodyText = object.body || bodyText;

          // Track AI token usage
          await logAiUsage({
            teamId, userId: session.user.id, service: "email",
            model: modelId || "unknown",
            usage: { promptTokens: (usage as any)?.promptTokens || 0, completionTokens: (usage as any)?.completionTokens || 0 },
            description: "Outreach email generation"
          });

        } catch (err: any) {
          // generateObject failed (model may output thinking tokens) — retry with generateText + manual JSON parse
          systemLogger.warn("[OUTREACH_SEND][AI_RETRY] generateObject failed, retrying with generateText:", err?.message);
          try {
            const { text: rawText, usage: retryUsage } = await generateText({
              model,
              system: systemInstruction(senderName, senderTitle) + " Return ONLY valid JSON, no markdown fences, no explanations.",
              prompt: userPrompt,
            });

            // Strip thinking tags and extract JSON
            let cleaned = rawText
              .replace(/<think>[\s\S]*?<\/think>/gi, "")
              .replace(/```json\s*/gi, "")
              .replace(/```\s*/gi, "")
              .trim();

            // Find JSON object in the response
            const jsonMatch = cleaned.match(/\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              subject = parsed.subject || subject;
              bodyText = parsed.body || bodyText;
              systemLogger.info("[OUTREACH_SEND][AI_RETRY] Successfully parsed fallback response");
            } else {
              systemLogger.error("[OUTREACH_SEND][AI_RETRY] No JSON found in fallback response");
            }

            await logAiUsage({
              teamId, userId: session.user.id, service: "email",
              model: modelId || "unknown",
              usage: { promptTokens: (retryUsage as any)?.promptTokens || 0, completionTokens: (retryUsage as any)?.completionTokens || 0 },
              description: "Outreach email generation (retry)"
            });
          } catch (retryErr: any) {
            systemLogger.error("[OUTREACH_SEND][AI_ERROR] Both attempts failed:", retryErr?.message || retryErr);
          }
        }
      }

      const brandColorHex = (body.themeColorOverride || brandAccentColor).replace("#", "");
      // Resolve icon names to self-hosted SVG URLs
      const resolvedResources = resources.map((r: any) => {
        const iconName = r.icon || inferIconFromResource(r);
        const isPrimary = r.type === "primary";
        const colorParam = isPrimary ? "ffffff" : brandColorHex;
        return {
          ...r,
          iconUrl: resolveIconUrl(iconName, baseUrl, colorParam) || r.iconUrl,
          iconName,
        };
      });

      const brandProps = {
        accentColor: body.themeColorOverride || brandAccentColor,
        secondaryColor: body.secondaryColorOverride || undefined,
        primaryText: "#1f2937",
        logoUrl: brandLogoUrl,
        logoAlt: brandCompanyName || "Logo",
      };

      let html: string;
      if (preGeneratedHtml) {
        html = preGeneratedHtml;
      } else if (body.templateId && body.templateId !== "minimal") {
        html = await renderOutreachTemplate(body.templateId, {
          subjectPreview: subject,
          bodyText,
          resources: resolvedResources,
          signatureHtml,
          trackingPixelUrl,
          brand: brandProps,
          templateOptions: body.templateOptions || undefined,
        });
      } else {
        html = await render(
          React.createElement(OutreachTemplate, {
            subjectPreview: subject,
            bodyText,
            resources: resolvedResources,
            signatureHtml,
            trackingPixelUrl,
            brand: brandProps,
            templateOptions: body.templateOptions || undefined,
          }),
        );
      }

      // Prepare plaintext fallback (use the LLM plain text body)
      const text = stripHtml(bodyText);
      // Send email via Team's custom mail service or personal email
      for (const toEmail of toEmails) {
        systemLogger.info(`[OUTREACH_SEND] Sending to=${toEmail}, subject="${subject.substring(0, 60)}", senderMode=${body.senderMode || "company"}, testMode=${testMode}, companyResearch=${companyResearch ? companyResearch.length + "chars" : "none"}`);
        try {
          if (!user.team_id) {
            throw new Error("No team associated with your account.");
          }

          let messageId: string | null = null;
          const senderMode = body.senderMode || "company";

          if (senderMode === "personal") {
            // Personal mode: send via Amazon SES using the user's identity
            await sendSystemEmail({
              to: toEmail,
              subject,
              text,
              html,
              from: `"${senderName || session.user.name || 'Outreach'}" <${session.user.email || process.env.SES_FROM_ADDRESS || 'noreply@basalthq.com'}>`,
            });
            messageId = `ses_personal_${Date.now()}`;
          } else {
            // Company mode: use team email config
            try {
              await sendTeamEmail(user.team_id, {
                to: toEmail,
                subject,
                text,
                html,
                senderId: session.user.id,
              }, "OUTREACH");
              messageId = `team_sent_${Date.now()}`;
            } catch (teamErr: any) {
              // Team email not configured — for test mode, fall back to system email
              if (testMode) {
                systemLogger.warn("[OUTREACH_SEND] Team email failed in test mode, falling back to system email:", teamErr?.message);
                await sendSystemEmail({
                  to: toEmail,
                  subject,
                  text,
                  html,
                  from: process.env.SES_FROM_ADDRESS || 'noreply@basalthq.com',
                });
                messageId = `test_system_sent_${Date.now()}`;
              } else {
                throw teamErr; // Re-throw for real sends — they must use configured email
              }
            }
          }

          // Persist outreach fields (only for real leads with valid ObjectIDs)
          const isRealLead = /^[a-f0-9]{24}$/i.test(lead.id);
          if (isRealLead) {
            try {
              const updateData: any = {
                outreach_status: "SENT" as any,
                outreach_sent_at: new Date() as any,
                outreach_first_message_id: messageId || undefined,
                outreach_open_token: token,
                pipeline_stage: "Engage_AI" as any,
                outreach_transport: (senderMode === "personal" ? "personal" : "team_email") as any,
              };

              if (meetingLink && (!lead.outreach_meeting_link || meetingLinkOverride)) {
                updateData.outreach_meeting_link = meetingLink;
              }

              await prismadb.crm_Leads.update({
                where: { id: lead.id },
                data: updateData,
              });
              await ensureContactForLead(lead.id).catch(() => { });

              // Insert activity
              await prismadb.crm_Lead_Activities.create({
                data: {
                  lead: lead.id,
                  user: session.user.id,
                  type: "email_sent",
                  metadata: {
                    to: toEmail,
                    subject,
                    bodyText,
                    meetingLink,
                    messageId,
                    usedPrompt: (promptOverride && "batchOverride") || (user.outreach_prompt_default ? "userDefault" : "fallback"),
                    pipeline_stage: "Engage_AI",
                  } as any,
                },
              });
            } catch (updateErr: any) {
              systemLogger.warn(`[OUTREACH_SEND] Post-send update failed for lead ${lead.id}: ${updateErr?.message || "record not found"}`);
            }
          }

          results.push({ leadId: lead.id, status: "sent", subject, to: toEmail });
        } catch (err: any) {

          systemLogger.error("[OUTREACH_SEND][SMTP_ERROR]", err?.message || err);
          results.push({ leadId: lead.id, status: "error", reason: err?.message || "Send failed" });
        }
      } // end toEmails loop
    }

    const summary = {
      requested: body.leadIds.length,
      processed: leads.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };

    // Gamification: award bonus credits for first outreach email (fire-and-forget)
    if (summary.sent > 0 && !testMode) {
      claimOnboardingBonus("first_outreach_email").catch(() => { });
    }

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {

    systemLogger.error("[OUTREACH_SEND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
