import { NextRequest } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { apiSuccess, apiPaginatedSuccess, apiError, parsePagination } from "@/lib/api-response";

/**
 * GET /api/v1/leads
 * List leads for the authenticated tenant.
 * Query params: page, pageSize, status, email, company, pipeline_stage, search
 */
export async function GET(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const url = new URL(req.url);
        const { page, pageSize, skip } = parsePagination(url);

        const status = url.searchParams.get("status");
        const email = url.searchParams.get("email");
        const company = url.searchParams.get("company");
        const pipelineStage = url.searchParams.get("pipeline_stage");
        const search = url.searchParams.get("search");

        const where: any = { team_id: auth!.tenantId };

        if (status) where.status = status;
        if (email) where.email = { contains: email, mode: "insensitive" };
        if (company) where.company = { contains: company, mode: "insensitive" };
        if (pipelineStage) where.pipeline_stage = pipelineStage;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
            ];
        }

        const [leads, total] = await Promise.all([
            prismadb.crm_Leads.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                    jobTitle: true,
                    email: true,
                    phone: true,
                    status: true,
                    type: true,
                    lead_source: true,
                    pipeline_stage: true,
                    outreach_status: true,
                    social_twitter: true,
                    social_facebook: true,
                    social_linkedin: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prismadb.crm_Leads.count({ where }),
        ]);

        return apiPaginatedSuccess(leads, total, page, pageSize);
    } catch (err) {
        console.error("[V1_LEADS_GET]", err);
        return apiError("INTERNAL_ERROR", "Failed to fetch leads", 500);
    }
}

/**
 * POST /api/v1/leads
 * Create or upsert a lead (deduplicate by email).
 */
export async function POST(req: NextRequest) {
    const { auth, error } = await requireApiKey(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { firstName, lastName, company, jobTitle, email, phone, description, lead_source, status, type, social_twitter, social_facebook, social_linkedin } = body;

        if (!lastName) {
            return apiError("VALIDATION_ERROR", "lastName is required", 400);
        }

        // Upsert by email
        if (email) {
            const existing = await prismadb.crm_Leads.findFirst({
                where: { team_id: auth!.tenantId, email: { equals: email, mode: "insensitive" } },
            });

            if (existing) {
                const updated = await prismadb.crm_Leads.update({
                    where: { id: existing.id },
                    data: {
                        firstName: firstName || existing.firstName,
                        lastName: lastName || existing.lastName,
                        company: company || existing.company,
                        jobTitle: jobTitle || existing.jobTitle,
                        phone: phone || existing.phone,
                        description: description || existing.description,
                        lead_source: lead_source || existing.lead_source,
                        social_twitter: social_twitter || existing.social_twitter,
                        social_facebook: social_facebook || existing.social_facebook,
                        social_linkedin: social_linkedin || existing.social_linkedin,
                    },
                });
                return apiSuccess(updated, undefined, 200);
            }
        }

        const newLead = await prismadb.crm_Leads.create({
            data: {
                v: 1,
                team_id: auth!.tenantId,
                firstName,
                lastName,
                company,
                jobTitle,
                email,
                phone,
                description,
                lead_source: lead_source || "API",
                campaign: "",
                status: status || "NEW",
                type: type || "DEMO",
                social_twitter,
                social_facebook,
                social_linkedin,
            },
        });

        return apiSuccess(newLead, undefined, 201);
    } catch (err) {
        console.error("[V1_LEADS_POST]", err);
        return apiError("INTERNAL_ERROR", "Failed to create lead", 500);
    }
}
