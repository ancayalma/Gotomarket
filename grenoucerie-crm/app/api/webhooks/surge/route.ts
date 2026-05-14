
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";
import { systemLogger } from "@/lib/logger";

const SURGE_WEBHOOK_SECRET = process.env.SURGE_WEBHOOK_SECRET;

function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();

        // SOC2: Verify webhook signature to prevent forged payment confirmations
        if (SURGE_WEBHOOK_SECRET) {
            const signature = req.headers.get("X-Surge-Signature") || req.headers.get("x-surge-signature");
            if (!verifyWebhookSignature(rawBody, signature, SURGE_WEBHOOK_SECRET)) {
                systemLogger.error("[Surge Webhook] Invalid signature — blocked.");
                return new NextResponse("Invalid Signature", { status: 401 });
            }
        } else {
            console.warn("[Surge Webhook] SURGE_WEBHOOK_SECRET not set — signature verification skipped. THIS IS INSECURE.");
        }

        const body = JSON.parse(rawBody);
        const { type, data } = body;

        if (type === "payment.confirmed" || type === "payment.succeeded") {
            const externalId = data.external_id; // This should be our Invoice ID or custom reference
            const paymentId = data.id;

            systemLogger.error(`[Surge Webhook] Payment confirmed for invoice: ${externalId}`);

            if (!externalId) {
                return new NextResponse("Missing external_id", { status: 400 });
            }

            // 1. Update Invoice
            const invoice = await prismadb.invoices.update({
                where: { id: externalId },
                data: {
                    payment_status: "PAID",
                    status: "PAID", // Legacy status field
                    last_updated: new Date()
                },
                include: {
                    opportunities: true // To find linked deal
                }
            });

            // 1.1 Handle LeadGen Credits fulfillment
            if (invoice.description?.includes("LeadGen Intelligence Credits")) {
                const match = invoice.description.match(/Credits: (\d+)/);
                if (match && invoice.team_id) {
                    const credits = parseInt(match[1]);
                    try {
                        const { addLeadGenCredits } = await import("@/lib/scraper/credits");
                        await addLeadGenCredits(invoice.team_id, credits);
                        systemLogger.error(`[Surge Webhook] Successfully added ${credits} credits to team ${invoice.team_id}`);

                        // Update formal billing invoice status if it exists
                        await (prismadb as any).crm_BillingInvoice.updateMany({
                            where: {
                                tenant_id: invoice.team_id,
                                invoice_number: `BIL-${invoice.invoice_number}`
                            },
                            data: {
                                payment_status: "PAID",
                                paid_at: new Date()
                            }
                        });
                    } catch (e) {
                        systemLogger.error("[Surge Webhook] LeadGen Credit fulfillment failed", e);
                    }
                }
            }

                // Sync with Mercury
                if (invoice.mercury_invoice_id && invoice.team_id) {
                // I will assume markMercuryInvoicePaid is imported. 
                // Wait, I can't just assume. I need to add the import.
                // I'll update the whole file to be safe or use require? No, ESM.

                // I'll use a subsequent step to add import. Here just the call.
                try {
                    const { markMercuryInvoicePaid } = await import("@/lib/mercury");
                    await markMercuryInvoicePaid(invoice.team_id, invoice.mercury_invoice_id);
                } catch (e) {
                    systemLogger.error("[Surge Webhook] Mercury sync failed", e);
                }
            }

            // 2. Update Linked Deal / Opportunity to WON
            // 2. Update Linked Deal / Opportunity to WON
            if (invoice.opportunities && invoice.opportunities.length > 0) {
                const dealId = invoice.opportunities[0].id;

                // Find the "Closed Won" stage - handle variations
                const wonStage = await prismadb.crm_Opportunities_Sales_Stages.findFirst({
                    where: {
                        name: { in: ["Closed Won", "Won", "Closed", "Deal Won"] }
                    }
                });

                await prismadb.crm_Opportunities.update({
                    where: { id: dealId },
                    data: {
                        status: "CLOSED",
                        sales_stage: wonStage ? wonStage.id : undefined,
                        close_date: new Date()
                    }
                });
                systemLogger.error(`[Surge Webhook] Updated Deal ${dealId} to CLOSED/WON`);
            }
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error) {
        systemLogger.error("[Surge Webhook] Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
