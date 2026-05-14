"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { revalidatePath } from "next/cache";

export async function updateRevenueTarget(newTarget: number) {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            throw new Error("No team ID found");
        }

        // Update the team's revenue target using native driver to bypass Prisma's stale client validation
        const { dbAdapter } = await import("@/lib/database/db-adapter");
        const collection = await dbAdapter.getNativeCollection("Team");

        const { ObjectId } = await import("mongodb");
        await collection.updateOne(
            { _id: new ObjectId(teamInfo.teamId) as any },
            { $set: { revenue_target: Math.round(newTarget) } }
        );

        // Revalidate the dashboard path to reflect changes
        revalidatePath("/crm/dashboard");
        revalidatePath("/crm/sales-command");

        return { success: true };
    } catch (error) {
        console.error("Error updating revenue target:", error);
        return { success: false, error: "Failed to update target" };
    }
}
