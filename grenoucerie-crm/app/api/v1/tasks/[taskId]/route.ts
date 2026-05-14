import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { taskId } = await params;
        const task = await prismadb.tasks.findFirst({
            where: { id: taskId, team_id: auth!.tenantId },
        });
        if (!task) return apiError("NOT_FOUND", "Task not found", 404);
        return apiSuccess(task);
    } catch (err) {
        console.error("[V1_TASK_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch task", 500);
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { taskId } = await params;
        const existing = await prismadb.tasks.findFirst({
            where: { id: taskId, team_id: auth!.tenantId },
        });
        if (!existing) return apiError("NOT_FOUND", "Task not found", 404);

        const body = await req.json();
        const updated = await prismadb.tasks.update({
            where: { id: taskId },
            data: {
                ...(body.title !== undefined && { title: body.title }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.priority !== undefined && { priority: body.priority }),
                ...(body.due_date !== undefined && { due_date: new Date(body.due_date) }),
            },
        });

        return apiSuccess(updated);
    } catch (err) {
        console.error("[V1_TASK_PUT]", err);
        return apiError("INTERNAL_ERROR", "Failed to update task", 500);
    }
}
