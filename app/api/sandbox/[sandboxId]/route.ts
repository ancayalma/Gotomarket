import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    diffSandbox,
    promoteSandbox,
    discardSandbox,
} from "@/lib/sandbox/sandbox-service";

/**
 * GET /api/sandbox/[sandboxId] — Get sandbox details with diff
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sandboxId } = await params;
        const result = await diffSandbox(sandboxId);

        if (!result) {
            return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[SANDBOX_DETAIL]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * POST /api/sandbox/[sandboxId] — Perform an action (promote)
 * Body: { action: "promote" }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sandboxId } = await params;
        const { action } = await req.json();

        if (action === "promote") {
            const result = await promoteSandbox(sandboxId, session.user.id);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[SANDBOX_ACTION]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * DELETE /api/sandbox/[sandboxId] — Discard sandbox
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sandboxId } = await params;
        const result = await discardSandbox(sandboxId, session.user.id);

        return NextResponse.json(result);
    } catch (error) {
        console.error("[SANDBOX_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
