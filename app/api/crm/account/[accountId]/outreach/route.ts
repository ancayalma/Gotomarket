import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

type Params = { params: Promise<{ accountId: string }> };

export async function GET(_req: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { accountId } = await params;
        if (!accountId) return new NextResponse("Missing accountId", { status: 400 });

        // Find the account to get its email
        const account = await prismadb.crm_Accounts.findUnique({
            where: { id: accountId },
            select: { email: true, additional_emails: true },
        });

        const accountEmails: string[] = [];
        if (account?.email) accountEmails.push(account.email);
        if (account?.additional_emails) accountEmails.push(...(account.additional_emails as string[]));

        // Find all leads linked to this account
        const leads = await prismadb.crm_Leads.findMany({
            where: { accountsIDs: accountId },
            select: { id: true },
        });

        const leadIds = leads.map((l: { id: string }) => l.id);

        // Also find leads by email match
        if (accountEmails.length > 0) {
            const leadsByEmail = await prismadb.crm_Leads.findMany({
                where: { email: { in: accountEmails } },
                select: { id: true },
            });
            leadsByEmail.forEach((l: { id: string }) => {
                if (!leadIds.includes(l.id)) leadIds.push(l.id);
            });
        }

        // Find all outreach items linked to these leads, the account, or by candidate email
        const orConditions: any[] = [];
        if (leadIds.length > 0) orConditions.push({ lead: { in: leadIds } });
        orConditions.push({ account_id: accountId });
        if (accountEmails.length > 0) orConditions.push({ candidate_email: { in: accountEmails } });

        const items = await prismadb.crm_Outreach_Items.findMany({
            where: { OR: orConditions },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                assigned_campaign: {
                    select: { name: true, status: true },
                },
            },
        });

        // Map to response shape
        const mapped = items.map((item: any) => ({
            id: item.id,
            channel: item.channel,
            status: item.status,
            subject: item.subject,
            body_text: item.body_text,
            body_html: item.body_html,
            candidate_email: item.candidate_email,
            candidate_name: item.candidate_name,
            error_message: item.error_message,
            sentAt: item.sentAt,
            openedAt: item.openedAt,
            clickedAt: item.clickedAt,
            repliedAt: item.repliedAt,
            reply_snippet: item.reply_snippet,
            reply_sentiment: item.reply_sentiment,
            createdAt: item.createdAt,
            sender_email: item.sender_email,
            campaign_name: item.assigned_campaign?.name || null,
            campaign_status: item.assigned_campaign?.status || null,
        }));

        // Compute stats
        const stats = {
            sent: mapped.filter((i: any) => ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"].includes(i.status)).length,
            opened: mapped.filter((i: any) => i.openedAt).length,
            replied: mapped.filter((i: any) => i.repliedAt || i.status === "REPLIED").length,
            failed: mapped.filter((i: any) => i.status === "FAILED").length,
            skipped: mapped.filter((i: any) => i.status === "SKIPPED").length,
            pending: mapped.filter((i: any) => i.status === "PENDING").length,
        };

        return NextResponse.json({ items: mapped, stats }, { status: 200 });
    } catch (error) {
        console.error("[ACCOUNT_OUTREACH_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
