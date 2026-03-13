import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";

/**
 * GET /api/v1/accounts
 * List accounts for the authenticated tenant.
 * Query params: page, pageSize, name, status, search
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);

        const name = url.searchParams.get("name");
        const status = url.searchParams.get("status");
        const search = url.searchParams.get("search");

        const where: any = { team_id: auth!.tenantId };

        if (name) where.name = { contains: name, mode: "insensitive" };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { website: { contains: search, mode: "insensitive" } },
            ];
        }

        const [accounts, total] = await Promise.all([
            prismadb.crm_Accounts.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    team_id: true,
                    name: true,
                    email: true,
                    description: true,
                    status: true,
                    type: true,
                    website: true,
                    annual_revenue: true,
                    employees: true,
                    office_phone: true,
                    billing_street: true,
                    billing_city: true,
                    billing_state: true,
                    billing_country: true,
                    billing_postal_code: true,
                    shipping_street: true,
                    shipping_city: true,
                    shipping_state: true,
                    shipping_country: true,
                    shipping_postal_code: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prismadb.crm_Accounts.count({ where }),
        ]);

        return apiPaginatedSuccess(accounts, total, page, pageSize);
    } catch (err) {
        console.error("[V1_ACCOUNTS_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch accounts", 500);
    }
}

/**
 * POST /api/v1/accounts
 * Create a new account.
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { name, email, description, status, type, website, annual_revenue, employees, office_phone, billing_street, billing_city, billing_state, billing_country, billing_postal_code, shipping_street, shipping_city, shipping_state, shipping_country, shipping_postal_code } = body;

        if (!name) {
            return apiError("VALIDATION_ERROR", "name is required", 400);
        }

        // Deduplicate by name + tenant
        const existing = await prismadb.crm_Accounts.findFirst({
            where: { team_id: auth!.tenantId, name: { equals: name, mode: "insensitive" } },
        });

        if (existing) {
            const updated = await prismadb.crm_Accounts.update({
                where: { id: existing.id },
                data: {
                    email: email || existing.email,
                    description: description || existing.description,
                    website: website || existing.website,
                    annual_revenue: annual_revenue || existing.annual_revenue,
                    employees: employees || existing.employees,
                    office_phone: office_phone || existing.office_phone,
                },
            });
            return apiSuccess({
                id: updated.id,
                team_id: updated.team_id,
                name: updated.name,
                email: updated.email,
                type: updated.type,
                status: updated.status,
                website: updated.website,
                updatedAt: updated.updatedAt,
                _upserted: true,
            }, undefined, 200);
        }

        const newAccount = await prismadb.crm_Accounts.create({
            data: {
                v: 0,
                team_id: auth!.tenantId,
                name,
                email,
                description,
                status: status || "Active",
                type: type || "Customer",
                website,
                annual_revenue,
                employees,
                office_phone,
                billing_street,
                billing_city,
                billing_state,
                billing_country,
                billing_postal_code,
                shipping_street,
                shipping_city,
                shipping_state,
                shipping_country,
                shipping_postal_code,
            },
        });

        return apiSuccess({
            id: newAccount.id,
            team_id: newAccount.team_id,
            name: newAccount.name,
            email: newAccount.email,
            type: newAccount.type,
            status: newAccount.status,
            website: newAccount.website,
            createdAt: newAccount.createdAt,
        }, undefined, 201);
    } catch (err) {
        console.error("[V1_ACCOUNTS_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to create account", 500);
    }
}
