"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateModuleOverrides(teamId: string, overrides: string[]) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { error: "Unauthorized" };

        // Only PLATFORM_ADMIN or SUPER_ADMIN of the team (or GLOBAL_ADMIN)
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id }
        }) as any;

        const isPlatformAdmin = user?.team_role === "PLATFORM_ADMIN";

        if (!isPlatformAdmin) {
            return { error: "Only platform admins can set module overrides" };
        }

        await prismadb.team.update({
            where: { id: teamId },
            data: {
                module_overrides: overrides
            }
        });

        revalidatePath(`/partners/${teamId}`);
        revalidatePath(`/partners/${teamId}/modules`);

        return { success: true };
    } catch (error) {
        console.error("Update Module Overrides Error:", error);
        return { error: "Failed to update overrides" };
    }
}
