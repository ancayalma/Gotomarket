
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { sendSmsEum } from "@/lib/aws/eum-sms";
import { systemLogger } from "@/lib/logger";

export async function sendInvoiceSMS(invoiceId: string, phone: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { error: "Unauthorized" };

        const invoice = await prismadb.invoices.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) return { error: "Invoice not found" };

        const paymentLink = invoice.surge_payment_link;
        if (!paymentLink) return { error: "No payment link generated. Enable Crypto Payments first." };

        // Send SMS via AWS EUM
        try {
            const message = `Payment Link for Invoice #${invoice.invoice_number}: ${paymentLink}`;
            await sendSmsEum({ to: phone, body: message });

            systemLogger.error(`[SendInvoiceSMS] SMS sent to ${phone}`);
            return { success: true, message: "SMS sent" };
        } catch (smsError: any) {
            systemLogger.error("[SendInvoiceSMS] EUM Error:", smsError.message);
            return { error: "Failed to send SMS: " + smsError.message };
        }

    } catch (error) {
        console.error("Send Invoice SMS Error:", error);
        return { error: "Failed to send invoice via SMS" };
    }
}
