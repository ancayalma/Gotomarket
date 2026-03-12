import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/v1/accounts/:accountId
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { accountId } = await params;
        const account = await prismadb.crm_Accounts.findFirst({
            where: { id: accountId, team_id: auth!.tenantId },
            include: {
                contacts: { select: { id: true, first_name: true, last_name: true, email: true } },
                leads: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        if (!account) return apiError("NOT_FOUND", "Account not found", 404);
        return apiSuccess(account);
    } catch (err) {
        console.error("[V1_ACCOUNT_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch account", 500);
    }
}

/**
 * PUT /api/v1/accounts/:accountId
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { accountId } = await params;
        const existing = await prismadb.crm_Accounts.findFirst({
            where: { id: accountId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Account not found", 404);

        const body = await req.json();

        const updated = await prismadb.crm_Accounts.update({
            where: { id: accountId },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.email !== undefined && { email: body.email }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.type !== undefined && { type: body.type }),
                ...(body.website !== undefined && { website: body.website }),
                ...(body.annual_revenue !== undefined && { annual_revenue: body.annual_revenue }),
                ...(body.employees !== undefined && { employees: body.employees }),
                ...(body.office_phone !== undefined && { office_phone: body.office_phone }),
                ...(body.billing_street !== undefined && { billing_street: body.billing_street }),
                ...(body.billing_city !== undefined && { billing_city: body.billing_city }),
                ...(body.billing_state !== undefined && { billing_state: body.billing_state }),
                ...(body.billing_country !== undefined && { billing_country: body.billing_country }),
                ...(body.billing_postal_code !== undefined && { billing_postal_code: body.billing_postal_code }),
            },
        });

        return apiSuccess(updated);
    } catch (err) {
        console.error("[V1_ACCOUNT_PUT]", err);
        return apiError("INTERNAL_ERROR", "Failed to update account", 500);
    }
}

/**
 * DELETE /api/v1/accounts/:accountId
 * Soft-delete by setting status to Inactive.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ accountId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { accountId } = await params;
        const existing = await prismadb.crm_Accounts.findFirst({
            where: { id: accountId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Account not found", 404);

        await prismadb.crm_Accounts.update({
            where: { id: accountId },
            data: { status: "Inactive" },
        });

        return apiSuccess({ id: accountId, deleted: true });
    } catch (err) {
        console.error("[V1_ACCOUNT_DELETE]", err);
        return apiError("INTERNAL_ERROR", "Failed to delete account", 500);
    }
}
