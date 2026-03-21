import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET: Fetch all domain verification requests across teams (platform admin only)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify platform admin
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { is_admin: true, assigned_team: { select: { slug: true } } }
    });

    const isInternal = user?.assigned_team?.slug === "ledger1" || user?.assigned_team?.slug === "basalt" || user?.assigned_team?.slug === "basalthq";
    if (!user?.is_admin && !isInternal) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configs = await prismadb.teamEmailConfig.findMany({
        where: {
            custom_domain: { not: null },
        },
        select: {
            id: true,
            team_id: true,
            custom_domain: true,
            domain_status: true,
            domain_dkim_tokens: true,
            domain_verification_token: true,
            domain_requested_at: true,
            from_email: true,
            purpose: true,
            assigned_team: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    assigned_plan: { select: { name: true, slug: true } },
                    subscription_plan: true,
                    owner: { select: { name: true, email: true } },
                }
            }
        },
        orderBy: { domain_requested_at: "desc" },
    });

    return NextResponse.json(configs);
}

// PATCH: Update domain verification status (approve / reject)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { is_admin: true, assigned_team: { select: { slug: true } } }
    });

    const isInternal = user?.assigned_team?.slug === "ledger1" || user?.assigned_team?.slug === "basalt" || user?.assigned_team?.slug === "basalthq";
    if (!user?.is_admin && !isInternal) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { configId, action } = await req.json();

    if (!configId || !["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "configId and action (approve/reject) required" }, { status: 400 });
    }

    const config = await prismadb.teamEmailConfig.findUnique({ where: { id: configId } });
    if (!config || !config.custom_domain) {
        return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "DNS_PENDING" : "FAILED";

    await prismadb.teamEmailConfig.update({
        where: { id: configId },
        data: { domain_status: newStatus },
    });

    return NextResponse.json({ success: true, status: newStatus });
}
