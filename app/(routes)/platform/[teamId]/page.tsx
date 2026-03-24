import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import TeamDetailsView from "./_components/TeamDetailsView";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getTeam } from "@/actions/teams/get-team";
import { getPlans } from "@/actions/plans/plan-actions";


const TeamDetailsPage = async ({ params }: { params: Promise<{ teamId: string }> }) => {
    const resolvedParams = await params;
    const [team, plans] = await Promise.all([
        getTeam(resolvedParams.teamId),
        getPlans()
    ]);
    const currentUserInfo = await getCurrentUserTeamId();

    // Fetch System Resend Key Data for Global Admins
    let systemResendData = { resendKeyId: "", envKey: undefined as string | undefined, dbKey: undefined as string | undefined };
    let ownerInfo = null;
    let roleCounts = { owner: 0, admin: 0, member: 0, viewer: 0 };
    let customRoles: any[] = [];
    let departments: any[] = [];

    let apiKeys: any[] = [];
    let apiLogs: any[] = [];

    const role = (currentUserInfo?.teamRole || '').toUpperCase();
    const isTeamSuperAdmin = currentUserInfo?.teamId === team?.id && ['SUPER_ADMIN', 'OWNER', 'PLATFORM_ADMIN', 'SYSADM'].includes(role);
    const canManageTeam = currentUserInfo?.isGlobalAdmin || isTeamSuperAdmin;

    // Detect if this is the platform exempt team
    const INTERNAL_SLUGS = ["basalt", "basalthq", "ledger1"];
    const isExemptTeam = team ? INTERNAL_SLUGS.includes(team.slug?.toLowerCase()) : false;

    if (canManageTeam && team) {
        const [resend_key, owner, roleCountsData, customRolesData, departmentsData, keysData, logsData] = await Promise.all([
            prismadb.systemServices.findFirst({
                where: { name: "resend_smtp" },
            }),
            // Fetch owner info
            team.owner_id ? prismadb.users.findUnique({
                where: { id: team.owner_id },
                select: { id: true, name: true, email: true, phone: true }
            }) : null,
            // Fetch role counts for this team
            Promise.all([
                prismadb.users.count({ where: { team_id: team.id, team_role: "OWNER" } }),
                prismadb.users.count({ where: { team_id: team.id, team_role: "ADMIN" } }),
                prismadb.users.count({ where: { team_id: team.id, OR: [{ team_role: "MEMBER" }, { team_role: null }] } }),
                prismadb.users.count({ where: { team_id: team.id, team_role: "VIEWER" } }),
            ]),
            // Fetch custom roles for this team
            prismadb.customRole.findMany({
                where: { team_id: team.id },
                include: { _count: { select: { users: true } } },
                orderBy: { created_at: "asc" },
            }),
            // Fetch departments for this team
            prismadb.team.findMany({
                where: {
                    parent_id: team.id,
                    team_type: "DEPARTMENT",
                },
                include: {
                    members: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            team_role: true,
                        },
                    },
                    _count: {
                        select: { members: true },
                    },
                },
                orderBy: { name: "asc" },
            }),
            // Fetch API Keys
            prismadb.crm_ApiKeys.findMany({
                where: { tenant_id: team.id },
                orderBy: { createdAt: "desc" }
            }),
            // Fetch API Logs
            prismadb.crm_ApiLogs.findMany({
                where: { tenant_id: team.id },
                orderBy: { timestamp: "desc" },
                take: 50
            })
        ]);

        systemResendData = {
            resendKeyId: resend_key?.id ?? "",
            // SECURITY: Only expose env key to Global Admins
            envKey: currentUserInfo?.isGlobalAdmin ? process.env.RESEND_API_KEY : undefined,
            dbKey: resend_key?.serviceKey || undefined,
        };

        ownerInfo = owner;
        roleCounts = {
            owner: roleCountsData[0],
            admin: roleCountsData[1],
            member: roleCountsData[2],
            viewer: roleCountsData[3],
        };
        customRoles = customRolesData;
        departments = departmentsData;
        apiKeys = keysData;
        apiLogs = logsData;
    }

    if (!team) {
        return notFound();
    }

    // For exempt team: filter to PLATFORM_ADMIN only (managed from admin for everything else)
    // For non-exempt teams: load ALL members including department-scoped users for full management
    let enrichedMembers = team.members || [];

    if (isExemptTeam) {
        // Only show platform admins — PLATFORM_ADMIN role always takes precedence
        enrichedMembers = enrichedMembers.filter((m: any) =>
            m.team_role === 'PLATFORM_ADMIN' || m.team_role === 'SYSADM'
        );
    } else if (canManageTeam) {
        // For non-exempt teams: fetch full member list including department members
        const allMembers = await prismadb.users.findMany({
            where: {
                OR: [
                    { team_id: team.id },
                    { assigned_team: { parent_id: team.id } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team_role: true,
                department_id: true,
                userStatus: true,
            },
            orderBy: { created_on: "desc" },
        });
        enrichedMembers = allMembers;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-4">
                <Link href="/platform" className="btn btn-ghost btn-sm">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
            </div>

            <TeamDetailsView
                team={{ ...team, members: enrichedMembers }}
                availablePlans={plans}
                currentUserInfo={currentUserInfo}
                systemResendData={systemResendData}
                ownerInfo={ownerInfo}
                roleCounts={roleCounts}
                customRoles={customRoles}
                departments={departments}
                apiKeys={apiKeys}
                apiLogs={apiLogs}
                isExemptTeam={isExemptTeam}
            />
        </div>
    );
};

export default TeamDetailsPage;

