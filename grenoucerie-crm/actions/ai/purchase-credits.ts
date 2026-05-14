"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createSurgeCheckoutSession } from "@/lib/surge";
import { addLeadGenCredits } from "@/lib/scraper/credits";
import { revalidatePath } from "next/cache";

export async function purchaseLeadGenCredits(packageId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { id: true, team_id: true, email: true }
    });

    if (!user?.team_id) throw new Error("No team found");

    const packages: Record<string, { credits: number, priceUSD: number }> = {
        "starter": { credits: 1000, priceUSD: 10 },
        "pro": { credits: 5000, priceUSD: 45 },
        "enterprise": { credits: 10000, priceUSD: 80 }
    };

    const pack = packages[packageId];
    if (!pack) throw new Error("Invalid package");

    // 1. Create a Standard Invoice (required by Surge helper)
    const invoiceIdentifier = `LG-${Date.now()}`;
    const invoice = await prismadb.invoices.create({
        data: {
            team_id: user.team_id,
            assigned_user_id: user.id,
            invoice_number: invoiceIdentifier,
            invoice_amount: pack.priceUSD.toString(),
            invoice_currency: "USD",
            description: `LeadGen Intelligence Credits: ${pack.credits}`,
            status: "UNPAID",
            payment_status: "UNPAID",
            invoice_file_mimeType: "application/pdf",
            invoice_file_url: ""
        }
    });

    // 2. Log formal Billing Invoice
    await (prismadb as any).crm_BillingInvoice.create({
        data: {
            tenant_id: user.team_id,
            invoice_number: `BIL-${invoiceIdentifier}`,
            type: "AI_USAGE",
            description: `Purchase of ${pack.credits} LeadGen Credits`,
            period_start: new Date(),
            period_end: new Date(),
            subtotal: pack.priceUSD,
            total: pack.priceUSD,
            payment_status: "PENDING",
            paid_at: null,
            line_items: [
                { description: `${pack.credits} LeadGen Credits`, quantity: 1, unit_price: pack.priceUSD, total: pack.priceUSD }
            ]
        }
    });

    // 3. Generate Surge Checkout Session
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/ai-settings?payment=success&type=credits`;
    const checkout = await createSurgeCheckoutSession(user.team_id, invoice, returnUrl);

    if (!checkout || !checkout.url) {
        throw new Error("Failed to generate payment link via Surge.");
    }

    // Update invoice with surge ID
    await prismadb.invoices.update({
        where: { id: invoice.id },
        data: {
            surge_payment_id: checkout.id,
            surge_payment_link: checkout.url
        }
    });

    return { success: true, url: checkout.url, creditsPlanned: pack.credits };
}
