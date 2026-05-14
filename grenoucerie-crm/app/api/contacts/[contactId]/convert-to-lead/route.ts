
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { systemLogger } from "@/lib/logger";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const { contactId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const userId = session.user.id;

        if (!contactId) {
            return new NextResponse("Contact ID is required", { status: 400 });
        }

        // 1. Fetch the Contact
        const contact = await (prismadb as any).crm_Contacts.findUnique({
            where: {
                id: contactId,
            },
            include: {
                assigned_accounts: true
            }
        });

        if (!contact) {
            return new NextResponse("Contact not found", { status: 404 });
        }

        // 2. Check if Lead already exists (optional, but good practice to avoid dupes)
        // For now, allow duplicates or assume user knows what they are doing.

        // 3. Create Lead
        const lead = await (prismadb as any).crm_Leads.create({
            data: {
                v: 1, // MongoDB Versioning
                firstName: contact.first_name,
                lastName: contact.last_name,
                email: contact.email,
                phone: contact.mobile_phone || contact.office_phone,
                company: contact.assigned_accounts?.name || "Unassigned Company",
                jobTitle: contact.position,
                status: "NEW",
                lead_source: "Contact Conversion",
                assigned_to_user: { connect: { id: contact.assigned_to || userId } },
                assigned_accounts: contact.accountsIDs ? { connect: { id: contact.accountsIDs } } : undefined,
                assigned_team: contact.team_id ? { connect: { id: contact.team_id } } : undefined,
                assigned_project: contact.assigned_department_id ? { connect: { id: contact.assigned_department_id } } : undefined,
                description: `Converted from Contact: ${contact.first_name || ""} ${contact.last_name || ""}`,
            },
        });

        return NextResponse.json(lead);
    } catch (error) {
        systemLogger.error("[CONTACT_CONVERT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
