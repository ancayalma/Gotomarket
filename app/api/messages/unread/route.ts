import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET(req: Request) {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamId = teamInfo.teamId;

        const count = await prismadb.internalMessageRecipient.count({
            where: {
                recipient_id: teamInfo.userId,
                is_read: false,
                is_deleted: false,
                is_archived: false,
                recipient_type: { in: ["TO", "CC"] }, // Count direct and CC messages
                message: {
                    team_id: teamId || undefined
                }
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("[MESSAGES_UNREAD_COUNT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
