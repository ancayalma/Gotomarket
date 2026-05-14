import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ opportunityId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { opportunityId } = await params;
        const opp = await prismadb.crm_Opportunities.findFirst({
            where: { id: opportunityId, team_id: auth!.tenantId },
        });
        if (!opp) return apiError("NOT_FOUND", "Opportunity not found", 404);
        return apiSuccess(opp);
    } catch (err) {
        console.error("[V1_OPPORTUNITY_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch opportunity", 500);
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ opportunityId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { opportunityId } = await params;
        const existing = await prismadb.crm_Opportunities.findFirst({
            where: { id: opportunityId, team_id: auth!.tenantId },
        });
        if (!existing) return apiError("NOT_FOUND", "Opportunity not found", 404);

        const body = await req.json();
        const updated = await prismadb.crm_Opportunities.update({
            where: { id: opportunityId },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.budget !== undefined && { budget: body.budget }),
                ...(body.sales_stage !== undefined && { sales_stage: body.sales_stage }),
                ...(body.type !== undefined && { type: body.type }),
                ...(body.close_date !== undefined && { close_date: new Date(body.close_date) }),
            },
        });

        return apiSuccess(updated);
    } catch (err) {
        console.error("[V1_OPPORTUNITY_PUT]", err);
        return apiError("INTERNAL_ERROR", "Failed to update opportunity", 500);
    }
}
