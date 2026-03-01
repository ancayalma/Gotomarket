
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createSurgeCheckoutSession } from "@/lib/surge";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";

export async function generateSurgeLink(invoiceId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            throw new Error("Unauthorized");
        }

        const invoice = await prismadb.invoices.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Ensure we have a tenant/team ID to fetch config
        // Assuming invoice.assigned_team_id or similar marks the tenant context
        // Or if user is associated with a team.
        // For now, let's try to infer from invoice's relations if possible, or use user's team if simple.
        // However, invoice.team_id field exists in schema.

        const tenantId = invoice.team_id;

        if (!tenantId) {
            throw new Error("Invoice is not associated with a team/tenant");
        }

        const checkout = await createSurgeCheckoutSession(tenantId, invoice);

        if (!checkout) {
            throw new Error("Failed to create Surge session");
        }

        // 3. Sync with Mercury (No-Exit Handshake)
        let mercuryInvoiceId = invoice.mercury_invoice_id;
        try {
            const { createMercuryReceivable } = await import("@/lib/mercury");
            const mercuryInvoice = await createMercuryReceivable(tenantId, {
                ...invoice,
                surge_payment_id: checkout.id,
                surge_payment_link: checkout.url
            });
            if (mercuryInvoice?.id) {
                mercuryInvoiceId = mercuryInvoice.id;
                systemLogger.error(`[GenerateSurgeLink] Linked Mercury Invoice: ${mercuryInvoiceId}`);
            }
        } catch (mercuryError) {
            systemLogger.error("[GenerateSurgeLink] Mercury handshake failed or skipped:", mercuryError);
        }

        // 4. Update Invoice
        await prismadb.invoices.update({
            where: { id: invoiceId },
            data: {
                surge_payment_id: checkout.id,
                surge_payment_link: checkout.url,
                mercury_invoice_id: mercuryInvoiceId,
                payment_status: "PENDING" // Mark as pending payment
            }
        });

        revalidatePath(`/invoice/detail/${invoiceId}`);
        return { success: true, url: checkout.url };

    } catch (error) {
        systemLogger.error("[GenerateSurgeLink]", error);
        return { success: false, error: "Failed to generate link" };
    }
}
