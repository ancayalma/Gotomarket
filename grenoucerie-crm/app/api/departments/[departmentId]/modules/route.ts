import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/departments/[departmentId]/modules
 * Returns the allowed_modules for a department and its parent's limits.
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
            include: {
                parent_team: {
                    include: { assigned_plan: true }
                }
            }
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        const planSlug = department.parent_team?.assigned_plan?.slug || department.parent_team?.subscription_plan || "FREE";
        const { getSubscriptionPlan } = await import("@/lib/subscription");
        let parentLimits = getSubscriptionPlan(planSlug).features || [];
        
        if (department.parent_team?.assigned_plan) {
            parentLimits = Array.from(new Set([...department.parent_team.assigned_plan.features, ...parentLimits]));
        }
        if (department.parent_team?.module_overrides) {
            parentLimits = Array.from(new Set([...parentLimits, ...department.parent_team.module_overrides]));
        }

        return NextResponse.json({
            modules: department.allowed_modules || [],
            name: department.name,
            parentLimits
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

        // Load parent limits to enforce security
        const department = await prismadb.team.findUnique({
            where: { id: departmentId },
            include: { parent_team: { include: { assigned_plan: true } } }
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        const planSlug = department.parent_team?.assigned_plan?.slug || department.parent_team?.subscription_plan || "FREE";
        const { getSubscriptionPlan } = await import("@/lib/subscription");
        let parentLimits = getSubscriptionPlan(planSlug).features || [];
        
        if (department.parent_team?.assigned_plan) {
            parentLimits = Array.from(new Set([...department.parent_team.assigned_plan.features, ...parentLimits]));
        }
        if (department.parent_team?.module_overrides) {
            parentLimits = Array.from(new Set([...parentLimits, ...department.parent_team.module_overrides]));
        }

        // Filter provided modules, ignoring anything the parent doesn't have access to
        const isSuperAdmin = parentLimits.includes('all');
        const safeModules = isSuperAdmin ? modules : modules.filter(m => parentLimits.includes(m) || parentLimits.includes(`${m}.view`));

        const updated = await prismadb.team.update({
            where: { id: departmentId },
            data: { allowed_modules: safeModules }
        });

        systemLogger.info(`[DEPT_MODULES] Updated modules for department ${departmentId}:`, safeModules);
        return NextResponse.json({ modules: updated.allowed_modules });
    } catch (error) {
        systemLogger.error("[DEPT_MODULES_PUT]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
