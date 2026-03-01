import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        const user = await prismadb.users.findFirst({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        await (prismadb.users as any).update({
            where: { id: user.id },
            data: {
                termsAccepted: true,
                termsAcceptedAt: new Date()
            }
        });

        // SOC2 Compliance: Log that the user actually accepted the terms at this timestamp
        await logActivityInternal(
            user.id,
            "TERMS_ACCEPTED",
            "Compliance",
            `User accepted the Terms of Service and Privacy Policy.`,
            user.team_id || undefined
        );

        return NextResponse.json({ success: true, message: "Terms accepted successfully" });
    } catch (error) {
        systemLogger.error("[ACCEPT_TERMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
