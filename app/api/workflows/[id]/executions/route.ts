import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/workflows/[id]/executions
 * List execution history for a workflow with step logs.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        const [executions, total] = await Promise.all([
            prismadb.crm_Workflow_Execution.findMany({
                where: { workflow_id: id },
                orderBy: { startedAt: "desc" },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    status: true,
                    trigger_source: true,
                    trigger_data: true,
                    current_node: true,
                    completed_nodes: true,
                    node_outputs: true,
                    step_logs: true,
                    scheduled_at: true,
                    error: true,
                    startedAt: true,
                    completedAt: true,
                },
            }),
            prismadb.crm_Workflow_Execution.count({
                where: { workflow_id: id },
            }),
        ]);

        return NextResponse.json({ executions, total, limit, offset });
    } catch (error) {
        console.error("[EXECUTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
