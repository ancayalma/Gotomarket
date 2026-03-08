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

        messages = [...messages, ...mappedEmails].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);

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
