import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { DEFAULT_CURRENCIES } from "@/lib/currency";

/**
 * GET /api/crm/currencies
 * List all active currencies (system + team overrides).
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get user's team
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        // Get currencies: team-specific first, then system defaults
        const currencies = await prismadb.crm_Currency.findMany({
            where: {
                is_active: true,
                OR: [
                    { team_id: user?.team_id || undefined },
                    { team_id: null },
                ],
            },
            orderBy: { code: "asc" },
        });

        // Deduplicate: team-specific overrides take precedence
        const deduped = new Map<string, typeof currencies[0]>();
        for (const c of currencies) {
            if (!deduped.has(c.code) || c.team_id) {
                deduped.set(c.code, c);
            }
        }

        return NextResponse.json(Array.from(deduped.values()));
    } catch (error) {
        console.error("[CURRENCIES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * POST /api/crm/currencies
 * Update exchange rates (admin only) or seed defaults.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();

        // Seed defaults
        if (body.action === "seed") {
            const user = await prismadb.users.findUnique({
                where: { id: session.user.id },
                select: { team_id: true },
            });

            let created = 0;
            for (const currency of DEFAULT_CURRENCIES) {
                try {
                    await prismadb.crm_Currency.create({
                        data: {
                            ...currency,
                            team_id: user?.team_id || null,
                        },
                    });
                    created++;
                } catch {
                    // Already exists, skip
                }
            }

            return NextResponse.json({ success: true, created });
        }

        // Update single rate
        if (body.code && body.exchange_rate_to_usd !== undefined) {
            const user = await prismadb.users.findUnique({
                where: { id: session.user.id },
                select: { team_id: true },
            });

            const updated = await prismadb.crm_Currency.updateMany({
                where: {
                    code: body.code,
                    team_id: user?.team_id || null,
                },
                data: {
                    exchange_rate_to_usd: body.exchange_rate_to_usd,
                    last_updated: new Date(),
                },
            });

            return NextResponse.json({ success: true, updated: updated.count });
        }

        return new NextResponse("Invalid request", { status: 400 });
    } catch (error) {
        console.error("[CURRENCIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
