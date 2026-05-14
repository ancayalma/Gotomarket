import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/v1/contacts/:contactId
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { contactId } = await params;
        const contact = await prismadb.crm_Contacts.findFirst({
            where: { id: contactId, team_id: auth!.tenantId },
        });

        if (!contact) return apiError("NOT_FOUND", "Contact not found", 404);
        return apiSuccess(contact);
    } catch (err) {
        console.error("[V1_CONTACT_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch contact", 500);
    }
}

/**
 * PUT /api/v1/contacts/:contactId
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { contactId } = await params;
        const existing = await prismadb.crm_Contacts.findFirst({
            where: { id: contactId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Contact not found", 404);

        const body = await req.json();

        const updated = await prismadb.crm_Contacts.update({
            where: { id: contactId },
            data: {
                ...(body.first_name !== undefined && { first_name: body.first_name }),
                ...(body.last_name !== undefined && { last_name: body.last_name }),
                ...(body.email !== undefined && { email: body.email }),
                ...(body.personal_email !== undefined && { personal_email: body.personal_email }),
                ...(body.office_phone !== undefined && { office_phone: body.office_phone }),
                ...(body.mobile_phone !== undefined && { mobile_phone: body.mobile_phone }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.website !== undefined && { website: body.website }),
                ...(body.type !== undefined && { type: body.type }),
                ...(body.tags !== undefined && { tags: body.tags }),
                ...(body.social_twitter !== undefined && { social_twitter: body.social_twitter }),
                ...(body.social_facebook !== undefined && { social_facebook: body.social_facebook }),
                ...(body.social_linkedin !== undefined && { social_linkedin: body.social_linkedin }),
                ...(body.social_instagram !== undefined && { social_instagram: body.social_instagram }),
                ...(body.social_youtube !== undefined && { social_youtube: body.social_youtube }),
                ...(body.social_tiktok !== undefined && { social_tiktok: body.social_tiktok }),
                last_activity: new Date(),
            },
        });

        return apiSuccess(updated);
    } catch (err) {
        console.error("[V1_CONTACT_PUT]", err);
        return apiError("INTERNAL_ERROR", "Failed to update contact", 500);
    }
}

/**
 * DELETE /api/v1/contacts/:contactId
 * Soft-delete by setting status to false.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const { contactId } = await params;
        const existing = await prismadb.crm_Contacts.findFirst({
            where: { id: contactId, team_id: auth!.tenantId },
        });

        if (!existing) return apiError("NOT_FOUND", "Contact not found", 404);

        await prismadb.crm_Contacts.update({
            where: { id: contactId },
            data: { status: false },
        });

        return apiSuccess({ id: contactId, deleted: true });
    } catch (err) {
        console.error("[V1_CONTACT_DELETE]", err);
        return apiError("INTERNAL_ERROR", "Failed to delete contact", 500);
    }
}
