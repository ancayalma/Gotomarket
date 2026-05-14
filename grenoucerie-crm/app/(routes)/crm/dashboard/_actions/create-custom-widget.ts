"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";

export async function createCustomWidget(formData: any) {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            throw new Error("No team ID found");
        }

        // Create the custom widget in the database
        await prismadb.crm_CustomWidget.create({
            data: {
                name: formData.name,
                icon: formData.icon,
                color: formData.color,
                dataSource: formData.dataSource,
                aggregation: formData.aggregation,
                targetField: formData.targetField || (formData.aggregation === "SUM" || formData.aggregation === "AVG" ? "amount" : null),
                chartType: formData.chartType,
                filters: formData.filters || [],
                targetValue: formData.targetValue ? parseFloat(formData.targetValue) : null,
                comparisonPeriod: formData.comparison || "NONE",
                team_id: teamInfo.teamId,
            }
        });

        revalidatePath("/crm/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error creating custom widget:", error);
        return { success: false, error: "Failed to forge custom metric" };
    }
}
