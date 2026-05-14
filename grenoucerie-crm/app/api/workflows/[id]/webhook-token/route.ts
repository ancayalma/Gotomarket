import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { v4 as uuid } from "uuid";

/**
 * POST /api/workflows/[id]/webhook-token
 * Generate or regenerate a webhook token for a workflow.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const token = uuid();

        const workflow = await prismadb.crm_Workflow.update({
            where: { id },
            data: { webhook_token: token },
        });

        return NextResponse.json({
            webhook_token: token,
            webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/webhook/${token}`,
        });
    } catch (error) {
        console.error("[WEBHOOK_TOKEN_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * DELETE /api/workflows/[id]/webhook-token
 * Revoke/remove the webhook token.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        await prismadb.crm_Workflow.update({
            where: { id },
            data: { webhook_token: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[WEBHOOK_TOKEN_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
