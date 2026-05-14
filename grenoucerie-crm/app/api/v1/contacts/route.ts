import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";

/**
 * GET /api/v1/contacts
 * List contacts for the authenticated tenant.
 * Query params: page, pageSize, email, status, type, search
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);

        // Filters
        const email = url.searchParams.get("email");
        const status = url.searchParams.get("status");
        const type = url.searchParams.get("type");
        const search = url.searchParams.get("search");

        const where: any = { team_id: auth!.tenantId };

        if (email) where.email = { contains: email, mode: "insensitive" };
        if (status) where.status = status === "true";
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [contacts, total] = await Promise.all([
            prismadb.crm_Contacts.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { cratedAt: "desc" },
                select: {
                    id: true,
                    team_id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    personal_email: true,
                    office_phone: true,
                    mobile_phone: true,
                    status: true,
                    type: true,
                    description: true,
                    website: true,
                    tags: true,
                    accountsIDs: true,
                    opportunitiesIDs: true,
                    social_twitter: true,
                    social_facebook: true,
                    social_linkedin: true,
                    social_instagram: true,
                    cratedAt: true,
                    updatedAt: true,
                },
            }),
            prismadb.crm_Contacts.count({ where }),
        ]);

        return apiPaginatedSuccess(contacts, total, page, pageSize);
    } catch (err) {
        console.error("[V1_CONTACTS_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch contacts", 500);
    }
}

/**
 * POST /api/v1/contacts
 * Create or upsert a contact (deduplicate by email).
 * Body: { first_name, last_name, email, phone, mobile_phone, type, tags, description, ... }
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { first_name, last_name, email, personal_email, office_phone, mobile_phone, description, website, type, tags, social_twitter, social_facebook, social_linkedin, social_instagram, social_youtube, social_tiktok } = body;

        if (!last_name) {
            return apiError("VALIDATION_ERROR", "last_name is required", 400);
        }

        // Upsert: deduplicate by email within this tenant
        if (email) {
            const existing = await prismadb.crm_Contacts.findFirst({
                where: { team_id: auth!.tenantId, email: { equals: email, mode: "insensitive" } },
            });

            if (existing) {
                const updated = await prismadb.crm_Contacts.update({
                    where: { id: existing.id },
                    data: {
                        first_name: first_name || existing.first_name,
                        last_name: last_name || existing.last_name,
                        personal_email: personal_email || existing.personal_email,
                        office_phone: office_phone || existing.office_phone,
                        mobile_phone: mobile_phone || existing.mobile_phone,
                        description: description || existing.description,
                        website: website || existing.website,
                        type: type || existing.type,
                        social_twitter: social_twitter || existing.social_twitter,
                        social_facebook: social_facebook || existing.social_facebook,
                        social_linkedin: social_linkedin || existing.social_linkedin,
                        social_instagram: social_instagram || existing.social_instagram,
                        social_youtube: social_youtube || existing.social_youtube,
                        social_tiktok: social_tiktok || existing.social_tiktok,
                        last_activity: new Date(),
                    },
                });
                return apiSuccess({
                    id: updated.id,
                    team_id: updated.team_id,
                    accountId: updated.accountsIDs || null,
                    first_name: updated.first_name,
                    last_name: updated.last_name,
                    email: updated.email,
                    mobile_phone: updated.mobile_phone,
                    type: updated.type,
                    status: updated.status,
                    updatedAt: updated.updatedAt,
                    _upserted: true,
                }, undefined, 200);
            }
        }

        // Create new contact
        const newContact = await prismadb.crm_Contacts.create({
            data: {
                v: 0,
                team_id: auth!.tenantId,
                first_name,
                last_name,
                email,
                personal_email,
                office_phone,
                mobile_phone,
                description,
                website,
                type: type || "Customer",
                tags: tags || [],
                social_twitter,
                social_facebook,
                social_linkedin,
                social_instagram,
                social_youtube,
                social_tiktok,
            },
        });

        return apiSuccess({
            id: newContact.id,
            team_id: newContact.team_id,
            accountId: newContact.accountsIDs || null,
            first_name: newContact.first_name,
            last_name: newContact.last_name,
            email: newContact.email,
            mobile_phone: newContact.mobile_phone,
            type: newContact.type,
            status: newContact.status,
            cratedAt: newContact.cratedAt,
        }, undefined, 201);
    } catch (err) {
        console.error("[V1_CONTACTS_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to create contact", 500);
    }
}
