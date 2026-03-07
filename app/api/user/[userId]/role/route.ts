import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getSessionAndTeam, validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    const { error, teamInfo, session } = await getSessionAndTeam();

    if (error) return error;

    try {
        const body = await req.json();
        const { team_role } = body;

        if (!team_role) {
            return new NextResponse("Role is required", { status: 400 });
        }

        // 1. Fetch the target user to verify they exist and belong to the correct team
        const targetUser = await prismadb.users.findUnique({
            where: { id: params.userId },
            select: { id: true, email: true, team_id: true }
        });

        if (!targetUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 2. SOC2 Ownership/RBAC Check - Admins can only edit users on their own team
        if (!validateResourceOwnership(teamInfo!.teamId, targetUser.team_id, false)) {
            return await unauthorizedResponse("UPDATE_ROLE", `Users:${params.userId}`);
        }

        const callerRole = teamInfo!.teamRole || "";

        // Only PLATFORM_ADMIN can assign PLATFORM_ADMIN role
        if (team_role === "PLATFORM_ADMIN" && callerRole !== "PLATFORM_ADMIN") {
            return new NextResponse("Unauthorized to assign PLATFORM_ADMIN", { status: 403 });
        }

        // Also prevent non-admins from changing roles
        if (callerRole !== "PLATFORM_ADMIN" && callerRole !== "SUPER_ADMIN" && callerRole !== "ADMIN") {
            return await unauthorizedResponse("UPDATE_ROLE", `Users:${params.userId}`);
        }

        const updateData: any = {
            team_role,
        };

        if (team_role === "PLATFORM_ADMIN") {
            updateData.is_admin = true;
            updateData.is_account_admin = true;
        } else if (team_role === "MEMBER" || team_role === "VIEWER") {
            updateData.is_admin = false;
        }

        const user = await prismadb.users.update({
            where: {
                id: params.userId,
            },
            data: updateData,
            select: { email: true, team_role: true }
        });

        // 3. SOC2 Audit Log
        await logActivityInternal(
            session!.user.id,
            "ROLE_CHANGE",
            "User Management",
            `Updated role for ${user.email} to ${team_role}`,
            teamInfo!.teamId || undefined
        );

        // 4. SOC2 Critical Event Escalation Notification
        try {
            const sendEmail = (await import("@/lib/sendmail")).default;
            await sendEmail({
                to: user.email,
                subject: "Security Alert: Platform Role Changed",
                text: `Your account role has been changed to ${team_role} by an administrator. If you did not expect this, please contact your Security Officer or IT Admin immediately.`,
                html: `
                    <p>Your account role has been changed to <strong>${team_role}</strong> by an administrator.</p>
                    <p>If you did not expect this, please contact your Security Officer or IT Admin immediately.</p>
                `
            });
        } catch (emailError) {
            console.error("Failed to send SOC2 role escalation email:", emailError);
        }

        return NextResponse.json(user);
    } catch (error) {
        systemLogger.error("[USER_ROLE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
