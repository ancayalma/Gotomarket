import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createStripePortalSession } from "@/lib/stripe";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/billing/stripe/portal
 * 
 * Creates a Stripe Customer Portal session for managing existing subscriptions.
 * Returns { url: string } to redirect the user.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        if (!user?.team_id) {
            return NextResponse.json({ error: "No team found" }, { status: 400 });
        }

        const sub = await prismadb.crm_Subscriptions.findUnique({
            where: { tenant_id: user.team_id },
        });

        if (!sub?.stripe_customer_id) {
            return NextResponse.json(
                { error: "No Stripe subscription found. Please subscribe first." },
                { status: 400 }
            );
        }

        const portalSession = await createStripePortalSession(sub.stripe_customer_id);
        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        systemLogger.error("[STRIPE_PORTAL_API]", error);
        return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
    }
}
