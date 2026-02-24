"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateTeamNavigationConfig(
    structure: any,
    titleFont?: string,
    itemFont?: string,
    titleFontSize?: string,
    titleFontWeight?: string,
    titleFontStyle?: string,
    itemFontSize?: string,
    itemFontWeight?: string,
    itemFontStyle?: string
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true, team_role: true, is_admin: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes((user.team_role || "").toUpperCase());
    if (!isAdmin) throw new Error("Permission Denied: Only Admins can update Team Navigation.");

    // Check if existing TEAM config exists (user_id: null)
    const existing = await prismadb.navigationConfig.findFirst({
        where: { team_id: user.team_id, user_id: null }
    });

    if (existing) {
        await prismadb.navigationConfig.update({
            where: { id: existing.id },
            data: {
                structure,
                titleFont,
                itemFont,
                titleFontSize,
                titleFontWeight,
                titleFontStyle,
                itemFontSize,
                itemFontWeight,
                itemFontStyle
            } as any
        });
    } else {
        await prismadb.navigationConfig.create({
            data: {
                team_id: user.team_id,
                user_id: null,
                structure,
                titleFont,
                itemFont,
                titleFontSize,
                titleFontWeight,
                titleFontStyle,
                itemFontSize,
                itemFontWeight,
                itemFontStyle
            } as any
        });
    }

    revalidatePath("/");
    return { success: true };
}

export async function updateUserNavigationConfig(
    structure: any,
    titleFont?: string,
    itemFont?: string,
    titleFontSize?: string,
    titleFontWeight?: string,
    titleFontStyle?: string,
    itemFontSize?: string,
    itemFontWeight?: string,
    itemFontStyle?: string
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    // Check if existing USER config exists
    const existing = await prismadb.navigationConfig.findFirst({
        where: { team_id: user.team_id, user_id: userId }
    });

    if (existing) {
        await prismadb.navigationConfig.update({
            where: { id: existing.id },
            data: {
                structure,
                titleFont,
                itemFont,
                titleFontSize,
                titleFontWeight,
                titleFontStyle,
                itemFontSize,
                itemFontWeight,
                itemFontStyle
            } as any
        });
    } else {
        await prismadb.navigationConfig.create({
            data: {
                team_id: user.team_id,
                user_id: userId,
                structure,
                titleFont,
                itemFont,
                titleFontSize,
                titleFontWeight,
                titleFontStyle,
                itemFontSize,
                itemFontWeight,
                itemFontStyle
            } as any
        });
    }

    revalidatePath("/");
    return { success: true };
}

export async function resetNavigationConfig(scope: "USER" | "TEAM") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true, team_role: true, is_admin: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    if (scope === "USER") {
        // Delete only THIS user's override
        await prismadb.navigationConfig.deleteMany({
            where: { team_id: user.team_id, user_id: userId }
        });
    } else if (scope === "TEAM") {
        const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes((user.team_role || "").toUpperCase());
        if (!isAdmin) throw new Error("Permission Denied");

        // Delete TEAM config (user_id: null)
        await prismadb.navigationConfig.deleteMany({
            where: { team_id: user.team_id, user_id: null }
        });
    }

    revalidatePath("/");
    return { success: true };
}
