import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm as prisma } from "@/lib/prisma-crm";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/campaigns/[sequenceId]/repair
 * Repairs a campaign by finding leads in its assigned pool that were dropped (e.g. account-level emails missing contact link)
 * and triggering an outreach send ONLY for the missing leads.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ sequenceId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { sequenceId } = await params;

        // 1. Fetch the campaign
        const campaign = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id: sequenceId },
            include: {
                outreach_items: {
                    select: { lead: true, candidate_email: true, status: true },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
        }

        if (!campaign.pool) {
            return NextResponse.json({ message: "Campaign has no assigned pool to repair from" }, { status: 400 });
        }

        // 2. Fetch all leads from the pool using the internal route (reuse logic)
        // Since we are server-side, we must simulate a fetch using absolute URL or reuse logic.
        // Easiest is to hit our own API.
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const host = req.headers.get("host") || "localhost:3000";
        const poolUrl = `${protocol}://${host}/api/crm/leads/pools/${campaign.pool}/leads?mine=false`;
        
        const cookie = req.headers.get("cookie") || "";

        const poolRes = await fetch(poolUrl, {
            headers: { cookie },
        });

        if (!poolRes.ok) {
            return NextResponse.json({ message: "Failed to fetch pool leads for repair" }, { status: 500 });
        }

        const poolData = await poolRes.json();
        const poolLeads = Array.isArray(poolData?.leads) ? poolData.leads : [];

        // 3. Resolve the best available email for every pool lead
        const validPoolLeads = poolLeads.map((l: any) => {
            if (l.email) return l;
            const fallback = l.accountEmail || (l.accountAdditionalEmails && l.accountAdditionalEmails.length > 0 ? l.accountAdditionalEmails[0] : null);
            if (fallback) return { ...l, email: fallback };
            return l;
        }).filter((l: any) => !!l.email);

        // 4. Identify which leads are missing from the campaign
        const existingLeadIds = new Set(campaign.outreach_items.map((i: any) => i.lead));
        const missingLeads = validPoolLeads.filter((l: any) => !existingLeadIds.has(l.id));

        if (missingLeads.length === 0) {
            return NextResponse.json({ message: "No missing leads found. Campaign is already up to date.", count: 0 }, { status: 200 });
        }

        // 5. Build payload and trigger the send route
        // We need to trigger `/api/outreach/send` with the missing leads.
        const sendPayload = {
            leadIds: missingLeads.map((l: any) => l.id),
            // Need inline lead data so the send route can use the resolved fallback emails
            leadData: missingLeads.map((l: any) => ({
                id: l.id,
                firstName: l.firstName,
                lastName: l.lastName,
                company: l.company,
                jobTitle: l.jobTitle,
                email: l.email,
                additional_emails: l.additional_emails || l.accountAdditionalEmails || [],
            })),
            campaignId: campaign.id,
            poolId: campaign.pool,
            promptOverride: campaign.prompt_override || undefined,
            brandId: campaign.campaign_branding?.id || undefined,
            templateId: "minimal", // Default to minimal since template isn't stored in DB
            senderMode: "company",
            signatureSource: "brand",
        };

        const sendUrl = `${protocol}://${host}/api/outreach/send`;
        const sendRes = await fetch(sendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie,
            },
            body: JSON.stringify(sendPayload),
        });

        if (!sendRes.ok) {
            const err = await sendRes.text();
            systemLogger.error("[CAMPAIGN_REPAIR] Send failed:", err);
            return NextResponse.json({ message: "Failed to dispatch repair emails" }, { status: 500 });
        }

        return NextResponse.json({
            message: `Successfully repaired campaign. Dispatching ${missingLeads.length} missed leads.`,
            count: missingLeads.length,
        }, { status: 200 });

    } catch (error: any) {
        systemLogger.error("[CAMPAIGN_REPAIR]", error);
        return NextResponse.json(
            { message: error.message || "Failed to repair campaign" },
            { status: 500 }
        );
    }
}
