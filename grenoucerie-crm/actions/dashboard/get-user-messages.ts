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

    // 3. Fetch Unread Inbound Emails (user's personal inbox + team-scoped outreach replies)
    const emailWhereClause: any = {
        is_inbound: true,
        is_read: false,
        OR: [
            { user_id: userId },
            ...(teamId ? [{ team_id: teamId }] : []),
        ],
    };

    const unreadEmails = await prismadb.crm_Emails.findMany({
        where: emailWhereClause,
        orderBy: {
            date: "desc"
        },
        take: 100
    });

    // 4. Fetch Unread Inbound SMS + Email Replies (from Lead Activities)
    const unreadActivities = await prismadb.crm_Lead_Activities.findMany({
        where: {
            user: userId,
            type: { in: ["sms_received", "inbound_sms", "reply_received"] },
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 30
    });

    // 5. Fetch recent Email Threads (crm_Email_Thread — SES inbox, the primary email source)
    let emailThreadItems: any[] = [];
    if (teamId) {
        try {
            const recentThreads = await prismadb.crm_Email_Thread.findMany({
                where: {
                    OR: [
                        { team_id: teamId },
                        { user: userId },
                    ]
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            });

            emailThreadItems = recentThreads.map((thread: any) => {
                const isInbound = thread.direction === "INBOUND";
                return {
                    id: thread.id,
                    type: 'email' as const,
                    createdAt: thread.receivedAt || thread.createdAt,
                    title: thread.subject || thread.thread_subject || "(No Subject)",
                    body: thread.body_text?.substring(0, 150) || "",
                    sender: {
                        name: isInbound
                            ? (thread.from_name || thread.from_email || "Unknown")
                            : (thread.to_email || "Outbound"),
                        email: isInbound ? thread.from_email : thread.to_email,
                        avatar: null as string | null
                    },
                    url: thread.lead ? `/crm/leads/${thread.lead}` : `/messages`
                };
            });
        } catch (e) {
            // Model may not exist in all environments
            emailThreadItems = [];
        }
    }

    // 6. Normalize and Combine
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
        ...unreadActivities.map((s: any) => {
            const meta = (s.metadata || {}) as any;
            const isEmailReply = s.type === "reply_received";
            return {
                id: s.id,
                type: isEmailReply ? 'email' as const : 'message' as const,
                createdAt: s.createdAt,
                title: isEmailReply ? "Email Reply Received" : "New SMS Received",
                body: meta?.snippet || meta?.message || s.notes || (isEmailReply ? "Email reply" : "SMS Message"),
                sender: {
                    name: meta?.from_email || meta?.from_phone || "Unknown",
                    email: meta?.from_email || null,
                    avatar: null as string | null
                },
                url: `/crm/leads/${s.lead || s.id}`
            };
        }),
        ...emailThreadItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);

    return notifications;
};
