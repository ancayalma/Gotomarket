import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/users/[userId]/modules
 * Returns the assigned_modules for a user.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { id: userId },
            select: { assigned_modules: true, name: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            modules: user.assigned_modules || [],
            name: user.name
        });
    } catch (error) {
        systemLogger.error("[USER_MODULES_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * PUT /api/users/[userId]/modules
 * Admin sets the module whitelist for an individual user.
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin status
        const requester = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_role: true, is_admin: true }
        });

        const role = (requester?.team_role || "").toUpperCase();
        const isAdmin = requester?.is_admin === true ||
            ["ADMIN", "OWNER", "PLATFORM_ADMIN", "SUPER_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(role);

        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { modules } = body;

        if (!Array.isArray(modules)) {
            return NextResponse.json({ error: "Invalid modules format" }, { status: 400 });
        }

        const updated = await prismadb.users.update({
            where: { id: userId },
            data: { assigned_modules: modules }
        });

        systemLogger.info(`[USER_MODULES] Updated modules for user ${userId}:`, modules);
        return NextResponse.json({ modules: updated.assigned_modules });
    } catch (error) {
        systemLogger.error("[USER_MODULES_PUT]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
