/**
 * LinkedIn Social Selling Integration
 * 
 * Manages LinkedIn outreach sequences:
 * - Connection requests with personalized notes
 * - Follow-up InMail/messages after connection accepted
 * - Profile research data enrichment
 * - Activity tracking
 * 
 * NOTE: LinkedIn doesn't have a public API for messaging.
 * This module manages the sequence workflow and data —
 * actual sending can be done via:
 *   1. Sales Navigator API (if team has partnership)
 *   2. Browser extension bridge
 *   3. Manual send with copy-to-clipboard
 */

import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

export interface LinkedInSequenceStep {
    order: number;
    action: "connect" | "message" | "inmail" | "engage" | "view_profile";
    delay_days: number; // Days after previous step
    template: string;
    condition?: string; // e.g. "connection_accepted", "no_response"
}

export interface LinkedInLead {
    leadId: string;
    name: string;
    profileUrl: string;
    title?: string;
    company?: string;
}

// ── Create a LinkedIn outreach sequence ─────────────────────────────────────
export async function createLinkedInSequence(
    campaignId: string,
    leads: LinkedInLead[],
    steps: LinkedInSequenceStep[]
): Promise<{ created: number }> {
    let created = 0;

    for (const lead of leads) {
        // Create the first step as an outreach item
        const firstStep = steps[0];
        if (!firstStep) continue;

        const message = personalizeTemplate(firstStep.template, {
            name: lead.name,
            first_name: lead.name.split(" ")[0],
            title: lead.title || "",
            company: lead.company || "",
        });

        await prismadb.crm_Outreach_Items.create({
            data: {
                campaign: campaignId,
                lead: lead.leadId,
                channel: "LINKEDIN",
                status: "READY",
                linkedin_profile_url: lead.profileUrl,
                linkedin_message: message,
                linkedin_action: firstStep.action,
                research_data: {
                    sequence_steps: steps,
                    current_step: 0,
                    lead_info: lead,
                },
            },
        });
        created++;
    }

    return { created };
}

// ── Advance to next step in LinkedIn sequence ───────────────────────────────
export async function advanceLinkedInStep(
    itemId: string,
    outcome: "accepted" | "no_response" | "replied"
): Promise<{ nextAction: string | null }> {
    const item = await prismadb.crm_Outreach_Items.findUnique({
        where: { id: itemId },
    });

    if (!item || item.channel !== "LINKEDIN") {
        return { nextAction: null };
    }

    const researchData = (item.research_data as any) || {};
    const steps: LinkedInSequenceStep[] = researchData.sequence_steps || [];
    const currentStep = researchData.current_step || 0;

    // Find next applicable step
    let nextStepIdx = currentStep + 1;
    while (nextStepIdx < steps.length) {
        const step = steps[nextStepIdx];
        if (!step.condition || step.condition === outcome) break;
        nextStepIdx++;
    }

    if (nextStepIdx >= steps.length) {
        // Sequence complete
        await prismadb.crm_Outreach_Items.update({
            where: { id: itemId },
            data: { status: outcome === "replied" ? "REPLIED" : "SENT" },
        });
        return { nextAction: null };
    }

    const nextStep = steps[nextStepIdx];
    const leadInfo = researchData.lead_info || {};

    const message = personalizeTemplate(nextStep.template, {
        name: leadInfo.name || "",
        first_name: (leadInfo.name || "").split(" ")[0],
        title: leadInfo.title || "",
        company: leadInfo.company || "",
    });

    // Update the item for the next step
    await prismadb.crm_Outreach_Items.update({
        where: { id: itemId },
        data: {
            linkedin_message: message,
            linkedin_action: nextStep.action,
            status: "READY",
            research_data: {
                ...researchData,
                current_step: nextStepIdx,
                last_outcome: outcome,
            },
        },
    });

    systemLogger.info(`[LINKEDIN_SEQ] Advanced item ${itemId} to step ${nextStepIdx}: ${nextStep.action}`);
    return { nextAction: nextStep.action };
}

// ── Get LinkedIn sequence status ────────────────────────────────────────────
export async function getLinkedInSequenceStatus(campaignId: string) {
    const items = await prismadb.crm_Outreach_Items.findMany({
        where: {
            campaign: campaignId,
            channel: "LINKEDIN",
        },
        select: {
            id: true,
            status: true,
            linkedin_action: true,
            linkedin_profile_url: true,
            research_data: true,
            sentAt: true,
            repliedAt: true,
            assigned_lead: {
                select: { firstName: true, lastName: true, company: true },
            },
        },
    });

    const stats = {
        total: items.length,
        pending: items.filter((i: any) => i.status === "PENDING" || i.status === "READY").length,
        sent: items.filter((i: any) => i.status === "SENT" || i.status === "DELIVERED").length,
        replied: items.filter((i: any) => i.status === "REPLIED").length,
        connectionRate: 0,
        replyRate: 0,
    };

    if (stats.total > 0) {
        stats.connectionRate = Math.round((stats.sent / stats.total) * 100);
        stats.replyRate = Math.round((stats.replied / stats.total) * 100);
    }

    return { items, stats };
}

// ── LinkedIn message templates ──────────────────────────────────────────────
export const LINKEDIN_TEMPLATES = {
    connection_request: {
        name: "Connection Request",
        template: `Hi {{first_name}}, I noticed your work as {{title}} at {{company}}. I'd love to connect and share some insights on how similar teams are driving results. Looking forward to connecting!`,
    },
    follow_up_message: {
        name: "Follow-up Message",
        template: `Thanks for connecting, {{first_name}}! I work with {{title}}s at companies like {{company}} to help them streamline their sales process. Would you be open to a quick 15-min chat this week?`,
    },
    inmail_cold: {
        name: "Cold InMail",
        template: `Hi {{first_name}}, I came across your profile and was impressed by your role at {{company}}. I have a few ideas that could help your team — mind if I share more?`,
    },
    value_add: {
        name: "Value-Add Message",
        template: `{{first_name}}, I recently published a guide on [topic] that's been helpful for {{title}}s. Happy to share it with you — no strings attached!`,
    },
};

// ── Template personalization ────────────────────────────────────────────────
function personalizeTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}
