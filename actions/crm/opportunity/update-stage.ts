
"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateOpportunitySalesStage(opportunityId: string, salesStageId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        await prismadb.crm_Opportunities.update({
            where: { id: opportunityId },
            data: { sales_stage: salesStageId }
        });

        revalidatePath("/crm/opportunities");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_OPPORTUNITY_STAGE]", error);
        return { success: false, error: error.message };
    }
}
