import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";

/**
 * GET /api/v1/tasks
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);
        const status = url.searchParams.get("status");

        const where: any = { team_id: auth!.tenantId };
        if (status) where.status = status;

        const [tasks, total] = await Promise.all([
            prismadb.tasks.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prismadb.tasks.count({ where }),
        ]);

        return apiPaginatedSuccess(tasks, total, page, pageSize);
    } catch (err) {
        console.error("[V1_TASKS_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch tasks", 500);
    }
}

/**
 * POST /api/v1/tasks
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        if (!body.title) return apiError("VALIDATION_ERROR", "title is required", 400);

        const task = await prismadb.tasks.create({
            data: {
                v: 0,
                team_id: auth!.tenantId,
                title: body.title,
                description: body.description,
                status: body.status || "TODO",
                priority: body.priority || "MEDIUM",
                due_date: body.due_date ? new Date(body.due_date) : undefined,
            },
        });

        return apiSuccess(task, undefined, 201);
    } catch (err) {
        console.error("[V1_TASKS_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to create task", 500);
    }
}
