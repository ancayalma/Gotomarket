import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";

/**
 * GET /api/v1/opportunities
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);
        const search = url.searchParams.get("search");
        const salesStage = url.searchParams.get("sales_stage");

        const where: any = { team_id: auth!.tenantId };
        if (salesStage) where.sales_stage = salesStage;
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [opportunities, total] = await Promise.all([
            prismadb.crm_Opportunities.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prismadb.crm_Opportunities.count({ where }),
        ]);

        return apiPaginatedSuccess(opportunities, total, page, pageSize);
    } catch (err) {
        console.error("[V1_OPPORTUNITIES_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch opportunities", 500);
    }
}

/**
 * POST /api/v1/opportunities
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        if (!body.name) return apiError("VALIDATION_ERROR", "name is required", 400);

        const opp = await prismadb.crm_Opportunities.create({
            data: {
                v: 0,
                team_id: auth!.tenantId,
                name: body.name,
                description: body.description,
                budget: body.budget,
                currency: body.currency || "USD",
                close_date: body.close_date ? new Date(body.close_date) : undefined,
                sales_stage: body.sales_stage || body.stage,
                type: body.type,
                assigned_to: body.assigned_to,
                accountsIDs: body.accountId,
            },
        });

        return apiSuccess(opp, undefined, 201);
    } catch (err) {
        console.error("[V1_OPPORTUNITIES_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to create opportunity", 500);
    }
}
