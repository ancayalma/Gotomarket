import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/v1/messages/threads/:threadId
 * Get a full conversation thread by conversation_id.
 * Returns all messages in chronological order.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { threadId } = await params;

        const messages = await prismadb.crm_Lead_Activities.findMany({
            where: {
                conversation_id: threadId,
                type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
            },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                conversation_id: true,
                lead: true,
                contact: true,
                direction: true,
                channel: true,
                subject: true,
                body: true,
                metadata: true,
                createdAt: true,
            },
        });

        if (messages.length === 0) {
            return apiError("NOT_FOUND", "Thread not found", 404);
        }

        // Verify tenant ownership via the first message's lead or contact
        const first = messages[0];
        let verified = false;

        if (first.lead) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { id: first.lead, team_id: auth!.tenantId },
            });
            verified = !!lead;
        }
        if (!verified && first.contact) {
            const contact = await prismadb.crm_Contacts.findFirst({
                where: { id: first.contact, team_id: auth!.tenantId },
            });
            verified = !!contact;
        }

        if (!verified) return apiError("NOT_FOUND", "Thread not found", 404);

        // Build thread summary
        const summary = {
            threadId,
            messageCount: messages.length,
            firstMessageAt: messages[0].createdAt,
            lastMessageAt: messages[messages.length - 1].createdAt,
            participants: {
                leadId: first.lead,
                contactId: first.contact,
            },
        };

        return apiSuccess({ summary, messages });
    } catch (err) {
        console.error("[V1_THREAD_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch thread", 500);
    }
}
