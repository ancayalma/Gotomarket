"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addMonths } from "date-fns";
import { createSurgeCheckoutSession } from "@/lib/surge";

export async function saveSubscription(data: {
    planName: string;
    amount: number;
    billingDay: number;
    customerWallet?: string;
    discountApplied: boolean;
    interval: "monthly" | "annual";
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.team_id) {
            return { error: "User or Team not found" };
        }

        const teamId = user.team_id;

        // Fetch team slug for exemption check
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            select: { slug: true }
        });

        // Calculate next billing date
        const now = new Date();
        let nextBillingDate = new Date(now.getFullYear(), now.getMonth(), data.billingDay);

        // If the calculated billing date is today or in the past, or very close (e.g. paying today, billing day is tomorrow),
        // we should conceptually consider the "current" cycle as starting now/this month, so the *next* bill is +1 cycle.
        // For simplicity, if the aligned date in this month is <= now, we definitely push forward.
        // Even if it's > now (e.g. today 10th, bill 15th), since we are doing a full charge NOW, we shouldn't charge again in 5 days.
        // So we ALWAYS push to the next occurrence of that day + interval.

        // Actually, let's keep it robust:
        // 1. If nextBillingDate <= now, we MUST move it forward.
        // 2. If nextBillingDate > now, it's later this month. If we just charged, we probably want to skip this one too.

        // Let's assume we always want the next billing date to be roughly [Interval] from now.
        // Aligning to billingDay is secondary.
        // Simple heuristic: If (nextBillingDate - now) < 15 days, add interval.

        const daysDiff = (nextBillingDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

        // If it's in the past OR less than roughly half a month away (to avoid double bill), push it.
        if (daysDiff < 10) {
            if (data.interval === "annual") {
                nextBillingDate = addMonths(nextBillingDate, 12);
            } else {
                nextBillingDate = addMonths(nextBillingDate, 1);
            }
        } else {
            // It's > 10 days away in this month. 
            // If Annual, we definitely need to push to next year.
            if (data.interval === "annual") {
                nextBillingDate = addMonths(nextBillingDate, 12);
            }
            // If Monthly, staying in this month (e.g. >10 days away) might be okay? 
            // E.g. Pay today (1st). Next bill 28th. That's 28 days. Accepted.
        }

        const isInternalTeam = team && ['basalt', 'basalthq', 'ledger1'].includes(team.slug.toLowerCase());

        const status = isInternalTeam ? "ACTIVE" : "ACTIVE"; // Active pending payment
        const lastChargeStatus = isInternalTeam ? "SYSTEM_FREE_TIER" : "PENDING_FIRST_PAYMENT";

        // 1. Create/Update the Subscription Record
        const sub = await prismadb.crm_Subscriptions.upsert({
            where: { tenant_id: teamId },
            create: {
                tenant_id: teamId,
                customer_email: user.email,
                customer_wallet: data.customerWallet,
                discount_applied: data.discountApplied,
                plan_name: data.planName,
                amount: isInternalTeam ? 0 : data.amount,
                billing_day: data.billingDay,
                interval: data.interval,
                next_billing_date: nextBillingDate,
                status: status,
                last_charge_status: lastChargeStatus
            },
            update: {
                customer_email: user.email,
                customer_wallet: data.customerWallet,
                discount_applied: data.discountApplied,
                plan_name: data.planName,
                amount: isInternalTeam ? 0 : data.amount,
                billing_day: data.billingDay,
                interval: data.interval,
                next_billing_date: nextBillingDate,
                status: status,
                last_charge_status: lastChargeStatus
            }
        });

        // 2. Internal / Exempt Teams: Try to create checkout anyway for testing, fallback to auto-success
        if (isInternalTeam) {
            console.log(`[SaveSubscription] Internal team ${team.slug} detected. Attempting to generate test checkout...`);
            // We flow into the regular checkout logic below, but we'll return early ONLY if Surge fails.
        }

        // 3. Regular Flow: Create Invoice & Checkout
        // Create an Invoice for the first payment to generate the Surge Link
        // (This allows us to leverage Surge's Invoice Checkout flow for the first charge + vaulting)
        const invoice = await prismadb.invoices.create({
            data: {
                team_id: teamId,
                assigned_user_id: session.user.id,
                invoice_number: `SUB-${Date.now()}`,
                invoice_amount: data.amount.toString(),
                invoice_currency: "USD",
                description: `Subscription: ${data.planName} (${data.interval})`,
                status: "UNPAID",
                payment_status: "UNPAID",
                invoice_file_mimeType: "application/pdf",
                invoice_file_url: ""
            }
        });

        console.log(`[SaveSubscription] Created invoice ${invoice.id} for subscription (${data.planName}, $${data.amount})`);

        // 3b. Also create a formal crm_BillingInvoice for the billing dashboard
        const periodStart = now;
        const periodEnd = data.interval === "annual" ? addMonths(now, 12) : addMonths(now, 1);

        await (prismadb as any).crm_BillingInvoice.create({
            data: {
                tenant_id: teamId,
                subscription_id: sub.id,
                invoice_number: `BIL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                type: "SUBSCRIPTION",
                description: `${data.planName} Plan — ${data.interval === "annual" ? "Annual" : "Monthly"} Subscription`,
                period_start: periodStart,
                period_end: periodEnd,
                subtotal: data.discountApplied ? data.amount / 0.95 : data.amount,
                discount: data.discountApplied ? (data.amount / 0.95) - data.amount : 0,
                tax: 0,
                total: data.amount,
                payment_method: data.customerWallet ? "CRYPTO" : "CARD",
                payment_status: "PENDING",
            }
        });

        // 3c. Generate Surge Checkout Session
        const checkoutSession = await createSurgeCheckoutSession(teamId, invoice);

        if (checkoutSession && checkoutSession.url) {
            // Sync the Surge link back to the invoice
            await prismadb.invoices.update({
                where: { id: invoice.id },
                data: {
                    surge_payment_id: checkoutSession.id,
                    surge_payment_link: checkoutSession.url,
                    payment_status: "PENDING"
                }
            });
            return { success: true, url: checkoutSession.url, invoiceId: invoice.id };
        }

        console.error(`[SaveSubscription] createSurgeCheckoutSession returned null for invoice ${invoice.id}. Check Surge API key, inventory creation, and order creation logs above.`);

        if (isInternalTeam) {
            return { success: true, message: "Subscription updated (Internal Team - Surge Link Generation Skipped/Failed)" };
        }

        return { error: "Subscription updated, but payment link generation failed. Please check invoices." };

    } catch (error) {
        console.error("Failed to save subscription:", error);
        return { error: "Failed to save subscription" };
    }
}
