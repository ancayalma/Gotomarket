import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ keyId: string }> }
) {
    try {
        const { keyId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.isAdmin || !teamInfo.teamId) {
            return new NextResponse("Forbidden - Must be an admin", { status: 403 });
        }

        if (!keyId) {
            return new NextResponse("Missing key ID", { status: 400 });
        }

        // Verify the key belongs to the current tenant
        const existingKey = await prismadb.crm_ApiKeys.findFirst({
            where: {
                id: keyId,
                tenant_id: teamInfo.teamId
            }
        });

        if (!existingKey) {
            return new NextResponse("Key not found or access denied.", { status: 404 });
        }

        const updatedKey = await prismadb.crm_ApiKeys.update({
            where: { id: keyId },
            data: {
                status: "REVOKED"
            }
        });

        return NextResponse.json(updatedKey);

    } catch (error) {
        console.error("[API_KEY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
