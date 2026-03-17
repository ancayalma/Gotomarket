"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addMonths } from "date-fns";
import { createSurgeCheckoutSession } from "@/lib/surge";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { systemLogger } from "@/lib/logger";
import { sendSmsSetupInstructions } from "@/lib/email/sms-setup-instructions";
import { SURGE_DISCOUNT_PERCENT } from "@/config/subscriptions";

export async function saveSubscription(data: {
    planName: string;
    amount: number;
    billingDay: number;
    customerWallet?: string;
    discountApplied: boolean;
    interval: "monthly" | "annual";
    paymentProvider?: "STRIPE" | "SURGE";
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
        const provider = data.paymentProvider || "SURGE";

        // Fetch team slug for exemption check
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            select: { slug: true, name: true }
        });

        // Apply 5% Surge discount for manual BasaltSurge payments
        let finalAmount = data.amount;
        let discountApplied = data.discountApplied;

        if (provider === "SURGE") {
            finalAmount = data.amount * (1 - SURGE_DISCOUNT_PERCENT / 100);
            discountApplied = true;
        }

        // Hard gate: Surge billing must be explicitly enabled
        if (provider === "SURGE" && process.env.SURGE_BILLING_ENABLED !== "true") {
            return { error: "BasaltSurge billing is not enabled in this environment." };
        }

        // Calculate next billing date
        const now = new Date();
        let nextBillingDate = new Date(now.getFullYear(), now.getMonth(), data.billingDay);

        const daysDiff = (nextBillingDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

        if (daysDiff < 10) {
            if (data.interval === "annual") {
                nextBillingDate = addMonths(nextBillingDate, 12);
            } else {
                nextBillingDate = addMonths(nextBillingDate, 1);
            }
        } else {
            if (data.interval === "annual") {
                nextBillingDate = addMonths(nextBillingDate, 12);
            }
        }

        const isInternalTeam = team && ['basalt', 'basalthq', 'ledger1'].includes(team.slug.toLowerCase());

        // Internal/exempt teams get ACTIVE immediately; everyone else starts PENDING
        // until payment is confirmed via Stripe/Surge webhook
        const status = isInternalTeam ? "ACTIVE" : "PENDING_PAYMENT";
        const lastChargeStatus = isInternalTeam ? "SYSTEM_FREE_TIER" : "PENDING_FIRST_PAYMENT";

        // 1. Create/Update the Subscription Record
        const sub = await prismadb.crm_Subscriptions.upsert({
            where: { tenant_id: teamId },
            create: {
                tenant_id: teamId,
                customer_email: user.email,
                customer_wallet: data.customerWallet,
                discount_applied: discountApplied,
                payment_provider: provider,
                plan_name: data.planName,
                amount: isInternalTeam ? 0 : finalAmount,
                billing_day: data.billingDay,
                interval: data.interval,
                next_billing_date: nextBillingDate,
                status: status,
                last_charge_status: lastChargeStatus
            },
            update: {
                customer_email: user.email,
                customer_wallet: data.customerWallet,
                discount_applied: discountApplied,
                payment_provider: provider,
                plan_name: data.planName,
                amount: isInternalTeam ? 0 : finalAmount,
                billing_day: data.billingDay,
                interval: data.interval,
                next_billing_date: nextBillingDate,
                status: status,
                last_charge_status: lastChargeStatus
            }
        });

        // 2. Internal / Exempt Teams: handle early
        if (isInternalTeam) {
            systemLogger.error(`[SaveSubscription] Internal team ${team.slug} detected.`);
        }

        // 2.5 Send SMS/Email Setup Notification for Basic / Pro
        if (["Basic", "Pro", "BASIC", "PRO"].includes(data.planName.toUpperCase())) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basalthq.com";
            sendSmsSetupInstructions(user.email!, user.name!, data.planName, appUrl).catch(e => {
                systemLogger.error(`[SaveSubscription] Failed to send SMS Setup Instructions to ${user.email}`, e);
            });
        }

        // =====================================================================
        // STRIPE PATH — Redirect to Stripe Checkout
        // =====================================================================
        if (provider === "STRIPE") {
            try {
                const checkoutSession = await createStripeCheckoutSession(
                    teamId,
                    user.email!,
                    data.planName,
                    data.interval,
                    team?.name
                );

                if (checkoutSession?.url) {
                    return { success: true, url: checkoutSession.url, provider: "STRIPE" };
                }
            } catch (stripeErr) {
                systemLogger.error("[SaveSubscription] Stripe checkout failed", stripeErr);
                return { error: "Stripe checkout session creation failed. Please try again." };
            }
        }

        // =====================================================================
        // SURGE PATH — Existing BasaltSurge checkout flow (5% discount applied)
        // =====================================================================

        // 3. Create Invoice & Checkout
        const invoice = await prismadb.invoices.create({
            data: {
                team_id: teamId,
                assigned_user_id: session.user.id,
                invoice_number: `SUB-${Date.now()}`,
                invoice_amount: finalAmount.toString(),
                invoice_currency: "USD",
                description: `Subscription: ${data.planName} (${data.interval}) — BasaltSurge`,
                status: "UNPAID",
                payment_status: "UNPAID",
                invoice_file_mimeType: "application/pdf",
                invoice_file_url: ""
            }
        });

        systemLogger.error(`[SaveSubscription] Created invoice ${invoice.id} for subscription (${data.planName}, $${finalAmount})`);

        // 3b. Also create a formal crm_BillingInvoice
        const periodStart = now;
        const periodEnd = data.interval === "annual" ? addMonths(now, 12) : addMonths(now, 1);

        await (prismadb as any).crm_BillingInvoice.create({
            data: {
                tenant_id: teamId,
                subscription_id: sub.id,
                invoice_number: `BIL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                type: "SUBSCRIPTION",
                description: `${data.planName} Plan — ${data.interval === "annual" ? "Annual" : "Monthly"} (BasaltSurge -${SURGE_DISCOUNT_PERCENT}%)`,
                period_start: periodStart,
                period_end: periodEnd,
                subtotal: data.amount,
                discount: data.amount - finalAmount,
                tax: 0,
                total: finalAmount,
                payment_method: data.customerWallet ? "CRYPTO" : "SURGE",
                payment_status: "PENDING",
            }
        });

        // 3c. Generate Surge Checkout Session
        const checkoutSession = await createSurgeCheckoutSession(teamId, invoice);

        if (checkoutSession && checkoutSession.url) {
            await prismadb.invoices.update({
                where: { id: invoice.id },
                data: {
                    surge_payment_id: checkoutSession.id,
                    surge_payment_link: checkoutSession.url,
                    payment_status: "PENDING"
                }
            });
            return { success: true, url: checkoutSession.url, invoiceId: invoice.id, provider: "SURGE" };
        }

        systemLogger.error(`[SaveSubscription] createSurgeCheckoutSession returned null for invoice ${invoice.id}.`);

        if (isInternalTeam) {
            return { success: true, message: "Subscription updated (Internal Team — Surge Link Generation Skipped/Failed)" };
        }

        return { error: "Subscription updated, but payment link generation failed. Please check invoices." };

    } catch (error) {
        console.error("Failed to save subscription:", error);
        return { error: "Failed to save subscription" };
    }
}
