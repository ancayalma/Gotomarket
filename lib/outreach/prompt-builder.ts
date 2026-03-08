import { TeamBrandIdentity } from "@prisma/client";

interface PromptBuilderParams {
  basePrompt?: string | null;
  contact: {
    name?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  companyResearch?: string | null;
  meetingLink?: string | null;
  channel: "EMAIL" | "SMS" | "FOLLOWUP";
  brandIdentity: Partial<TeamBrandIdentity> | null;
}

export function buildOutreachPrompt({
  basePrompt,
  contact,
  companyResearch,
  meetingLink,
  channel,
  brandIdentity,
}: PromptBuilderParams) {

  // 1. Resolve Brand Identity Text Block
  const brandName = brandIdentity?.company_name || "our company";
  const tagline = brandIdentity?.tagline ? `- Tagline: ${brandIdentity.tagline}` : "";
  const products = brandIdentity?.key_products_services?.length
    ? `- Key Offerings: ${brandIdentity.key_products_services.join(", ")}`
    : "";
  const differentiators = brandIdentity?.competitive_advantages?.length
    ? `- Competitive Advantages: ${brandIdentity.competitive_advantages.join(", ")}`
    : "";
  const painPoints = brandIdentity?.pain_points_solved?.length
    ? `- Problems solved: ${brandIdentity.pain_points_solved.join(", ")}`
    : "";
  const outreachApproach = brandIdentity?.outreach_approach
    ? `- Outreach approach: ${brandIdentity.outreach_approach}`
    : "";
  const ctas = brandIdentity?.cta_preferences?.length
    ? `- Preferred CTA: ${brandIdentity.cta_preferences.join(" or ")}`
    : "";

  const brandBlock = brandIdentity ? `
Company Identity: ${brandName}
${tagline}
${products}
${differentiators}
${painPoints}
${outreachApproach}
${ctas}
  `.trim() : "";

  // 2. Compute Defaults based on Channel if no basePrompt is provided
  let fallbackBase = "";

  if (channel === "EMAIL") {
    fallbackBase = `
You are a professional business development specialist writing a highly personalized outreach email for ${brandName}.
Use any available company research to tailor the message.

${brandBlock}

Requirements:
- Output JSON ONLY with keys "subject" and "body".
- "body" MUST be plain text (no HTML), 250–300 words.
- Style: sophisticated, narrative, insight-driven; open with a hook referencing their company/thesis if possible.
- Personalization: connect our offerings to their focus.
- Use first-person voice ("I").
- Avoid headings like "Founder note:" or similar.
- End with a confident, single Call to Action.
`.trim();

  } else if (channel === "SMS") {
    fallbackBase = `
You are contacting a potential customer about ${brandName}. 
Compose a short, punchy SMS (160-320 chars).

${brandBlock}

Requirements:
- Output JSON ONLY with keys "body".
- "body" MUST be plain text.
- Be extremely concise. Include a crisp value prop.
- Personalize with their name or company if available.
- End with a clear CTA (e.g. reply or click a link).
`.trim();

  } else if (channel === "FOLLOWUP") {
    fallbackBase = `
You are writing a concise follow-up email for ${brandName}. Assume we sent an initial note recently.

${brandBlock}

Requirements:
- Output JSON ONLY with keys "subject" and "body".
- "body" MUST be plain text, under 150 words.
- Tone should be polite, persistent, and value-add (not just "bumping to the top of your inbox").
- Do not make the prospect feel guilty.
- End with a low-friction CTA.
`.trim();
  }

  // 3. Assemble The Final Prompt
  const promptBase = (basePrompt && basePrompt.trim().length > 0 ? basePrompt : fallbackBase).trim();

  const contactBlock = `
Contact:
- Name: ${contact?.name || ""}
- Company/Firm: ${contact?.company || ""}
- Title: ${contact?.jobTitle || ""}
- Email: ${contact?.email || ""}
`.trim();

  const companyBlock = `
Company Research (optional):
${companyResearch && companyResearch.trim().length > 0 ? companyResearch : "N/A"}
`.trim();

  const meetingBlock = `
Meeting preference/link (for CTA): ${meetingLink || "N/A"}
`.trim();

  return [promptBase, contactBlock, companyBlock, meetingBlock].filter(Boolean).join("\\n\\n");
}
