import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const orConditions: any[] = [
            { user: session.user.id },
            { assigned_members: { has: session.user.id } },
        ];

        if (teamId && typeof teamId === 'string') {
            orConditions.push({
                team_id: teamId
            });
        }

        const lists = await prismadb.crm_Lead_Pools.findMany({
            where: {
                OR: orConditions,
                status: "ACTIVE", // Or filter by status if needed
            },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                createdAt: true,
                color: true,
                assigned_user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ lists }, { status: 200 });

    } catch (error) {
        console.error("[LISTS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
