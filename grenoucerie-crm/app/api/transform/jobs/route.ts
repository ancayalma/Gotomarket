import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || null;
        const teamId = session?.user?.team_id || null;

        let whereClause = {};
        if (userId) {
            whereClause = {
                OR: [
                    { userId: userId },
                    ...(teamId ? [{ teamId }] : [])
                ]
            };
        }

        const jobs = await (prismadb as any).crm_Transform_Jobs.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        return NextResponse.json(jobs);
    } catch (error: any) {
        console.error("[JOBS_LIST_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
