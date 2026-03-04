"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { systemLogger } from "@/lib/logger";

export type ActionResponse = {
    success: boolean;
    data?: any;
    error?: string;
};

export async function convertLeadToOpportunity(leadId: string): Promise<ActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const lead = await prismadb.crm_Leads.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            return { success: false, error: "Lead not found" };
        }

        if (lead.status === "CONVERTED") {
            return { success: false, error: "Lead is already converted" };
        }

        // 0.5 Create/Find Account (if applicable)
        let accountId = lead.accountsIDs || "";

        if (lead.company && !accountId) {
            const existingAccount = await prismadb.crm_Accounts.findFirst({
                where: { name: lead.company },
            });
            if (existingAccount) {
                accountId = existingAccount.id;
            } else {
                const newAccount = await prismadb.crm_Accounts.create({
                    data: {
                        v: 0,
                        name: lead.company,
                        email: lead.email,
                        office_phone: lead.phone,
                        description: lead.description,
                        assigned_to_user: lead.assigned_to ? { connect: { id: lead.assigned_to } } : undefined,
                        assigned_team: lead.team_id ? { connect: { id: lead.team_id } } : undefined,
                    }
                });
                accountId = newAccount.id;
            }

            // Sync account backwards to lead if we generated/found one
            await prismadb.crm_Leads.update({
                where: { id: lead.id },
                data: { accountsIDs: accountId }
            });
        }

        // 1. Create/Find Contact
        let contactId = "";
        if (lead.email) {
            const existingContact = await prismadb.crm_Contacts.findFirst({
                where: { email: lead.email },
            });
            if (existingContact) {
                contactId = existingContact.id;

                // Ensure existing contact is bound to account
                if (accountId && !existingContact.accountsIDs) {
                    await prismadb.crm_Contacts.update({
                        where: { id: contactId },
                        data: { assigned_accounts: { connect: { id: accountId } } }
                    });
                }
            }
        }

        if (!contactId) {
            const newContact = await prismadb.crm_Contacts.create({
                data: {
                    first_name: lead.firstName || "",
                    last_name: lead.lastName,
                    email: lead.email,
                    mobile_phone: lead.phone,
                    // company: lead.company, // Contact does not have company scalar
                    position: lead.jobTitle,
                    description: lead.company ? `Company: ${lead.company}\n${lead.description || ""}` : lead.description,
                    assigned_to_user: lead.assigned_to ? { connect: { id: lead.assigned_to } } : undefined,
                    crate_by_user: { connect: { id: session.user.id } }, // correct relation name from schema
                    type: "Prospect",
                    assigned_accounts: accountId ? { connect: { id: accountId } } : undefined,
                },
            });
            contactId = newContact.id;
        }

        // 2. Create Opportunity
        const opportunityName = lead.company
            ? `${lead.company}`
            : `${lead.firstName} ${lead.lastName}`;

        // Project relation data
        const projectData = lead.project ? {
            assigned_project: {
                connect: { id: lead.project }
            }
        } : {};

        const newOpportunity = await prismadb.crm_Opportunities.create({
            data: {
                name: opportunityName,
                description: `Converted from Lead: ${lead.firstName} ${lead.lastName}\n\n${lead.description || ""}`,
                status: "ACTIVE",
                // pipeline_stage does not exist in crm_Opportunities

                createdBy: session.user.id,
                updatedBy: session.user.id,
                created_by_user: { connect: { id: session.user.id } }, // Relation (sets created_by)
                assigned_to_user: lead.assigned_to ? { connect: { id: lead.assigned_to } } : { connect: { id: session.user.id } },

                // Relations
                ...projectData,

                assigned_account: accountId ? { connect: { id: accountId } } : undefined,

                contacts: {
                    connect: [{ id: contactId }]
                },
                // Removed invalid scalar contact: contactId
                assigned_lead: { connect: { id: lead.id } },
                assigned_team: lead.team_id ? { connect: { id: lead.team_id } } : undefined,

                budget: 0,
                expected_revenue: 0,
                close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            },
        });

        // 3. Update Lead
        await prismadb.crm_Leads.update({
            where: { id: leadId },
            data: {
                status: "CONVERTED",
            },
        });

        revalidatePath("/crm/leads");
        revalidatePath("/crm/opportunities");
        revalidatePath(`/crm/leads/${leadId}`);

        // Quest progress — fire-and-forget
        if (lead.team_id) {
            import("@/actions/quests/increment-progress").then(({ incrementQuestProgress }) => {
                incrementQuestProgress({ userId: session.user.id, teamId: lead.team_id!, questType: "close_leads" }).catch(() => { });
                incrementQuestProgress({ userId: session.user.id, teamId: lead.team_id!, questType: "convert_accounts" }).catch(() => { });
                incrementQuestProgress({ userId: session.user.id, teamId: lead.team_id!, questType: "create_opportunities" }).catch(() => { });
            }).catch(() => { });
        }

        return {
            success: true,
            data: {
                opportunityId: newOpportunity.id,
                contactId
            }
        };

    } catch (error: any) {
        systemLogger.error("[CONVERT_LEAD]", error);
        return { success: false, error: error.message || "Failed to convert lead" };
    }
}
