import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/v1/messages/:messageId
 * Get a single message by ID.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { messageId } = await params;

        const message = await prismadb.crm_Lead_Activities.findFirst({
            where: {
                id: messageId,
                type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
            },
        });

        if (!message) return apiError("NOT_FOUND", "Message not found", 404);

        // Verify tenant ownership via lead or contact
        if (message.lead) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { id: message.lead, team_id: auth!.tenantId },
            });
            if (!lead) return apiError("NOT_FOUND", "Message not found", 404);
        } else if (message.contact) {
            const contact = await prismadb.crm_Contacts.findFirst({
                where: { id: message.contact, team_id: auth!.tenantId },
            });
            if (!contact) return apiError("NOT_FOUND", "Message not found", 404);
        }

        // If conversation_id exists, include the full thread
        let thread: any[] = [];
        if (message.conversation_id) {
            thread = await prismadb.crm_Lead_Activities.findMany({
                where: {
                    conversation_id: message.conversation_id,
                    type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
                },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    conversation_id: true,
                    direction: true,
                    channel: true,
                    subject: true,
                    body: true,
                    metadata: true,
                    createdAt: true,
                },
            });
        }

        return apiSuccess({
            ...message,
            thread,
        });
    } catch (err) {
        console.error("[V1_MESSAGE_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch message", 500);
    }
}
