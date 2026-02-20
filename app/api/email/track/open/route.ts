import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

const TRANSPARENT_GIF = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token) {
        try {
            const outreachItem = await prismadb.crm_Outreach_Items.findFirst({
                where: { tracking_token: token }
            });

            if (outreachItem && !outreachItem.openedAt) {
                const now = new Date();

                await prismadb.crm_Outreach_Items.update({
                    where: { id: outreachItem.id },
                    data: {
                        openedAt: now,
                        status: "OPENED"
                    }
                });

                await prismadb.crm_Outreach_Campaigns.update({
                    where: { id: outreachItem.campaign },
                    data: {
                        emails_opened: { increment: 1 }
                    }
                });

                // Update Lead Status
                if (outreachItem.lead) {
                    await (prismadb as any).crm_Leads.update({
                        where: { id: outreachItem.lead },
                        data: {
                            outreach_status: "OPENED",
                            outreach_opened_at: now,
                            status: "ACTIVE"
                        }
                    });

                    // Log Activity specifically for FLOW STATE tracking
                    await (prismadb as any).crm_Lead_Activities.create({
                        data: {
                            lead: outreachItem.lead,
                            type: "EMAIL_OPEN",
                            title: "Email Opened (FLOW STATE Pixel)",
                            description: `The recipient opened the outreach email for campaign ${outreachItem.campaign}.`,
                            createdAt: now,
                            v: 1
                        }
                    });

                    // Update parent account if linked
                    const lead = await (prismadb as any).crm_Leads.findUnique({
                        where: { id: outreachItem.lead },
                        select: { accountsIDs: true }
                    });

                    if (lead?.accountsIDs) {
                        await (prismadb as any).crm_Accounts.update({
                            where: { id: lead.accountsIDs },
                            data: { status: "Active" }
                        });
                    }
                }
            }
        } catch (error) {
            console.error("[EMAIL_TRACK_OPEN_ERROR]", error);
        }
    }

    return new NextResponse(TRANSPARENT_GIF, {
        headers: {
            "Content-Type": "image/gif",
            "Content-Length": TRANSPARENT_GIF.length.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
