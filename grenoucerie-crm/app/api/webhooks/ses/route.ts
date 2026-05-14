import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { systemLogger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const snsPayload = JSON.parse(bodyText);

        // Handle AWS SNS Subscription Confirmation
        if (snsPayload.Type === 'SubscriptionConfirmation' && snsPayload.SubscribeURL) {
            systemLogger.info('[SES_WEBHOOK] Received SubscriptionConfirmation');
            const res = await fetch(snsPayload.SubscribeURL);
            if (res.ok) {
                systemLogger.info('[SES_WEBHOOK] Successfully confirmed SNS subscription');
                return NextResponse.json({ success: true, confirmed: true });
            } else {
                systemLogger.error('[SES_WEBHOOK] Failed to confirm SNS subscription');
                return NextResponse.json({ success: false }, { status: 500 });
            }
        }

        if (snsPayload.Type === 'Notification') {
            const sesEvent = JSON.parse(snsPayload.Message);

            if (sesEvent.notificationType === 'Complaint' || sesEvent.notificationType === 'Bounce') {
                const type = sesEvent.notificationType; // 'Complaint' or 'Bounce'
                const statusStr = type === 'Complaint' ? 'complained' : 'bounced';
                
                const recipients = type === 'Complaint' ? sesEvent.complaint.complainedRecipients : sesEvent.bounce.bouncedRecipients;
                
                for (const r of recipients) {
                    const email = r.emailAddress;
                    if (!email) continue;
                    
                    systemLogger.info(`[SES_WEBHOOK] Processing ${type} for email: ${email}`);

                    // Update Contacts
                    await prismadb.crm_Contacts.updateMany({
                        where: { email },
                        data: {
                            email_status: statusStr,
                            email_unsubscribed: type === 'Complaint' ? true : undefined,
                        }
                    });

                    // Update Leads
                    await prismadb.crm_Leads.updateMany({
                        where: { email },
                        data: {
                            email_status: statusStr,
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        systemLogger.error(`[SES_WEBHOOK] Error processing webhook: ${err.message}`);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
