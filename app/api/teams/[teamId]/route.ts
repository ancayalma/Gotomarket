import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getSessionAndTeam, unauthorizedResponse, validateResourceOwnership } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

export async function DELETE(
    req: Request,
    props: { params: Promise<{ teamId: string }> }
) {
    const params = await props.params;
    const { error, teamInfo, session } = await getSessionAndTeam();

    if (error) return error;

    const targetTeamId = params.teamId;

    if (!targetTeamId) {
        return new NextResponse("Team ID is required", { status: 400 });
    }

    // 1. SOC2 RBAC Check: Only Platform Admins or the Team Owner can delete a team
    const isPlatformAdmin = teamInfo!.isPlatformAdmin;
    const isTeamOwner = teamInfo!.teamRole === "OWNER" && targetTeamId === teamInfo!.teamId;

    if (!isPlatformAdmin && !isTeamOwner) {
        return await unauthorizedResponse("DELETE_TEAM", `Team:${targetTeamId}`);
    }

    try {
        // Find the team to be sure it exists
        const teamToPurge = await prismadb.team.findUnique({
            where: { id: targetTeamId }
        });

        if (!teamToPurge) {
            return new NextResponse("Team not found", { status: 404 });
        }

        // 2. Data Disposition: Purge related records to satisfy Data Retention / Right to be Forgotten
        // Note: MongoDB Prisma models often require manual deletion for NoAction/SetNull defaults.

        const prismaAny = prismadb as any;

        // Purge CRM Data
        await prismaAny.crm_Accounts?.deleteMany({ where: { team_id: targetTeamId } });
        await prismaAny.crm_Contacts?.deleteMany({ where: { team_id: targetTeamId } });
        await prismaAny.crm_Leads?.deleteMany({ where: { team_id: targetTeamId } });
        await prismaAny.crm_Opportunities?.deleteMany({ where: { team_id: targetTeamId } });
        await prismaAny.crm_Documents?.deleteMany({ where: { team_id: targetTeamId } });

        // Purge System/Core Data
        await prismaAny.myAccount?.deleteMany({ where: { team_id: targetTeamId } });
        await prismaAny.systemActivity?.deleteMany({ where: { team_id: targetTeamId } });

        // Remove users from the team (or delete them if they should only belong to this team)
        // For compliance, we downgrade users instead of deleting the user account entirely,
        // or delete them if the platform enforces 1 user to 1 team.
        await prismadb.users.updateMany({
            where: { team_id: targetTeamId },
            data: {
                team_id: null as any,
                team_role: "VIEWER",
                is_admin: false,
                is_account_admin: false
            }
        });

        // Finally, delete the team record
        await prismadb.team.delete({
            where: { id: targetTeamId }
        });

        // 3. SOC2 Audit Log
        await logActivityInternal(
            session!.user.id,
            "RECORD_DELETE",
            "Tenant Management",
            `Purged team and associated data: ${teamToPurge.name} (${targetTeamId})`,
            teamInfo!.teamId || undefined
        );

        return NextResponse.json({ success: true, message: "Team and related data purged completely." }, { status: 200 });

    } catch (err) {
        systemLogger.error("[PURGE_TEAM_DELETE]", err);
        return new NextResponse("Internal server error during data purge", { status: 500 });
    }
}
