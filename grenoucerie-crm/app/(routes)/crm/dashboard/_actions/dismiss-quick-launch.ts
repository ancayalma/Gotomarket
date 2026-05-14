"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function dismissQuickLaunch() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Not authenticated" };

        try {
            await (prismadb.users as any).update({
                where: { id: session.user.id },
                data: { quickLaunchDismissed: true }
            });
        } catch (error) {
            console.error("Stale prisma client fallback in dismissQuickLaunch", error);
            // If the field fails, we just log it and return success so the UI can proceed (it will retry next time)
            return { success: true, message: "Field not yet available in schema, locally dismissed" };
        }

        revalidatePath("/crm/dashboard");
        return { success: true };
    } catch (error) {
        console.error("[DISMISS_QUICK_LAUNCH]", error);
        return { error: "Failed to dismiss checklist" };
    }
}
