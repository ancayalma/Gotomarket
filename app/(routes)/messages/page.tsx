import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Container from "../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionaries";
import { prismadb } from "@/lib/prisma";
import { InternalMessagesComponent } from "./components/InternalMessagesComponent";
import { LearnLink } from "@/components/ui/LearnLink";

import { getCurrentUserTeamId } from "@/lib/team-utils";

const MessagesRoute = async () => {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;
    const teamRole = (session.user as any).team_role;
    const lang = session.user.userLanguage;
    const dict = await getDictionary(lang as "en" | "cz" | "de");

    // PLATFORM_ADMIN has god mode - fetch ALL team members across teams
    const isPlatformAdmin = teamRole === "PLATFORM_ADMIN";

    // Fetch team members (god mode for PLATFORM_ADMIN)
    const teamMembers = await prismadb.users.findMany({
        where: isPlatformAdmin ? {} : { team_id: teamId || undefined },
        select: {
            id: true,
            name: true,
            email: true,
            team_id: true,
            assigned_team: {
                select: { name: true }
            }
        },
        take: isPlatformAdmin ? 500 : 100, // Limit for performance
    });

    // Fetch messages from InternalMessage table
    let messages: any[] = [];
    try {
        const rawMessages = await prismadb.internalMessage.findMany({
            where: {
                team_id: teamId,
                OR: [
                    { sender_id: session.user.id },
                    { recipients: { some: { recipient_id: session.user.id } } },
                ],
            },
            include: {
                recipients: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        messages = (rawMessages as any[]).map((m: any) => {
            let toUserId = "";
            // Determine primary "to_user" for UI display
            if (m.sender_id === session.user.id) {
                toUserId = m.recipients[0]?.recipient_id || "";
            } else {
                toUserId = session.user.id;
            }

            const myRecipient = (m.recipients as any[]).find((r: any) => r.recipient_id === session.user.id);

            const fromUser = (teamMembers as any[]).find((u: any) => u.id === m.sender_id) || { id: m.sender_id, name: m.sender_name, email: m.sender_email };
            const toUser = (teamMembers as any[]).find((u: any) => u.id === toUserId) || { id: toUserId, name: "Unknown", email: "" };

            return {
                id: m.id,
                subject: m.subject,
                body: m.body_text || m.body_html || "",
                createdAt: m.createdAt,
                is_read: myRecipient?.is_read || false,
                is_important: m.priority === "URGENT" || m.priority === "HIGH",
                labels: m.labels,
                from_user_id: m.sender_id,
                to_user_id: toUserId,
                from_user: fromUser,
                to_user: toUser,
                recipients: m.recipients,
                status: m.status
            };
        });

        const rawEmails = await prismadb.crm_Emails.findMany({
            where: {
                user_id: session.user.id
            },
            orderBy: { date: "desc" },
            take: 100,
        });

        const mappedEmails = rawEmails.map((email: any) => {
            const isMeSender = !email.is_inbound;

            const fromUser = isMeSender
                ? { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email }
                : { id: email.from_email || `ext-${email.id}`, name: email.from_name || email.from_email, email: email.from_email };

            const toUser = isMeSender
                ? { id: email.to_emails?.[0]?.email || `ext-${email.id}`, name: email.to_emails?.[0]?.email, email: email.to_emails?.[0]?.email }
                : { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email };

            return {
                id: email.id,
                subject: email.subject || "(No Subject)",
                body: email.snippet || "",
                createdAt: email.date,
                is_read: email.is_read,
                is_important: false,
                labels: [email.provider || "email"],
                from_user_id: fromUser.id as string,
                to_user_id: toUser.id as string,
                from_user: fromUser,
                to_user: toUser,
                recipients: isMeSender ? [] : [{ recipient_id: session.user.id, is_read: email.is_read }],
                status: "SENT"
            };
        });

        // 3. Get all leads/contacts for this team — include names for display (used for API and SES messages)
        const [teamLeads, teamContacts] = await Promise.all([
            prismadb.crm_Leads.findMany({
                where: { team_id: teamId || undefined },
                select: { id: true, firstName: true, lastName: true, email: true },
            }),
            prismadb.crm_Contacts.findMany({
                where: { team_id: teamId || undefined },
                select: { id: true, first_name: true, last_name: true, email: true },
            }),
        ]);

        const teamLeadIds = teamLeads.map((l: any) => l.id);
        const teamContactIds = teamContacts.map((c: any) => c.id);

        // Build lookup maps for resolving IDs → display names
        const contactMap = new Map<string, { name: string; email: string }>();
        teamContacts.forEach((c: any) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unknown Contact";
            contactMap.set(c.id, { name, email: c.email || "" });
        });

        const leadMap = new Map<string, { name: string; email: string }>();
        teamLeads.forEach((l: any) => {
            const name = [l.firstName, l.lastName].filter(Boolean).join(" ") || l.email || "Unknown Lead";
            leadMap.set(l.id, { name, email: l.email || "" });
        });

        // 3.5. Fetch API-originated messages (v1 messages endpoint)
        let apiMessages: any[] = [];
        try {
            const rawApiMessages = await prismadb.crm_Lead_Activities.findMany({
                where: {
                    type: { in: ["API_MESSAGE", "EMAIL", "SMS", "NOTE"] },
                    direction: { not: null },
                    OR: [
                        { lead: { in: teamLeadIds } },
                        { contact: { in: teamContactIds } },
                    ],
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            });

            // Build individual message objects
            const allApiMsgs = rawApiMessages.map((act: any) => {
                const meta = (act.metadata || {}) as any;
                const isOutbound = act.direction === "OUTBOUND";

                let clientName = "Customer";
                let clientEmail = meta.recipientEmail || meta.fromEmail || "";

                if (act.contact && contactMap.has(act.contact)) {
                    const info = contactMap.get(act.contact)!;
                    clientName = info.name;
                    clientEmail = clientEmail || info.email;
                } else if (act.lead && leadMap.has(act.lead)) {
                    const info = leadMap.get(act.lead)!;
                    clientName = info.name;
                    clientEmail = clientEmail || info.email;
                }

                return {
                    id: act.id,
                    subject: act.subject || `${act.channel || "API"} Message`,
                    body: act.body || act.notes || "",
                    createdAt: act.createdAt,
                    is_read: true,
                    is_important: false,
                    labels: [`api-${(act.channel || "note").toLowerCase()}`, act.direction?.toLowerCase() || "outbound"],
                    from_user_id: isOutbound ? session.user.id : `api-${act.id}`,
                    to_user_id: isOutbound ? `api-${act.id}` : session.user.id,
                    from_user: isOutbound
                        ? { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email }
                        : { id: `api-${act.id}`, name: clientName, email: clientEmail },
                    to_user: isOutbound
                        ? { id: `api-${act.id}`, name: clientName, email: clientEmail }
                        : { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email },
                    recipients: isOutbound ? [] : [{ recipient_id: session.user.id, is_read: true }],
                    status: "SENT",
                    direction: act.direction,
                    senderName: isOutbound ? (session.user.name || "You") : clientName,
                    _apiMeta: {
                        conversation_id: act.conversation_id,
                        direction: act.direction,
                        channel: act.channel,
                        contactId: act.contact,
                        leadId: act.lead,
                        clientName,
                        clientEmail,
                    }
                };
            });

            // Group by conversation_id into threads
            // Fallback: if no conversation_id, group by contact/lead so all messages for the same person form one thread
            const threadMap = new Map<string, any[]>();
            for (const msg of allApiMsgs) {
                const key = msg._apiMeta?.conversation_id
                    || (msg._apiMeta?.contactId ? `contact:${msg._apiMeta.contactId}` : null)
                    || (msg._apiMeta?.leadId ? `lead:${msg._apiMeta.leadId}` : null)
                    || msg.id;
                if (!threadMap.has(key)) {
                    threadMap.set(key, []);
                }
                threadMap.get(key)!.push(msg);
            }

            // For each thread, use the LATEST message as the list entry
            // Attach all messages as _thread sorted chronologically (oldest first)
            Array.from(threadMap.entries()).forEach(([convId, threadMsgs]) => {
                // Sort thread chronologically (oldest first for chat display)
                threadMsgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                // The representative entry = latest message (last in sorted array)
                const latest = threadMsgs[threadMsgs.length - 1];
                // Find first inbound message for the "from" display
                const firstInbound = threadMsgs.find((m: any) => m._apiMeta?.direction === "INBOUND");
                const clientInfo = firstInbound || threadMsgs[0];

                apiMessages.push({
                    ...latest,
                    // From = the customer (client), To = the CRM user (you)
                    from_user: { id: `api-thread-${convId}`, name: clientInfo._apiMeta?.clientName || clientInfo.from_user?.name || "Customer", email: clientInfo._apiMeta?.clientEmail || "" },
                    from_user_id: clientInfo.from_user_id,
                    to_user: { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email },
                    to_user_id: session.user.id,
                    // Show snippet from the latest message
                    body: latest.body,
                    // Thread data for chat-style rendering
                    _thread: threadMsgs,
                });
            });
        } catch (e) {
            console.error("Failed to fetch API messages", e);
            apiMessages = [];
        }

        // 4. Fetch SES Full Inbox Threads (crm_Email_Thread)
        let emailThreads: any[] = [];
        try {
            const rawThreads = await prismadb.crm_Email_Thread.findMany({
                where: {
                    OR: [
                        { team_id: teamId || undefined },
                        { user: session.user.id },
                    ]
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            });

            // Group by lead ID or email address
            const sesThreadMap = new Map<string, any[]>();
            
            rawThreads.forEach((thread: any) => {
                const isOutbound = thread.direction === "OUTBOUND";
                const clientName = thread.from_name || thread.from_email || "Customer";
                const clientEmail = isOutbound ? thread.to_email : thread.from_email;

                // Try to map to CRM contact/lead if exists
                let resolvedName = clientName;
                if (thread.lead && leadMap.has(thread.lead)) {
                    resolvedName = leadMap.get(thread.lead)!.name;
                }

                // Resolve the actual destination user:
                // For INBOUND, parse the to_email prefix (e.g., mmilton@reply.basalthq.com → mmilton)
                // to find the correct team member, since the thread's user field may be stale
                const threadUserId = thread.user;
                let resolvedToUser: { id: string; name: string | null; email: string | null } = 
                    { id: session.user.id, name: session.user.name || session.user.email || null, email: session.user.email || null };

                if (!isOutbound && thread.to_email) {
                    // Parse prefix from reply address (mmilton@reply.basalthq.com → mmilton)
                    const toEmails = thread.to_email.split(",").map((e: string) => e.trim());
                    const replyAddr = toEmails.find((e: string) => e.includes("reply.")) || toEmails[0];
                    if (replyAddr) {
                        const prefix = replyAddr.split("@")[0].toLowerCase();
                        if (prefix && prefix !== "sysadm") {
                            const matched = (teamMembers as any[]).find((u: any) => 
                                u.email && u.email.toLowerCase().startsWith(prefix + "@")
                            );
                            if (matched) {
                                resolvedToUser = matched;
                            }
                        }
                    }
                } else if (threadUserId && threadUserId !== session.user.id) {
                    const found = (teamMembers as any[]).find((u: any) => u.id === threadUserId);
                    if (found) resolvedToUser = found;
                }

                const msg = {
                    id: thread.id,
                    subject: thread.subject || thread.thread_subject || "(No Subject)",
                    body: thread.body_text || thread.body_html || "",
                    createdAt: thread.receivedAt || thread.createdAt,
                    is_read: true, // Auto read for now
                    is_important: thread.sentiment === "POSITIVE" || thread.sentiment === "URGENT",
                    labels: ["email", thread.direction?.toLowerCase() || "inbound"],
                    from_user_id: isOutbound ? (threadUserId || session.user.id) : `ext-${thread.from_email}`,
                    to_user_id: isOutbound ? `ext-${thread.to_email}` : (threadUserId || session.user.id),
                    from_user: isOutbound
                        ? { id: resolvedToUser.id, name: resolvedToUser.name || resolvedToUser.email, email: resolvedToUser.email || "" }
                        : { id: `ext-${thread.from_email}`, name: resolvedName, email: thread.from_email },
                    to_user: isOutbound
                        ? { id: `ext-${thread.to_email}`, name: resolvedName, email: thread.to_email }
                        : { id: resolvedToUser.id, name: resolvedToUser.name || resolvedToUser.email, email: resolvedToUser.email || "" },
                    recipients: threadUserId ? [{ recipient_id: threadUserId, is_read: true }] : [{ recipient_id: session.user.id, is_read: true }],
                    status: "SENT",
                    direction: thread.direction,
                    senderName: isOutbound ? (resolvedToUser.name || "You") : resolvedName,
                    _apiMeta: { // Use same thread UI
                        channel: "EMAIL",
                        direction: thread.direction,
                        leadId: thread.lead,
                        clientName: resolvedName,
                        clientEmail: clientEmail,
                        outreachItem: thread.outreach_item
                    }
                };

                const key = msg._apiMeta?.leadId ? `lead:${msg._apiMeta.leadId}` : `email:${clientEmail}`;
                if (!sesThreadMap.has(key)) sesThreadMap.set(key, []);
                sesThreadMap.get(key)!.push(msg);
            });

            Array.from(sesThreadMap.entries()).forEach(([key, threadMsgs]) => {
                threadMsgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const latest = threadMsgs[threadMsgs.length - 1];
                const firstInbound = threadMsgs.find((m: any) => m._apiMeta?.direction === "INBOUND");
                const clientInfo = firstInbound || threadMsgs[0];

                emailThreads.push({
                    ...latest,
                    from_user: { id: `ses-thread-${key}`, name: clientInfo._apiMeta?.clientName || "Customer", email: clientInfo._apiMeta?.clientEmail || "" },
                    from_user_id: clientInfo.from_user_id,
                    to_user: { id: session.user.id, name: session.user.name || session.user.email, email: session.user.email },
                    to_user_id: session.user.id,
                    body: latest.body || "(No message body)",
                    _thread: threadMsgs,
                });
            });
        } catch (e) {
            console.error("Failed to fetch SES threads", e);
        }

        messages = [...messages, ...mappedEmails, ...apiMessages, ...emailThreads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);

    } catch (e) {
        console.error("Failed to fetch messages", e);
        messages = messages || [];
    }

    // Fetch form submissions (visible based on form visibility)
    let formSubmissions: any[] = [];
    try {
        formSubmissions = await (prismadb as any).formSubmission?.findMany?.({
            where: {
                team_id: teamId,
                form: {
                    OR: [
                        { visibility: "PUBLIC" },
                        { visibility: "PRIVATE", created_by: session.user.id },
                    ],
                },
            },
            include: {
                form: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        project_id: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        }) || [];
    } catch (e) {
        // Model might not exist yet, return empty
        formSubmissions = [];
    }

    // Fetch system notifications
    let notifications: any[] = [];
    try {
        notifications = await prismadb.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    } catch (e) {
        notifications = [];
    }

    const layout = (await cookies()).get("react-resizable-panels:layout");
    const collapsed = (await cookies()).get("react-resizable-panels:collapsed");

    const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
    const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

    return (
        <Container
            title="Messages"
            description="Internal team messaging. Send and receive messages from your team members."
        >
            <LearnLink
                tab="messages"
                overviewTitle="Internal Team Communications"
                overviewWhat="A unified inbox for high-fidelity internal messaging, form submissions, and system-wide alerts."
                overviewWhy="Centralizing team chat within the CRM ensures that critical operational discussions stay connected to the actual customer records and projects being discussed."
                overviewHow="Compose new threads to any team member, monitor the 'Form Submissions' channel for inbound lead captures, and use the 'Important' filter to prioritize high-velocity alerts."
            />
            <Suspense fallback={<SuspenseLoading />}>
                <InternalMessagesComponent
                    messages={messages}
                    teamMembers={teamMembers}
                    formSubmissions={formSubmissions}
                    notifications={notifications}
                    currentUserId={session.user.id}
                    currentUserName={session.user.name || session.user.email || "You"}
                    currentUserEmail={session.user.email || ""}
                    defaultLayout={defaultLayout}
                    defaultCollapsed={defaultCollapsed}
                />
            </Suspense>
        </Container>
    );
};

export default MessagesRoute;
