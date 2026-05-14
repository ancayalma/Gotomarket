import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { systemLogger } from "@/lib/logger";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

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

        const { pages, fileName, type } = await req.json();

        if (!pages || !type) {
            return NextResponse.json({ error: "Invalid parameters for checkout" }, { status: 400 });
        }

        // Pricing logic
        let unitAmount = 5; // default 5 cents
        let freeLimit = 5;
        let toolName = "Tabular Extraction";

        if (type === "EXCEL") {
            unitAmount = 5; freeLimit = 5; toolName = "Tabular Extraction";
        } else if (type === "MARKDOWN") {
            unitAmount = 2; freeLimit = 10; toolName = "Layout to Markdown";
        } else if (type === "JSON") {
            unitAmount = 2; freeLimit = 10; toolName = "Receipts to JSON";
        } else if (type === "TEXT") {
            unitAmount = 1; freeLimit = 20; toolName = "Handwriting & OCR";
        }

        if (pages <= freeLimit || pages > 200) {
            return NextResponse.json({ error: "Invalid page count for checkout" }, { status: 400 });
        }

        const customerId = await getOrCreateStripeCustomer(user.team_id, user.email!, user.assigned_team?.name);

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "payment",
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `BasaltLens: ${toolName}`,
                        description: `AI processing of ${pages} units from ${fileName}`,
                    },
                    unit_amount: unitAmount,
                },
                quantity: pages,
            }],
            success_url: `${APP_URL}/transform?checkout=success`,
            cancel_url: `${APP_URL}/transform?checkout=cancelled`,
            metadata: {
                team_id: user.team_id,
                user_id: user.id,
                type: "BASALT_LENS",
                transform_type: type,
                pages: pages.toString(),
                file_name: fileName,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        systemLogger.error("[PDF_WIZARD_CHECKOUT]", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
