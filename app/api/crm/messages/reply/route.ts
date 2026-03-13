import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import sendEmail from "@/lib/sendmail";
import crypto from "crypto";

/**
 * POST /api/crm/messages/reply
 * Reply to an API-originated message thread.
 * Creates a new crm_Lead_Activities record in the same conversation_id.
 * Body: {
 *   messageId: string,         // The message being replied to
 *   body: string,              // Reply content
 *   subject?: string,          // Optional subject override
 *   channel?: string,          // "email" | "note" (default: matches original)
 *   sendEmail?: boolean,       // Whether to actually send email
 * }
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        const userId = (session as any)?.user?.id as string | undefined;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        if (!teamId) {
            return NextResponse.json({ error: "No team found" }, { status: 400 });
        }

        const body = await req.json();
        const { messageId, body: replyBody, subject, channel, sendEmail: shouldSendEmail } = body;

        if (!messageId || !replyBody?.trim()) {
            return NextResponse.json(
                { error: "messageId and body are required" },
                { status: 400 }
            );
        }

        // Fetch the original message to get conversation context
        const originalMessage = await prismadb.crm_Lead_Activities.findUnique({
            where: { id: messageId },
        });

        if (!originalMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        const meta = (originalMessage.metadata || {}) as any;

        // Resolve the contact/lead email for delivery
        let recipientEmail: string | null = null;

        if (originalMessage.contact) {
            const contact = await prismadb.crm_Contacts.findFirst({
                where: { id: originalMessage.contact, team_id: teamId },
                select: { email: true },
            });
            recipientEmail = contact?.email || null;
        } else if (originalMessage.lead) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { id: originalMessage.lead, team_id: teamId },
                select: { email: true },
            });
            recipientEmail = lead?.email || null;
        }

        // Fallback to metadata email
        if (!recipientEmail) {
            recipientEmail = meta.recipientEmail || meta.fromEmail || null;
        }

        const resolvedChannel = (channel || originalMessage.channel || "NOTE").toUpperCase();
        const convId = originalMessage.conversation_id || crypto.randomUUID();

        // Create the reply activity
        const reply = await prismadb.crm_Lead_Activities.create({
            data: {
                v: 0,
                conversation_id: convId,
                lead: originalMessage.lead || undefined,
                contact: originalMessage.contact || undefined,
                type: "API_MESSAGE",
                direction: "OUTBOUND",
                channel: resolvedChannel,
                subject: subject || originalMessage.subject || undefined,
                body: replyBody.trim(),
                user: userId,
                metadata: {
                    source: "crm_reply",
                    in_reply_to: messageId,
                    recipientEmail,
                    senderName: (session as any)?.user?.name || "CRM User",
                },
            },
        });

        // If channel is EMAIL and we have a recipient, send the actual email
        if (resolvedChannel === "EMAIL" && recipientEmail && shouldSendEmail !== false) {
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: subject || `Re: ${originalMessage.subject || "Your message"}`,
                    text: replyBody.trim(),
                });

                // Update metadata with delivery confirmation
                await prismadb.crm_Lead_Activities.update({
                    where: { id: reply.id },
                    data: {
                        metadata: {
                            ...(reply.metadata as any || {}),
                            emailDelivered: true,
                            deliveredAt: new Date().toISOString(),
                        },
                    },
                });
            } catch (emailErr) {
                console.error("[CRM_REPLY_EMAIL_SEND]", emailErr);
                // Non-fatal — reply record exists even if email fails
            }
        }

        return NextResponse.json({
            ok: true,
            reply: {
                id: reply.id,
                conversation_id: convId,
                direction: "OUTBOUND",
                channel: resolvedChannel,
                subject: reply.subject,
                body: reply.body,
                recipientEmail,
                createdAt: reply.createdAt,
            },
        });
    } catch (error: any) {
        console.error("[CRM_MESSAGES_REPLY_ERROR]", error?.message || error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
