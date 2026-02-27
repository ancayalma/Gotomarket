"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveQuoteAsDocument(data: {
    quoteId: string;
    documentUrl: string;
    documentName: string;
    leadId?: string;
    accountId?: string;
    contactId?: string;
    teamId: string;
}) {

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const doc = await (prismadb.documents as any).create({
            data: {
                document_name: data.documentName,
                document_file_mimeType: "application/pdf",
                document_file_url: data.documentUrl,
                team_id: data.teamId,
                status: "ACTIVE",
                assigned_user: session.user.id,
                leadsIDs: data.leadId ? [data.leadId] : [],
                accountsIDs: data.accountId ? [data.accountId] : [],
                contactsIDs: data.contactId ? [data.contactId] : [],
                visibility: "PUBLIC",
                document_system_type: "OFFER",
                notes: `Generated from Quote ID: ${data.quoteId}`
            }
        });

        // Revalidate paths
        if (data.leadId) revalidatePath("/crm/leads/" + data.leadId);
        if (data.accountId) revalidatePath("/crm/accounts/" + data.accountId);
        if (data.contactId) revalidatePath("/crm/contacts/" + data.contactId);


        // Add activity record
        if (data.leadId) {
            await prismadb.crm_Lead_Activities.create({
                data: {
                    lead: data.leadId,
                    user: session.user.id,
                    type: "note",
                    metadata: {
                        text: `Saved Quote PDF to Documents: ${data.documentName}`,
                        documentId: doc.id,
                        action: "DOCUMENT_UPLOADED"
                    }
                }
            });
        }

        revalidatePath("/crm/leads/" + data.leadId);
        return { success: true, documentId: doc.id };
    } catch (error: any) {
        console.error("[SAVE_QUOTE_AS_DOCUMENT]", error);
        return { success: false, error: error.message };
    }
}
