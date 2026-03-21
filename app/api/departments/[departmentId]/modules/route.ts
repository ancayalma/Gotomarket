import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/departments/[departmentId]/modules
 * Returns the allowed_modules for a department.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    const { departmentId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const department = await prismadb.team.findUnique({
            where: { id: departmentId },
            select: { allowed_modules: true, name: true }
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        return NextResponse.json({
            modules: department.allowed_modules || [],
            name: department.name
        });
    } catch (error) {
        systemLogger.error("[DEPT_MODULES_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * PUT /api/departments/[departmentId]/modules
 * Company admin sets the module whitelist for a department.
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    const { departmentId } = await params;
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

        const updated = await prismadb.team.update({
            where: { id: departmentId },
            data: { allowed_modules: modules }
        });

        systemLogger.info(`[DEPT_MODULES] Updated modules for department ${departmentId}:`, modules);
        return NextResponse.json({ modules: updated.allowed_modules });
    } catch (error) {
        systemLogger.error("[DEPT_MODULES_PUT]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
