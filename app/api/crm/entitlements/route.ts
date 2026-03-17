import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * Entitlement CRUD API
 * 
 * GET  /api/crm/entitlements?account_id=xxx — List entitlements
 * POST /api/crm/entitlements — Create entitlement
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const url = new URL(req.url);
        const accountId = url.searchParams.get("account_id");
        const activeOnly = url.searchParams.get("active") === "true";

        const where: any = {};
        if (accountId) where.account_id = accountId;
        if (activeOnly) {
            where.is_active = true;
            where.end_date = { gte: new Date() };
            where.start_date = { lte: new Date() };
        }

        const entitlements = await prismadb.crm_Entitlement.findMany({
            where,
            include: {
                account: { select: { name: true } },
            },
            orderBy: { end_date: "desc" },
        });

        return NextResponse.json(entitlements);
    } catch (error) {
        console.error("[ENTITLEMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        const body = await req.json();
        const {
            name, account_id, type, total_cases, total_hours,
            response_time_hrs, channels, start_date, end_date,
        } = body;

        if (!name || !account_id || !type || !start_date || !end_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const entitlement = await prismadb.crm_Entitlement.create({
            data: {
                name,
                account_id,
                type,
                total_cases: total_cases || null,
                remaining_cases: total_cases || null,
                total_hours: total_hours || null,
                remaining_hours: total_hours || null,
                response_time_hrs: response_time_hrs || null,
                channels: channels || ["email", "phone", "chat", "portal"],
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                team_id: user?.team_id || null,
            },
        });

        return NextResponse.json(entitlement);
    } catch (error) {
        console.error("[ENTITLEMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * Check entitlement before case creation.
 * Call this before creating a case to verify the customer has remaining support.
 */
export async function checkEntitlement(accountId: string, channel: string = "email"): Promise<{
    allowed: boolean;
    entitlement: any | null;
    reason?: string;
}> {
    const entitlements = await prismadb.crm_Entitlement.findMany({
        where: {
            account_id: accountId,
            is_active: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
        },
    });

    if (entitlements.length === 0) {
        return { allowed: false, entitlement: null, reason: "No active entitlement found" };
    }

    // Find a matching entitlement for the channel
    const matching = entitlements.find(e =>
        e.channels.length === 0 || e.channels.includes(channel)
    );

    if (!matching) {
        return { allowed: false, entitlement: null, reason: `Channel "${channel}" not covered by any entitlement` };
    }

    // Check case limits
    if (matching.type === "cases" && matching.remaining_cases !== null && matching.remaining_cases <= 0) {
        return { allowed: false, entitlement: matching, reason: "Case limit exhausted" };
    }

    return { allowed: true, entitlement: matching };
}

/**
 * Decrement entitlement on case creation.
 */
export async function decrementEntitlement(entitlementId: string) {
    await prismadb.crm_Entitlement.update({
        where: { id: entitlementId },
        data: {
            remaining_cases: { decrement: 1 },
        },
    });
}
