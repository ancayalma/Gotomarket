import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logActivityInternal } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { name, accounts = [], contacts = [], existingPoolId } = body;

        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId || null;

        if (!existingPoolId && !name) return new NextResponse("Missing list name", { status: 400 });
        if (accounts.length === 0 && contacts.length === 0) {
            return new NextResponse("List must contain at least one account or contact", { status: 400 });
        }

        // Use existing pool or create a new one
        let pool: any;
        if (existingPoolId) {
            pool = await (prismadb.crm_Lead_Pools as any).findUnique({ where: { id: existingPoolId } });
            if (!pool) return new NextResponse("Pool not found", { status: 404 });
        } else {
            pool = await (prismadb.crm_Lead_Pools as any).create({
                data: {
                    name,
                    user: session.user.id,
                    team_id: teamId,
                    status: "ACTIVE",
                    description: "Manually created list from Accounts & Contacts",
                }
            });
        }

        const createdLeads: string[] = [];
        let candidatesCount = 0;
        let contactsCount = 0;

        // 2. Process Contacts -> Conver to Leads
        if (contacts.length > 0) {
            const dbContacts = await prismadb.crm_Contacts.findMany({
                where: { id: { in: contacts } },
                include: { assigned_accounts: true }
            });

            for (const contact of dbContacts) {
                // Determine names
                const firstName = contact.first_name || "";
                const lastName = contact.last_name || contact.assigned_accounts?.name || "Contact";
                const company = contact.assigned_accounts?.name || undefined;
                
                const newLead = await (prismadb.crm_Leads as any).create({
                    data: {
                        firstName,
                        lastName,
                        company,
                        email: contact.email || undefined,
                        phone: contact.mobile_phone || contact.office_phone || undefined,
                        jobTitle: contact.position || undefined,
                        accountsIDs: contact.accountsIDs,
                        status: "NEW",
                        type: "MANUAL",
                        assigned_to: session.user.id,
                        createdBy: session.user.id,
                        team_id: teamId,
                        lead_source: "Manual List",
                    }
                });

                await (prismadb.crm_Lead_Pools_Leads as any).create({
                    data: {
                        pool: pool.id,
                        lead: newLead.id
                    }
                });
                createdLeads.push(newLead.id);
                contactsCount++;
            }
        }

        // 3. Process Accounts -> Convert to Leads
        if (accounts.length > 0) {
            const dbAccounts = await prismadb.crm_Accounts.findMany({
                where: { id: { in: accounts } }
            });

            for (const account of dbAccounts) {
                const newLead = await (prismadb.crm_Leads as any).create({
                    data: {
                        firstName: "",
                        lastName: account.name || "Company",
                        company: account.name,
                        email: account.email || undefined,
                        phone: account.office_phone || undefined,
                        accountsIDs: account.id,
                        status: "NEW",
                        type: "MANUAL",
                        assigned_to: session.user.id,
                        createdBy: session.user.id,
                        team_id: teamId,
                        lead_source: "Manual List",
                    }
                });

                await (prismadb.crm_Lead_Pools_Leads as any).create({
                    data: {
                        pool: pool.id,
                        lead: newLead.id
                    }
                });
                createdLeads.push(newLead.id);
                candidatesCount++;
            }
        }

        await logActivityInternal(session.user.id, "CREATE", "crm_Lead_Pools", `Manually created list ${pool.id} with ${accounts.length} accounts and ${contacts.length} contacts.`, teamId || "");

        return NextResponse.json({ ...pool, candidatesCount, contactsCount }, { status: 200 });

    } catch (error) {
        console.error("[POST_MANUAL_LIST_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
