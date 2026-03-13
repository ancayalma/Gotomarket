import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * DELETE /api/crm/messages/thread
 * Delete all crm_Lead_Activities messages in a thread.
 * Body: { messageIds: string[] }  — IDs of activities to delete
 *   OR: { conversationId: string } — delete by conversation_id
 *   OR: { contactId: string }      — delete all API messages for a contact
 *   OR: { leadId: string }         — delete all API messages for a lead
 */
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        const userId = (session as any)?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;
        if (!teamId) {
            return NextResponse.json({ error: "No team found" }, { status: 400 });
        }

        const body = await req.json();
        const { messageIds, conversationId, contactId, leadId } = body;

        // Build the where clause
        let where: any = {
            type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
        };

        if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
            where.id = { in: messageIds };
        } else if (conversationId) {
            where.conversation_id = conversationId;
        } else if (contactId) {
            where.contact = contactId;
        } else if (leadId) {
            where.lead = leadId;
        } else {
            return NextResponse.json({ error: "Provide messageIds, conversationId, contactId, or leadId" }, { status: 400 });
        }

        // Verify team ownership by checking at least one record belongs to team leads/contacts
        const [teamLeadIds, teamContactIds] = await Promise.all([
            prismadb.crm_Leads.findMany({
                where: { team_id: teamId },
                select: { id: true },
            }).then((leads: { id: string }[]) => leads.map(l => l.id)),
            prismadb.crm_Contacts.findMany({
                where: { team_id: teamId },
                select: { id: true },
            }).then((contacts: { id: string }[]) => contacts.map(c => c.id)),
        ]);

        // Scope deletion to team's leads/contacts only
        where.OR = [
            { lead: { in: teamLeadIds } },
            { contact: { in: teamContactIds } },
        ];

        const result = await prismadb.crm_Lead_Activities.deleteMany({ where });

        return NextResponse.json({
            ok: true,
            deleted: result.count,
        });
    } catch (error: any) {
        console.error("[CRM_MESSAGES_THREAD_DELETE]", error?.message || error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
