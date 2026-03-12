import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";
import crypto from "crypto";
import sendEmail from "@/lib/sendmail";

/**
 * GET /api/v1/messages
 * List messages for the tenant.
 * Query params: contactId, leadId, direction, channel, conversation_id, page, pageSize
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);

        const contactId = url.searchParams.get("contactId");
        const leadId = url.searchParams.get("leadId");
        const direction = url.searchParams.get("direction");
        const channel = url.searchParams.get("channel");
        const conversationId = url.searchParams.get("conversation_id");

        // We query crm_Lead_Activities with type containing API_MESSAGE or EMAIL
        const where: any = {
            type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
        };

        // Scope to tenant via lead or contact
        if (contactId) where.contact = contactId;
        if (leadId) where.lead = leadId;
        if (direction) where.direction = direction.toUpperCase();
        if (channel) where.channel = channel.toUpperCase();
        if (conversationId) where.conversation_id = conversationId;

        // If no specific entity filter, scope by looking up all leads/contacts for this tenant
        if (!contactId && !leadId) {
            const [teamLeadIds, teamContactIds] = await Promise.all([
                prismadb.crm_Leads.findMany({
                    where: { team_id: auth!.tenantId },
                    select: { id: true },
                }).then(leads => leads.map(l => l.id)),
                prismadb.crm_Contacts.findMany({
                    where: { team_id: auth!.tenantId },
                    select: { id: true },
                }).then(contacts => contacts.map(c => c.id)),
            ]);

            where.OR = [
                { lead: { in: teamLeadIds } },
                { contact: { in: teamContactIds } },
            ];
        }

        const [messages, total] = await Promise.all([
            prismadb.crm_Lead_Activities.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    conversation_id: true,
                    lead: true,
                    contact: true,
                    type: true,
                    direction: true,
                    channel: true,
                    subject: true,
                    body: true,
                    metadata: true,
                    createdAt: true,
                },
            }),
            prismadb.crm_Lead_Activities.count({ where }),
        ]);

        return apiPaginatedSuccess(messages, total, page, pageSize);
    } catch (err) {
        console.error("[V1_MESSAGES_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch messages", 500);
    }
}

/**
 * POST /api/v1/messages
 * Send an outbound message to a contact or lead.
 * Body: {
 *   to: { contactId?, leadId?, email? },
 *   subject: string,
 *   body: string,
 *   channel: "email" | "sms" | "note" (default: "note"),
 *   conversation_id?: string (auto-generated if omitted),
 *   metadata?: object
 * }
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { to, subject, body: messageBody, channel, conversation_id, metadata } = body;

        if (!to || (!to.contactId && !to.leadId && !to.email)) {
            return apiError("VALIDATION_ERROR", "Must provide to.contactId, to.leadId, or to.email", 400);
        }

        if (!messageBody) {
            return apiError("VALIDATION_ERROR", "body is required", 400);
        }

        // Resolve the target
        let targetContactId: string | null = to.contactId || null;
        let targetLeadId: string | null = to.leadId || null;
        let recipientEmail: string | null = null;

        if (to.email && !targetContactId && !targetLeadId) {
            // Try to find contact by email
            const contact = await prismadb.crm_Contacts.findFirst({
                where: { team_id: auth!.tenantId, email: { equals: to.email, mode: "insensitive" } },
            });
            if (contact) {
                targetContactId = contact.id;
                recipientEmail = contact.email;
            } else {
                // Try lead
                const lead = await prismadb.crm_Leads.findFirst({
                    where: { team_id: auth!.tenantId, email: { equals: to.email, mode: "insensitive" } },
                });
                if (lead) {
                    targetLeadId = lead.id;
                    recipientEmail = lead.email;
                } else {
                    recipientEmail = to.email;
                }
            }
        } else {
            // Fetch email for delivery
            if (targetContactId) {
                const c = await prismadb.crm_Contacts.findFirst({ where: { id: targetContactId, team_id: auth!.tenantId } });
                if (!c) return apiError("NOT_FOUND", "Contact not found", 404);
                recipientEmail = c.email;
            } else if (targetLeadId) {
                const l = await prismadb.crm_Leads.findFirst({ where: { id: targetLeadId, team_id: auth!.tenantId } });
                if (!l) return apiError("NOT_FOUND", "Lead not found", 404);
                recipientEmail = l.email;
            }
        }

        const resolvedChannel = (channel || "NOTE").toUpperCase();
        const convId = conversation_id || crypto.randomUUID();

        // Create the activity record
        const activity = await prismadb.crm_Lead_Activities.create({
            data: {
                v: 0,
                conversation_id: convId,
                lead: targetLeadId || undefined,
                contact: targetContactId || undefined,
                type: "API_MESSAGE",
                direction: "OUTBOUND",
                channel: resolvedChannel,
                subject: subject || undefined,
                body: messageBody,
                metadata: {
                    ...(metadata || {}),
                    source: "api_v1",
                    recipientEmail,
                },
            },
        });

        // If channel is EMAIL, actually send the email
        if (resolvedChannel === "EMAIL" && recipientEmail) {
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: subject || "New Message",
                    text: messageBody,
                });

                // Update metadata with delivery status
                await prismadb.crm_Lead_Activities.update({
                    where: { id: activity.id },
                    data: {
                        metadata: {
                            ...(activity.metadata as any || {}),
                            emailDelivered: true,
                            deliveredAt: new Date().toISOString(),
                        },
                    },
                });
            } catch (emailErr) {
                console.error("[V1_MESSAGE_EMAIL_SEND]", emailErr);
                // Non-fatal: record exists even if delivery fails
            }
        }

        return apiSuccess({
            id: activity.id,
            conversation_id: convId,
            direction: "OUTBOUND",
            channel: resolvedChannel,
            subject,
            body: messageBody,
            recipientEmail,
            createdAt: activity.createdAt,
        }, undefined, 201);
    } catch (err) {
        console.error("[V1_MESSAGES_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to send message", 500);
    }
}
