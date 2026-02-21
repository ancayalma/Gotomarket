"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dismissAIInsight = async (insightId: string) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return { error: "Not authenticated" };

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email }
        });

        if (!user) return { error: "User not found" };

        await prismadb.users.update({
            where: { id: user.id },
            data: {
                dismissedAIInsights: {
                    push: insightId
                }
            }
        });

        revalidatePath("/crm/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error dismissing AI insight:", error);
        return { error: "Failed to dismiss insight" };
    }
};
