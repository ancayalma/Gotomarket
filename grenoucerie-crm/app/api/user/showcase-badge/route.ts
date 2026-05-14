import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * POST /api/user/showcase-badge
 * Sets the user's chosen showcase badge.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { badgeId } = await req.json();

        // Verify the user actually owns this badge
        const badge = await prismadb.userBadge.findFirst({
            where: {
                user_id: session.user.id,
                badge_id: badgeId,
            },
        });

        if (!badge) {
            return NextResponse.json({ error: "Badge not earned" }, { status: 400 });
        }

        await prismadb.users.update({
            where: { id: session.user.id },
            data: { showcase_badge_id: badge.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SHOWCASE_BADGE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
