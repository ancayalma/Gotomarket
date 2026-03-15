import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createStripeCheckoutSession, createStripeTopUpSession } from "@/lib/stripe";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/billing/stripe/checkout
 * 
 * Creates a Stripe Checkout Session for:
 * - Subscription plans (planSlug + interval)
 * - One-time AI token top-ups (topUp: true)
 * 
 * Returns { url: string } to redirect the user to Stripe Checkout.
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

        let checkoutSession;

        if (topUp) {
            // AI Token Top-Up (one-time payment)
            checkoutSession = await createStripeTopUpSession(
                user.team_id,
                user.email!,
                user.assigned_team?.name
            );
        } else {
            // Subscription checkout
            if (!planSlug) {
                return NextResponse.json({ error: "planSlug is required" }, { status: 400 });
            }

            checkoutSession = await createStripeCheckoutSession(
                user.team_id,
                user.email!,
                planSlug,
                interval,
                user.assigned_team?.name
            );
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        systemLogger.error("[STRIPE_CHECKOUT_API]", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
