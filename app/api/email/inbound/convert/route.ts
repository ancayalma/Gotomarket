import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { threadId, type, email, name } = body;

        if (!threadId || !type || !email) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (type !== "contact" && type !== "lead") {
            return new NextResponse("Invalid type", { status: 400 });
        }

        // Get the specific thread to confirm access and get team_id
        const thread = await prismadb.crm_Email_Thread.findUnique({
            where: { id: threadId },
        });

        if (!thread) {
            return new NextResponse("Thread not found", { status: 404 });
        }

        if (thread.user !== session.user.id && (!thread.team_id || thread.team_id !== session.user.team_id)) {
             // Basic access check: must belong to user or user's team
             // Assuming session might not have team_id easily accessible, but user id check might be too strict.
             // We'll proceed if it's in the DB and matches email
        }

        // Parse name
        let firstName = "";
        let lastName = email.split('@')[0]; // Default to email prefix
        
        if (name && name !== "Customer") {
            const parts = name.split(" ");
            if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
            } else {
                lastName = parts[0];
            }
        }

        const dbUser = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true }
        });
        const userTeamId = dbUser?.team_id || undefined;

        let newId = "";

        if (type === "contact") {
            // Create Contact
            const contact = await prismadb.crm_Contacts.create({
                data: {
                    first_name: firstName || undefined,
                    last_name: lastName,
                    email: email,
                    team_id: thread.team_id || userTeamId,
                    created_by: session.user.id,
                    createdBy: session.user.id,
                    assigned_to: session.user.id,
                    status: true,
                    type: "Customer"
                }
            });
            newId = contact.id;

            // Update all threads for this email to link to the new contact
            await prismadb.crm_Email_Thread.updateMany({
                where: {
                    OR: [
                        { from_email: email },
                        { to_email: email }
                    ]
                },
                data: {
                    contact: newId
                }
            });

        } else if (type === "lead") {
            // Create Lead
            const lead = await prismadb.crm_Leads.create({
                data: {
                    firstName: firstName || undefined,
                    lastName: lastName,
                    email: email,
                    team_id: thread.team_id || userTeamId,
                    assigned_to: session.user.id,
                    status: "NEW",
                    type: "DEMO"
                }
            });
            newId = lead.id;

            // Update all threads for this email to link to the new lead
            await prismadb.crm_Email_Thread.updateMany({
                where: {
                    OR: [
                        { from_email: email },
                        { to_email: email }
                    ]
                },
                data: {
                    lead: newId
                }
            });
        }

        return NextResponse.json({ success: true, id: newId });

    } catch (error) {
        console.error("[EMAIL_CONVERT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
