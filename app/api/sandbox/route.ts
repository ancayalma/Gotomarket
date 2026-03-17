import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { createSandbox } from "@/lib/sandbox/sandbox-service";

/**
 * GET /api/sandbox — List sandboxes for the current team
 */
export async function GET() {
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
            return NextResponse.json({ error: "No team" }, { status: 400 });
        }

        const sandboxes = await prismadb.sandbox.findMany({
            where: { team_id: user.team_id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { deploy_logs: true },
                },
            },
        });

        return NextResponse.json(sandboxes);
    } catch (error) {
        console.error("[SANDBOX_LIST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * POST /api/sandbox — Create new sandbox
 * Body: { name: string, description?: string }
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
            return NextResponse.json({ error: "No team" }, { status: 400 });
        }

        const { name, description } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Check for active sandbox limit (max 3)
        const activeCount = await prismadb.sandbox.count({
            where: { team_id: user.team_id, status: "ACTIVE" },
        });

        if (activeCount >= 3) {
            return NextResponse.json(
                { error: "Maximum 3 active sandboxes allowed. Promote or discard existing ones first." },
                { status: 400 }
            );
        }

        const sandbox = await createSandbox(
            user.team_id,
            session.user.id,
            name.trim(),
            description?.trim()
        );

        return NextResponse.json(sandbox, { status: 201 });
    } catch (error) {
        console.error("[SANDBOX_CREATE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
