"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getUserMessages = async () => {
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.userId) return [];

    const userId = teamInfo.userId;
    const teamId = teamInfo.teamId;

    // 1. Fetch Unread Messages (Filtered by Team)
    const internalMessages = await prismadb.internalMessageRecipient.findMany({
        where: {
            recipient_id: userId,
            is_read: false,
            is_deleted: false,
            is_archived: false,
            message: {
                team_id: teamId || "no-team-fallback"
            }
        },
        include: {
            message: true
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 100
    });

    // 2. Fetch New Form Submissions (Team-wide)
    let formSubmissions: any[] = [];
    if (teamId) {
        formSubmissions = await (prismadb as any).formSubmission.findMany({
            where: {
                team_id: teamId,
                status: "NEW"
            },
            include: {
                form: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100
        });
    }

    // 3. Fetch Unread Inbound Emails
    const unreadEmails = await prismadb.crm_Emails.findMany({
        where: {
            user_id: userId,
            is_inbound: true,
            is_read: false,
        },
        orderBy: {
            date: "desc"
        },
        take: 100
    });

    // 4. Fetch Unread Inbound SMS
    const unreadSms = await prismadb.crm_Lead_Activities.findMany({
        where: {
            user: userId,
            type: { in: ["sms_received", "inbound_sms"] },
            // If there's an is_read flag, add it here. Otherwise, rely on a recent timeframe or status
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 30
    });

    // 5. Normalize and Combine
    const notifications = [
        ...(internalMessages as any[]).map(m => ({
            id: m.message.id,
            type: 'message' as const,
            createdAt: m.createdAt,
            title: m.message.subject,
            body: m.message.body_text || "No content",
            sender: {
                name: m.message.sender_name || "System",
                email: m.message.sender_email,
                avatar: null as string | null
            },
            url: `/messages?id=${m.message.id}` 
        })),
        ...formSubmissions.map(f => ({
            id: f.id,
            type: 'form' as const,
            createdAt: f.createdAt,
            title: `New Submission: ${f.form.name}`,
            body: `From: ${f.extracted_email || 'Anonymous'}`,
            sender: {
                name: f.extracted_name || "Form System",
                email: f.extracted_email,
                avatar: null as string | null
            },
            url: `/messages?tab=forms&id=${f.id}`
        })),
        ...unreadEmails.map((e: any) => ({
            id: e.message_id, // Important to use message_id or id, we'll use id so marking read works
            type: 'email' as const,
            createdAt: e.date,
            title: e.subject || "No Subject",
            body: e.snippet || "",
            sender: {
                name: e.from_name || e.from_email || "Unknown",
                email: e.from_email,
                avatar: null as string | null
            },
            url: `/crm/leads/${e.lead_id || e.id}` // Redirect to lead or message page
        })),
        ...unreadSms.map((s: any) => ({
            id: s.id,
            type: 'message' as const, // Treat as generic message for icon mapping if no sms type exists
            createdAt: s.createdAt,
            title: "New SMS Received",
            body: (s.metadata as any)?.message || s.notes || "SMS Message",
            sender: {
                name: (s.metadata as any)?.from_phone || "Unknown Number",
                email: null,
                avatar: null as string | null
            },
            url: `/crm/leads/${s.lead || s.id}`
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);

    return notifications;
};
