import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const targetUrl = searchParams.get("url");

    if (!token || !targetUrl) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    try {
        // Record the click
        const outreachItem = await prismadb.crm_Outreach_Items.findFirst({
            where: { tracking_token: token }
        });

        if (outreachItem) {
            const now = new Date();
            await prismadb.crm_Outreach_Items.update({
                where: { id: outreachItem.id },
                data: {
                    clickedAt: now,
                    status: "CLICKED"
                }
            });

            // Update campaign stats
            await prismadb.crm_Outreach_Campaigns.update({
                where: { id: outreachItem.campaign },
                data: {
                    emails_opened: { increment: 1 } // If click happened, it's definitely opened too
                }
            });

            // Update Lead Status
            if (outreachItem.lead) {
                await (prismadb as any).crm_Leads.update({
                    where: { id: outreachItem.lead },
                    data: {
                        outreach_status: "MEETING_LINK_CLICKED",
                        status: "ACTIVE"
                    }
                });

                // Log Activity specifically for FLOW STATE tracking
                await (prismadb as any).crm_Lead_Activities.create({
                    data: {
                        lead: outreachItem.lead,
                        type: "EMAIL_CLICK",
                        title: "Link Clicked (FLOW STATE Pixel)",
                        description: `The recipient clicked a link in the outreach email for campaign ${outreachItem.campaign}. Target: ${targetUrl}`,
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

        return NextResponse.redirect(targetUrl);
    } catch (error) {
        systemLogger.error("[EMAIL_TRACK_CLICK_ERROR]", error);
        return NextResponse.redirect(targetUrl);
    }
}
