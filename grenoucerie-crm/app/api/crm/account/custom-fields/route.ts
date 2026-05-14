import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/crm/account/custom-fields
 * Fetch the team's custom field definitions for accounts
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return NextResponse.json({ definitions: [] }, { status: 200 });
        }

        const team = await prismadb.team.findUnique({
            where: { id: teamInfo.teamId },
            select: { custom_field_definitions: true },
        });

        return NextResponse.json({
            definitions: (team as any)?.custom_field_definitions || [],
        });
    } catch (error) {
        systemLogger.error("[CUSTOM_FIELDS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

/**
 * PUT /api/crm/account/custom-fields
 * Update the team's custom field definitions
 */
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return new NextResponse("No team found", { status: 400 });
        }

        // Only admins can modify field definitions
        if (!teamInfo.isAdmin) {
            return new NextResponse("Unauthorized — admin access required", { status: 403 });
        }

        const body = await req.json();
        const { definitions } = body;

        if (!Array.isArray(definitions)) {
            return new NextResponse("definitions must be an array", { status: 400 });
        }

        // Validate each definition has required fields
        for (const def of definitions) {
            if (!def.key || !def.label || !def.type || !def.tab) {
                return NextResponse.json(
                    { error: `Field definition missing required properties (key, label, type, tab)` },
                    { status: 400 }
                );
            }
        }

        await (prismadb.team as any).update({
            where: { id: teamInfo.teamId },
            data: {
                custom_field_definitions: definitions,
            },
        });

        return NextResponse.json({ success: true, definitions });
    } catch (error) {
        systemLogger.error("[CUSTOM_FIELDS_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
