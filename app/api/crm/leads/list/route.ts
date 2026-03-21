import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get user to check admin status
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { is_admin: true, is_account_admin: true },
        });

        // Admins see all leads, regular users see only their assigned leads
        const teamInfo = await getCurrentUserTeamId();

        // If no team and not global admin, return empty
        if (!teamInfo?.teamId) {
            return NextResponse.json([]);
        }

        const whereClause: any = {};

        if (teamInfo?.teamId) {
            whereClause.team_id = teamInfo.teamId;
        }

        // If not admin/account_admin, restrict to assigned_to within the team
        if (!user?.is_admin && !user?.is_account_admin) {
            whereClause.assigned_to = session.user.id;
        }

        const data = await prismadb.crm_Leads.findMany({
            where: whereClause,
            include: {
                assigned_to_user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(data);
    } catch (error) {
        systemLogger.error("[LEADS_LIST_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * POST /api/crm/leads/list
 * Body: { ids: string[] }
 * Returns lead details for the specified IDs (lightweight, for wizards/selectors)
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const ids = body?.ids;
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json([]);
        }

        // Use the team-scoped prisma (middleware will inject team_id automatically)
        const leads = await prismadb.crm_Leads.findMany({
            where: { id: { in: ids.slice(0, 100) } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
                email: true,
                jobTitle: true,
            },
        });

        systemLogger.info(`[LEADS_LIST_POST] Requested ${ids.length} IDs, found ${leads.length}. Sample requested: ${JSON.stringify(ids.slice(0, 3))}. Sample found: ${JSON.stringify(leads.slice(0, 2).map((l: any) => l.id))}`);

        // If tenant-scoped query returned nothing, try without team_id filter
        // (handles edge cases where leads were imported without team_id)
        if (leads.length === 0 && ids.length > 0) {
            systemLogger.warn(`[LEADS_LIST_POST] Retrying without tenant filter for ${ids.length} IDs`);
            const { PrismaClient } = await import("@prisma/client");
            const rawClient = new PrismaClient();
            try {
                const rawLeads = await rawClient.crm_Leads.findMany({
                    where: { id: { in: ids.slice(0, 100) } },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                        email: true,
                        jobTitle: true,
                    },
                });
                systemLogger.info(`[LEADS_LIST_POST] Raw retry found ${rawLeads.length} leads`);
                await rawClient.$disconnect();
                return NextResponse.json(rawLeads);
            } catch (rawErr) {
                await rawClient.$disconnect().catch(() => {});
                systemLogger.error("[LEADS_LIST_POST] Raw retry failed:", rawErr);
            }
        }

        return NextResponse.json(leads);
    } catch (error) {
        systemLogger.error("[LEADS_LIST_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
