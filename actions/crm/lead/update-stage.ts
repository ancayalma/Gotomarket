
"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateLeadPipelineStage(leadId: string, newStage: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        await prismadb.crm_Leads.update({
            where: { id: leadId },
            data: { pipeline_stage: newStage }
        });

        revalidatePath("/crm/leads");
        return { success: true };
    } catch (error) {
        console.error("[UPDATE_LEAD_STAGE_ERROR]", error);
        return { success: false, error: "Internal Server Error" };
    }
}
