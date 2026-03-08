"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const markNotificationRead = async (id: string, type: 'message' | 'form' | 'email') => {
    try {
        const session = await getServerSession(authOptions as any);
        const userId = (session as any)?.user?.id;
        if (!userId) {
            throw new Error("Unauthorized");
        }

        if (type === 'message') {
            // Find the recipient record for this message and this user
            // Note: The ID passed is the message.id based on normalized data in get-user-messages.ts
            // But we need to update the Recipient record.

            const recipient = await prismadb.internalMessageRecipient.findFirst({
                where: {
                    message_id: id,
                    recipient_id: userId
                }
            });

            if (recipient) {
                await prismadb.internalMessageRecipient.update({
                    where: { id: recipient.id },
                    data: { is_read: true }
                });
            } else {
                // If not found in internal recipients, check if it's an SMS mapped as a message
                const smsActivity = await prismadb.crm_Lead_Activities.findFirst({
                    where: { id: id, user: userId }
                });
                if (smsActivity) {
                    await prismadb.crm_Lead_Activities.update({
                        where: { id: smsActivity.id },
                        data: {
                            // Example flag since activity doesn't have a direct is_read field globally, we can append it to metadata
                            notes: (smsActivity.notes || "") + " [Read]"
                        } as any
                    });
                }
            }
        } else if (type === 'form') {
            await (prismadb as any).formSubmission.update({
                where: { id },
                data: { status: "VIEWED" }
            });
        } else if (type === 'email') {
            const email = await prismadb.crm_Emails.findUnique({
                where: { message_id: id }
            });

            if (email && email.user_id === userId) {
                await prismadb.crm_Emails.update({
                    where: { id: email.id },
                    data: { is_read: true }
                });
            }
        }

        revalidatePath("/crm/dashboard");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Failed to mark as read" };
    }
};
