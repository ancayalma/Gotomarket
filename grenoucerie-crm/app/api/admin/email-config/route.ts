import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/admin/email-config
 * Returns all email configs for the current user's team.
 * Auto-resolves team from session — no teamId param needed.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_id: true },
    });

    if (!user?.team_id) {
        return NextResponse.json([]);
    }

    const configs = await prismadb.teamEmailConfig.findMany({
        where: { team_id: user.team_id },
        select: {
            id: true,
            purpose: true,
            provider: true,
            from_name: true,
            from_email: true,
            verification_status: true,
        },
    });

    return NextResponse.json(configs);
}
