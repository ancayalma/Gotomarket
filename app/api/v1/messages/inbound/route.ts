import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * POST /api/v1/messages/inbound
 * Webhook-style endpoint for the ecommerce site to push customer replies/messages INTO the CRM.
 * 
 * Body: {
 *   contactId?: string,
 *   leadId?: string,
 *   email?: string,         // Used to auto-resolve to a contact/lead
 *   body: string,
 *   subject?: string,
 *   conversation_id?: string,  // To append to an existing thread
 *   channel?: "email" | "sms" | "api",
 *   metadata?: { orderId?, source?, ... }
 * }
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { contactId, leadId, email, body: messageBody, subject, conversation_id, channel, metadata } = body;

        if (!messageBody) {
            return apiError("VALIDATION_ERROR", "body is required", 400);
        }

        if (!contactId && !leadId && !email) {
            return apiError("VALIDATION_ERROR", "Provide contactId, leadId, or email to identify the sender", 400);
        }

        // Resolve the sender
        let resolvedContactId: string | null = contactId || null;
        let resolvedLeadId: string | null = leadId || null;

        if (email && !resolvedContactId && !resolvedLeadId) {
            // Try contact first
            const contact = await prismadb.crm_Contacts.findFirst({
                where: { team_id: auth!.tenantId, email: { equals: email, mode: "insensitive" } },
            });
            if (contact) {
                resolvedContactId = contact.id;
            } else {
                const lead = await prismadb.crm_Leads.findFirst({
                    where: { team_id: auth!.tenantId, email: { equals: email, mode: "insensitive" } },
                });
                if (lead) {
                    resolvedLeadId = lead.id;
                }
            }

            // If neither found, auto-create a contact
            if (!resolvedContactId && !resolvedLeadId) {
                const newContact = await prismadb.crm_Contacts.create({
                    data: {
                        v: 0,
                        team_id: auth!.tenantId,
                        email,
                        last_name: email.split("@")[0] || "Unknown",
                        type: "Customer",
                        tags: ["auto-created", "inbound-api"],
                    },
                });
                resolvedContactId = newContact.id;
            }
        }

        // Verify ownership
        if (resolvedContactId) {
            const c = await prismadb.crm_Contacts.findFirst({
                where: { id: resolvedContactId, team_id: auth!.tenantId },
            });
            if (!c) return apiError("NOT_FOUND", "Contact not found in your tenant", 404);
        }
        if (resolvedLeadId) {
            const l = await prismadb.crm_Leads.findFirst({
                where: { id: resolvedLeadId, team_id: auth!.tenantId },
            });
            if (!l) return apiError("NOT_FOUND", "Lead not found in your tenant", 404);
        }

        const resolvedChannel = (channel || "API").toUpperCase();

        // Create inbound activity record
        const activity = await prismadb.crm_Lead_Activities.create({
            data: {
                v: 0,
                conversation_id: conversation_id || undefined,
                lead: resolvedLeadId || undefined,
                contact: resolvedContactId || undefined,
                type: "API_MESSAGE",
                direction: "INBOUND",
                channel: resolvedChannel,
                subject: subject || undefined,
                body: messageBody,
                metadata: {
                    ...(metadata || {}),
                    source: "inbound_api_v1",
                    senderEmail: email,
                },
            },
        });

        // Update last_activity on the contact
        if (resolvedContactId) {
            prismadb.crm_Contacts.update({
                where: { id: resolvedContactId },
                data: { last_activity: new Date() },
            }).catch(() => { /* non-critical */ });
        }

        return apiSuccess({
            id: activity.id,
            conversation_id: activity.conversation_id,
            direction: "INBOUND",
            channel: resolvedChannel,
            contactId: resolvedContactId,
            leadId: resolvedLeadId,
            createdAt: activity.createdAt,
        }, undefined, 201);
    } catch (err) {
        console.error("[V1_MESSAGES_INBOUND_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to record inbound message", 500);
    }
}
