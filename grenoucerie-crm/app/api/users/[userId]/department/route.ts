import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * PUT /api/users/[userId]/department
 * Assign a user to a department (sets team_id to the department's Team)
 * or move them back to the organization level.
 *
 * Body: { departmentId: string | null, role?: string, organizationId: string }
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
            select: { team_role: true, is_admin: true, team_id: true }
        });

        const reqRole = (requester?.team_role || "").toUpperCase();
        const isAdmin = requester?.is_admin === true ||
            ["ADMIN", "OWNER", "PLATFORM_ADMIN", "SUPER_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(reqRole);

        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden: Company admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { departmentId, role = "MEMBER", organizationId } = body;

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (departmentId) {
            // Assigning to a department — verify it exists and is a DEPARTMENT type under this org
            const dept = await prismadb.team.findUnique({
                where: { id: departmentId },
                select: { team_type: true, parent_id: true }
            });
            if (!dept || (dept as any).team_type !== "DEPARTMENT") {
                return NextResponse.json({ error: "Invalid department" }, { status: 400 });
            }

            // Fetch the target user's current role before we blow it away
            const targetUser = await prismadb.users.findUnique({
                where: { id: userId },
                select: { team_role: true, team_id: true }
            });
            const tRole = (targetUser?.team_role || "").toUpperCase();
            const isTargetAdmin = ["ADMIN", "OWNER", "PLATFORM_ADMIN", "SUPER_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(tRole);

            // Build update data
            // Top-level admins retain their organization team_id & role, only gaining department_id affinity
            const dataToUpdate: any = {
                department_id: departmentId,
            };

            if (!isTargetAdmin) {
                // For normal users, move them squarely into the department team
                dataToUpdate.team_id = departmentId;
                dataToUpdate.team_role = role;
            } else {
                systemLogger.info(`[USER_DEPT] Target ${userId} is top-level admin (${tRole}); preserving global team_id and role.`);
            }

            // Move user to the department team with chosen role (or just update department_id for admins)
            const updated = await prismadb.users.update({
                where: { id: userId },
                data: dataToUpdate
            });

            systemLogger.info(`[USER_DEPT] User ${userId} assigned to dept ${departmentId} with role ${role}`);
            return NextResponse.json({ team_id: updated.team_id, team_role: updated.team_role });
        } else {
            // Unassigning — move user back to the organization level
            const targetUser = await prismadb.users.findUnique({
                where: { id: userId },
                select: { team_role: true }
            });
            const tRole = (targetUser?.team_role || "").toUpperCase();
            const isTargetAdmin = ["ADMIN", "OWNER", "PLATFORM_ADMIN", "SUPER_ADMIN", "PLATFORM ADMIN", "SYSADM"].includes(tRole);
            
            const dataToUpdate: any = { department_id: null };
            
            if (!isTargetAdmin) {
                // If they are a top-level admin, DO NOT downgrade their role to MEMBER.
                dataToUpdate.team_id = organizationId;
                dataToUpdate.team_role = "MEMBER";
            } else {
                systemLogger.info(`[USER_DEPT] Target ${userId} is top-level admin (${tRole}); preserving global team_id and role on unassign.`);
            }

            const updated = await prismadb.users.update({
                where: { id: userId },
                data: dataToUpdate
            });

            systemLogger.info(`[USER_DEPT] User ${userId} moved back to org ${organizationId}`);
            return NextResponse.json({ team_id: updated.team_id, team_role: updated.team_role });
        }
    } catch (error) {
        systemLogger.error("[USER_DEPT_PUT]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
