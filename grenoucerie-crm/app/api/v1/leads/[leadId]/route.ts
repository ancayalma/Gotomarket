import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/v1/leads/:leadId
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { leadId } = await params;
        const lead = await prismadb.crm_Leads.findFirst({
            where: { id: leadId, team_id: auth!.tenantId },
        });

        if (!lead) return apiError("NOT_FOUND", "Lead not found", 404);
        return apiSuccess(lead);
    } catch (err) {
        console.error("[V1_LEAD_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch lead", 500);
    }
}

/**
 * PUT /api/v1/leads/:leadId
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { leadId } = await params;
        const existing = await prismadb.crm_Leads.findFirst({
            where: { id: leadId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Lead not found", 404);

        const body = await req.json();

        const updated = await prismadb.crm_Leads.update({
            where: { id: leadId },
            data: {
                ...(body.firstName !== undefined && { firstName: body.firstName }),
                ...(body.lastName !== undefined && { lastName: body.lastName }),
                ...(body.company !== undefined && { company: body.company }),
                ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
                ...(body.email !== undefined && { email: body.email }),
                ...(body.phone !== undefined && { phone: body.phone }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.lead_source !== undefined && { lead_source: body.lead_source }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.type !== undefined && { type: body.type }),
                ...(body.social_twitter !== undefined && { social_twitter: body.social_twitter }),
                ...(body.social_facebook !== undefined && { social_facebook: body.social_facebook }),
                ...(body.social_linkedin !== undefined && { social_linkedin: body.social_linkedin }),
            },
        });

        return apiSuccess(updated);
    } catch (err) {
        console.error("[V1_LEAD_PUT]", err);
        return apiError("INTERNAL_ERROR", "Failed to update lead", 500);
    }
}

/**
 * DELETE /api/v1/leads/:leadId
 * Soft-delete by setting status to LOST.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { leadId } = await params;
        const existing = await prismadb.crm_Leads.findFirst({
            where: { id: leadId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Lead not found", 404);

        await prismadb.crm_Leads.update({
            where: { id: leadId },
            data: { status: "ARCHIVED" },
        });

        return apiSuccess({ id: leadId, deleted: true });
    } catch (err) {
        console.error("[V1_LEAD_DELETE]", err);
        return apiError("INTERNAL_ERROR", "Failed to delete lead", 500);
    }
}
