import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { sendTeamEmail } from "@/lib/email/team-mailer";
import { OutreachItemStatus } from "@prisma/client";
import { requireCronAuth } from "@/lib/api-auth-guard";

export const maxDuration = 60; // Allow 1 minute max for this cron execution

export async function GET(req: Request) {
    // ── Cron auth guard ──
    const cronAuth = requireCronAuth(req);
    if (cronAuth instanceof Response) return cronAuth;
    try {
        // 2. Fetch Pending Items (Limit 50 to avoid timeout)
        const pendingItems = await prismadb.crm_Outreach_Items.findMany({
            where: {
                status: "PENDING",
            },
            take: 50,
            include: {
                assigned_campaign: {
                    select: {
                        id: true,
                        name: true,
                        team_id: true,
                    }
                },
                assigned_lead: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        if (pendingItems.length === 0) {
            return NextResponse.json({ message: "No pending emails to process", processed: 0 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // 3. Process Batch
        for (const item of pendingItems) {
            try {
                if (!item.assigned_lead?.email) {
                    throw new Error("Lead has no email");
                }

                if (!item.assigned_campaign?.team_id) {
                    throw new Error("No team associated with campaign");
                }

                // Prepare Content 
                const subject = item.subject || "No Subject";
                const html = item.body_html || item.body_text || "";

                // Send via Team-aware mailer (Strict enforcement of BYO Email)
                await sendTeamEmail(item.assigned_campaign.team_id as string, {
                    to: item.assigned_lead.email as string,
                    subject: subject,
                    html: html,
                    text: item.body_text || "",
                });

                const messageId = `outreach_${item.id}_${Date.now()}`;

                // Update Status: SENT
                await prismadb.crm_Outreach_Items.update({
                    where: { id: item.id },
                    data: {
                        status: "SENT",
                        sentAt: new Date(),
                        message_id: messageId,
                        error_message: null
                    }
                });

                // Log Activity
                await prismadb.crm_Lead_Activities.create({
                    data: {
                        lead: item.assigned_lead.id,
                        type: "EMAIL_SENT",
                        metadata: {
                            campaignId: item.assigned_campaign?.id,
                            messageId: messageId,
                            subject: subject
                        }
                    }
                });

                results.success++;

            } catch (error: any) {
                console.error(`Failed to send item ${item.id}:`, error);
                results.failed++;
                results.errors.push(error.message);

                // Update Status: FAILED (with retry count logic potentially)
                await prismadb.crm_Outreach_Items.update({
                    where: { id: item.id },
                    data: {
                        status: "FAILED", // Could use PENDING + retry_count increase
                        error_message: error.message
                    }
                });
            }
        }

        return NextResponse.json({
            message: "Batch processed",
            processed: pendingItems.length,
            ...results
        });

    } catch (error: any) {
        console.error("Critical error in outreach processor:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
