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
  sender?: {
    name?: string | null;
    title?: string | null;
    company?: string | null;
  };
  companyResearch?: string | null;
  meetingLink?: string | null;
  channel: "EMAIL" | "SMS" | "FOLLOWUP" | "REPLY";
  brandIdentity: Partial<TeamBrandIdentity> | null;
  inboundMessage?: string | null;
  conversationHistory?: string[] | null;
  availableDocuments?: { name: string; type?: string }[] | null;
  availableResources?: { label: string; url: string }[] | null;
}

export function buildOutreachPrompt({
  basePrompt,
  contact,
  sender,
  companyResearch,
  meetingLink,
  channel,
  brandIdentity,
  inboundMessage,
  conversationHistory,
  availableDocuments,
  availableResources,
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

  const senderName = sender?.name || "the sender";
  const senderTitle = sender?.title || "";
  const senderCompany = sender?.company || brandName;

  if (channel === "EMAIL") {
    fallbackBase = `\r\nYou are ghostwriting a personalized outreach email ON BEHALF of ${senderName}${senderTitle ? ` (${senderTitle})` : ""} from ${senderCompany}.\r\nWrite entirely in first person (I/me) as ${senderName}. Never refer to ${senderName} in third person.\r\nUse any available company research to tailor the message to the recipient.\r\n\r\n${brandBlock}\r\n\r\nRequirements:\r\n- Output JSON ONLY with keys "subject" and "body".\r\n- "body" MUST be plain text (no HTML), 250\u2013300 words.\r\n- MUST start with a proper greeting addressing the recipient by their first name (e.g., "Hi {firstName}," or "Dear {firstName},"). Never skip the greeting.\r\n- MUST end with an appropriate professional sign-off. Choose a sign-off that fits the tone of the email (e.g., Sincerely, Regards, Warm regards, Best, Cheers, Looking forward). Follow the sign-off with the sender's name: ${senderName}${senderTitle ? ` and their title: ${senderTitle}` : ""}.\r\n- Style: sophisticated, narrative, insight-driven; after the greeting, open with a hook referencing their company/thesis if possible.\r\n- Personalization: connect our offerings to their focus using the company research provided.\r\n- Use first-person voice ("I") throughout. Write as ${senderName}.\r\n- Avoid headings like "Founder note:" or similar.\r\n- End the body (before sign-off) with a confident, single Call to Action.\r\n`.trim();

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
  } else if (channel === "REPLY") {
    fallbackBase = `
You are writing a reply to an inbound email from a lead. You are responding ON BEHALF of ${senderName}${senderTitle ? ` (${senderTitle})` : ""} from ${senderCompany}.
Write entirely in first person (I/me) as ${senderName}. Never refer to ${senderName} in third person.

${brandBlock}

Requirements:
- Output JSON ONLY with keys "subject" and "body".
- "body" MUST be plain text (no HTML), 150-250 words.
- Respond DIRECTLY to the lead's message — address their specific questions, interest, or objections.
- Be warm, professional, and helpful. Show genuine engagement with what they said.
- If they expressed interest, acknowledge it and move toward the next step (meeting, demo, etc.).
- If they had objections or questions, address them honestly using the brand context.
- End with a clear, low-friction CTA (preferably linking to a meeting/calendar).
- Do NOT re-introduce yourself or the company at length — they already know from the original outreach.
- Keep it conversational and concise. Match the lead's energy level.
- Start with a greeting addressing them by first name.
- Sign off as ${senderName}.
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

  const senderBlock = sender?.name ? `
Sender Identity (write as this person):
- Name: ${sender.name}
${sender.title ? `- Title: ${sender.title}` : ""}
- Company: ${sender.company || brandName}
`.trim() : "";

  // Inbound message context (for REPLY channel)
  const inboundBlock = inboundMessage ? `
Lead's inbound message (respond to this):
"""${inboundMessage}"""
`.trim() : "";

  // Conversation history (for REPLY channel)
  const historyBlock = conversationHistory?.length ? `
Previous conversation (most recent first):
${conversationHistory.map((m: string, i: number) => `[${i + 1}] ${m}`).join("\n")}
`.trim() : "";

  // Available documents (for attachment decisions)
  const docsBlock = availableDocuments?.length ? `
Available campaign documents (you may suggest attaching these when relevant):
${availableDocuments.map((d) => `- ${d.name}${d.type ? ` (${d.type})` : ""}`).join("\n")}
`.trim() : "";

  // Available resources (buttons/links the email template includes)
  const resourcesBlock = availableResources?.length ? `
Resources included in the email template (you can reference these in your message):
${availableResources.map((r) => `- ${r.label}: ${r.url}`).join("\n")}
`.trim() : "";

  return [promptBase, senderBlock, contactBlock, companyBlock, meetingBlock, inboundBlock, historyBlock, docsBlock, resourcesBlock].filter(Boolean).join("\\n\\n");
}
