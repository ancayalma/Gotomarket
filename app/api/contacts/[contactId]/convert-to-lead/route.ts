
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
                assigned_account: true
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
                firstName: contact.first_name,
                lastName: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                company: contact.assigned_account?.name || "Unassigned Company", // Use account name or fallback
                jobTitle: contact.job_title,
                status: "NEW", // Default status
                lead_source: "Contact Conversion",
                assigned_to: userId,
                description: `Converted from Contact: ${contact.first_name} ${contact.last_name}`,
                // Map other fields as necessary
            },
        });

        return NextResponse.json(lead);
    } catch (error) {
        console.log("[CONTACT_CONVERT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
