import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prismadb } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS, SubscriptionPlanType } from "@/config/subscriptions";
import { topUpAiTokens, resetAiTokenBalance } from "@/lib/ai-tokens";
import { systemLogger } from "@/lib/logger";
import { addMonths } from "date-fns";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed → activate subscription or process top-up
 * - invoice.paid → record billing invoice, refresh AI tokens for new cycle
 * - customer.subscription.deleted → downgrade to FREE
 * - customer.subscription.updated → handle plan changes
 */
export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!WEBHOOK_SECRET) {
        systemLogger.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
        systemLogger.error("[Stripe Webhook] Signature verification failed", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoiceFailed(invoice);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            default:
                // Unhandled event type — log but don't error
                systemLogger.error(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        systemLogger.error("[Stripe Webhook] Error processing event", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const teamId = session.metadata?.team_id;
    if (!teamId) {
        systemLogger.error("[Stripe Webhook] checkout.session.completed missing team_id metadata");
        return;
    }

    // Check if this is a top-up purchase
    if (session.metadata?.type === "AI_TOKEN_TOPUP") {
        const tokens = parseInt(session.metadata?.tokens || "0", 10);
        if (tokens > 0) {
            await topUpAiTokens(teamId, tokens);
            systemLogger.error(`[Stripe Webhook] AI Token top-up: +${tokens} tokens for team ${teamId}`);
        }
        return;
    }

    // Subscription checkout
    const planSlug = session.metadata?.plan_slug;
    const interval = session.metadata?.interval || "monthly";

    if (!planSlug) {
        systemLogger.error("[Stripe Webhook] checkout.session.completed missing plan_slug metadata");
        return;
    }

    const plan = SUBSCRIPTION_PLANS[planSlug as SubscriptionPlanType];
    if (!plan) {
        systemLogger.error(`[Stripe Webhook] Unknown plan slug: ${planSlug}`);
        return;
    }

    // Find or create the Plan record in the database
    const dbPlan = await prismadb.plan.findFirst({
        where: { slug: planSlug },
    });

    // Update the subscription record
    const now = new Date();
    const nextBilling = interval === "annual" ? addMonths(now, 12) : addMonths(now, 1);

    await prismadb.crm_Subscriptions.upsert({
        where: { tenant_id: teamId },
        create: {
            tenant_id: teamId,
            payment_provider: "STRIPE",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            customer_email: session.customer_email || undefined,
            plan_name: planSlug,
            amount: (session.amount_total || 0) / 100,
            billing_day: now.getDate(),
            interval,
            next_billing_date: nextBilling,
            status: "ACTIVE",
            last_charge_status: "PAID",
            last_charge_date: now,
        },
        update: {
            payment_provider: "STRIPE",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            customer_email: session.customer_email || undefined,
            plan_name: planSlug,
            amount: (session.amount_total || 0) / 100,
            interval,
            next_billing_date: nextBilling,
            status: "ACTIVE",
            last_charge_status: "PAID",
            last_charge_date: now,
        },
    });

    // Assign the plan to the team
    if (dbPlan) {
        await prismadb.team.update({
            where: { id: teamId },
            data: {
                plan_id: dbPlan.id,
                subscription_plan: planSlug as any,
                status: "ACTIVE",
                renewal_date: nextBilling,
            },
        });
    }

    // Provision AI tokens
    await resetAiTokenBalance(teamId);

    // Trigger deferred SES Email Verification for workspace accounts
    try {
        const pendingConfigs = await prismadb.teamEmailConfig.findMany({
            where: { 
                team_id: teamId, 
                provider: "PLATFORM_SES", 
                verification_status: "PENDING" 
            }
        });

        if (pendingConfigs.length > 0) {
            const { verifyEmailIdentity } = await import("@/lib/aws/ses-verify");
            for (const config of pendingConfigs) {
                await verifyEmailIdentity(config.from_email);
                systemLogger.info(`[Stripe Webhook] Deferred SES verification triggered for ${config.from_email}`);
            }
        }
    } catch (sesErr) {
        systemLogger.error(`[Stripe Webhook] Failed to trigger deferred SES verification for team ${teamId}`, sesErr);
    }

    systemLogger.info(`[Stripe Webhook] Subscription activated: ${planSlug} for team ${teamId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;
    const teamId = invoiceAny.subscription_details?.metadata?.team_id
        || invoice.metadata?.team_id;
    if (!teamId) return;

    const now = new Date();

    // Record a billing invoice
    await (prismadb as any).crm_BillingInvoice.create({
        data: {
            tenant_id: teamId,
            invoice_number: `STRIPE-${invoice.id}`,
            type: "SUBSCRIPTION",
            description: `Stripe Invoice ${invoice.number || invoice.id}`,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : now,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : addMonths(now, 1),
            subtotal: (invoice.subtotal || 0) / 100,
            discount: (invoiceAny.total_discount_amounts?.[0]?.amount || 0) / 100,
            tax: (invoiceAny.tax || 0) / 100,
            total: (invoice.total || 0) / 100,
            payment_method: "CARD",
            payment_status: "PAID",
            transaction_id: invoiceAny.charge as string || undefined,
            paid_at: now,
        },
    });

    // Refresh AI tokens for new billing cycle
    await resetAiTokenBalance(teamId);

    // Update subscription last charge info
    await prismadb.crm_Subscriptions.update({
        where: { tenant_id: teamId },
        data: {
            last_charge_date: now,
            last_charge_status: "PAID",
            payment_failed_at: null, // Clear the grace period explicitly
            last_transaction_id: invoiceAny.charge as string || invoice.id,
        },
    });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
    const invoiceAny = invoice as any;
    const teamId = invoiceAny.subscription_details?.metadata?.team_id
        || invoice.metadata?.team_id;
    if (!teamId) return;

    const now = new Date();

    // Check if we already marked a failure, we don't want to reset the clock if it's a persistent failure
    const existing = await prismadb.crm_Subscriptions.findUnique({
        where: { tenant_id: teamId },
        select: { payment_failed_at: true }
    });

    await prismadb.crm_Subscriptions.update({
        where: { tenant_id: teamId },
        data: {
            last_charge_status: "FAILED",
            payment_failed_at: existing?.payment_failed_at ? undefined : now
        },
    });

    systemLogger.warn(`[Stripe Webhook] Payment failed for team ${teamId}, setting failure clock.`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const teamId = subscription.metadata?.team_id;
    if (!teamId) return;

    // Downgrade to FREE
    const freePlan = await prismadb.plan.findFirst({
        where: { slug: "STARTER" },
    });

    await prismadb.crm_Subscriptions.update({
        where: { tenant_id: teamId },
        data: {
            status: "CANCELLED",
            stripe_subscription_id: null,
            plan_name: "STARTER",
            amount: 0,
        },
    });

    if (freePlan) {
        await prismadb.team.update({
            where: { id: teamId },
            data: {
                plan_id: freePlan.id,
                subscription_plan: "STARTER",
            },
        });
    }

    // Reset tokens to FREE allowance
    await resetAiTokenBalance(teamId);

    systemLogger.error(`[Stripe Webhook] Subscription cancelled for team ${teamId}, downgraded to FREE`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const teamId = subscription.metadata?.team_id;
    if (!teamId) return;

    // Update status based on Stripe status
    let status = "ACTIVE";
    if (subscription.status === "past_due") status = "OVERDUE";
    if (subscription.status === "canceled") status = "CANCELLED";
    if (subscription.status === "paused") status = "PAUSED";

    let quantity = 1;
    if (subscription.items?.data && subscription.items.data.length > 0) {
        quantity = subscription.items.data[0].quantity || 1;
    }

    await prismadb.crm_Subscriptions.update({
        where: { tenant_id: teamId },
        data: { status, quantity },
    });
}
