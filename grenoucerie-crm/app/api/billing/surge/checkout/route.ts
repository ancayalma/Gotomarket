import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createSurgeCheckoutSession } from "@/lib/surge";
import { systemLogger } from "@/lib/logger";
import {
    SUBSCRIPTION_PLANS,
    SubscriptionPlanType,
    AI_TOKEN_TOPUP,
    SURGE_DISCOUNT_PERCENT,
    getMonthlyPrice,
    getAnnualPrice,
    getSurgePrice,
} from "@/config/subscriptions";
import { addMonths, addYears } from "date-fns";

/**
 * POST /api/billing/surge/checkout
 *
 * Creates a BasaltSurge payment session for:
 * - Subscription plans (manual monthly payment with 5% discount)
 * - One-time AI token top-ups (5% discount)
 *
 * Returns { url: string } to redirect the user to Surge payment portal.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (!user?.team_id) {
            return NextResponse.json({ error: "No team found" }, { status: 400 });
        }

        const body = await req.json();
        const { planSlug, interval = "monthly", topUp = false } = body;

        let amount: number;
        let description: string;
        let periodEnd: Date;
        const now = new Date();

        if (topUp) {
            // AI Token Top-Up with Surge discount
            amount = getSurgePrice(AI_TOKEN_TOPUP.price);
            description = `AI Token Top-Up: ${(AI_TOKEN_TOPUP.tokens / 1_000_000).toFixed(0)}M tokens (Surge — ${SURGE_DISCOUNT_PERCENT}% off)`;
            periodEnd = now;
        } else {
            // Subscription payment with Surge discount
            if (!planSlug || !SUBSCRIPTION_PLANS[planSlug as SubscriptionPlanType]) {
                return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
            }

            const basePrice = interval === "annual"
                ? getAnnualPrice(planSlug as SubscriptionPlanType)
                : getMonthlyPrice(planSlug as SubscriptionPlanType);

            amount = getSurgePrice(basePrice);
            const plan = SUBSCRIPTION_PLANS[planSlug as SubscriptionPlanType];
            description = `${plan.name} — ${interval === "annual" ? "Annual" : "Monthly"} (Surge — ${SURGE_DISCOUNT_PERCENT}% off)`;
            periodEnd = interval === "annual" ? addYears(now, 1) : addMonths(now, 1);
        }

        // Create an invoice in the DB
        const invoiceNumber = `INV-SURGE-${Date.now().toString(36).toUpperCase()}`;
        const invoice = await prismadb.invoices.create({
            data: {
                assigned_team: { connect: { id: user.team_id } },
                users: { connect: { id: session.user.id } },
                invoice_number: invoiceNumber,
                invoice_amount: amount.toString(),
                invoice_currency: "USD",
                invoice_type: topUp ? "AI_TOPUP" : "SUBSCRIPTION",
                description,
                status: "UNPAID",
                payment_status: "UNPAID",
                invoice_file_mimeType: "application/pdf",
                invoice_file_url: "",
            },
        });

        // Create Surge checkout session
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/billing`;

        const surgeSession = await createSurgeCheckoutSession(
            user.team_id,
            invoice,
            returnUrl
        );

        if (!surgeSession?.url) {
            return NextResponse.json(
                { error: "Failed to create Surge payment session. Check Surge integration settings." },
                { status: 500 }
            );
        }

        return NextResponse.json({ url: surgeSession.url });
    } catch (error) {
        systemLogger.error("[SURGE_CHECKOUT_API]", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
