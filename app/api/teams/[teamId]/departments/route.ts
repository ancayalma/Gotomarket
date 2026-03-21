import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/teams/[teamId]/departments
 * Lists all departments under the given organization team.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const { teamId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const departments = await prismadb.team.findMany({
            where: {
                parent_id: teamId,
                team_type: "DEPARTMENT",
            } as any,
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ departments });
    } catch (error) {
        console.error("[TEAMS_DEPARTMENTS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
