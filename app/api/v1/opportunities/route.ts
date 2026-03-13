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

        // Resolve sales_stage: accept ObjectId or stage name
        let salesStageId: string | undefined = undefined;
        if (body.sales_stage || body.stage) {
            const stageInput = body.sales_stage || body.stage;
            if (/^[0-9a-fA-F]{24}$/.test(stageInput)) {
                salesStageId = stageInput;
            } else {
                // Global lookup table — no team_id filter
                const stage = await prismadb.crm_Opportunities_Sales_Stages.findFirst({
                    where: { name: { equals: stageInput, mode: "insensitive" } },
                });
                salesStageId = stage?.id || undefined;
            }
        }

        // Resolve type: accept ObjectId or type name
        let typeId: string | undefined = undefined;
        if (body.type) {
            if (/^[0-9a-fA-F]{24}$/.test(body.type)) {
                typeId = body.type;
            } else {
                // Global lookup table — no team_id filter
                const oppType = await prismadb.crm_Opportunities_Type.findFirst({
                    where: { name: { equals: body.type, mode: "insensitive" } },
                });
                typeId = oppType?.id || undefined;
            }
        }

        // Resolve account — validate it belongs to this tenant
        let accountId: string | undefined = undefined;
        const rawAccountId = body.accountId || body.account_id || body.account;
        if (rawAccountId) {
            const acc = await prismadb.crm_Accounts.findFirst({
                where: { id: rawAccountId, team_id: auth!.tenantId },
                select: { id: true },
            });
            accountId = acc?.id || undefined;
        }

        // Resolve contact — validate it belongs to this tenant
        let contactId: string | undefined = undefined;
        const rawContactId = body.contactId || body.contact_id;
        if (rawContactId) {
            const con = await prismadb.crm_Contacts.findFirst({
                where: { id: rawContactId, team_id: auth!.tenantId },
                select: { id: true },
            });
            contactId = con?.id || undefined;
        }

        // Resolve lead — validate it belongs to this tenant
        let leadId: string | undefined = undefined;
        const rawLeadId = body.leadId || body.lead_id;
        if (rawLeadId) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { id: rawLeadId, team_id: auth!.tenantId },
                select: { id: true },
            });
            leadId = lead?.id || undefined;
        }

        const opp = await prismadb.crm_Opportunities.create({
            data: {
                v: 0,
                team_id: auth!.tenantId,
                name: body.name,
                description: body.description || undefined,
                budget: body.budget != null ? Math.round(Number(body.budget)) || 0 : 0,
                expected_revenue: body.expected_revenue != null ? Math.round(Number(body.expected_revenue)) || 0 : 0,
                currency: body.currency || "USD",
                close_date: body.close_date ? new Date(body.close_date) : undefined,
                sales_stage: salesStageId,
                type: typeId,
                assigned_to: body.assigned_to || undefined,
                account: accountId,
                contact: contactId,
                connected_contacts: contactId ? [contactId] : [],
                lead_id: leadId,
                lead_source: body.lead_source || undefined,
                next_step: body.next_step || undefined,
            },
        });

        return apiSuccess(opp, undefined, 201);
    } catch (err: any) {
        console.error("[V1_OPPORTUNITIES_POST]", err?.message || err);
        return apiError("INTERNAL_ERROR", `Failed to create opportunity: ${err?.message || "Unknown error"}`, 500);
    }
}
