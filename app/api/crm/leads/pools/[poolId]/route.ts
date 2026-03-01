import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export async function GET(req: Request, context: { params: Promise<{ poolId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { poolId } = await context.params;

        if (!poolId) {
            return new NextResponse("Missing poolId", { status: 400 });
        }

        // Verify user role
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_role: true }
        });

        const teamInfo = await getCurrentUserTeamId();
        const isGlobalAdmin = teamInfo?.isGlobalAdmin;
        const isTeamAdmin = user?.team_role === "ADMIN" || user?.team_role === "OWNER";
        const teamId = teamInfo?.teamId;

        const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
            where: { id: poolId },
            include: {
                _count: {
                    select: { candidates: true },
                },
            }
        });

        if (!pool) {
            return new NextResponse("Pool not found", { status: 404 });
        }

        // Permissions
        const isOwner = pool.user === session.user.id;
        const isTeamMatch = pool.team_id === teamId;
        const assignedMembers = pool.assigned_members || [];
        const isAssigned = assignedMembers.includes(session.user.id);

        if (!isGlobalAdmin && !isOwner && !(isTeamAdmin && isTeamMatch) && !isAssigned) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        return NextResponse.json(pool);

    } catch (error: any) {
        systemLogger.error("[POOL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
