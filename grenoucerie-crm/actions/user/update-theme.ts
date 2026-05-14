"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Save the user's preferred theme ID and (optionally) their custom theme definitions to the database.
 * This ensures theme preferences survive cross-session cookie overwrites.
 */
export async function saveUserTheme(themeId: string, customThemes?: any[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const data: any = { preferredTheme: themeId };
    if (customThemes !== undefined) {
        data.customThemes = customThemes;
    }

    await prismadb.users.update({
        where: { id: session.user.id },
        data,
    });

    return { success: true };
}

/**
 * Save ONLY the custom themes array to the DB (e.g. after creating/deleting a custom theme).
 */
export async function saveUserCustomThemes(customThemes: any[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prismadb.users.update({
        where: { id: session.user.id },
        data: { customThemes },
    });

    return { success: true };
}

/**
 * Load the user's persisted theme preference and custom themes from the database.
 * Called by ThemeGuard on session mount to restore the correct theme.
 */
export async function getUserTheme(): Promise<{
    preferredTheme: string | null;
    customThemes: any[] | null;
}> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { preferredTheme: null, customThemes: null };

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { preferredTheme: true, customThemes: true },
    });

    return {
        preferredTheme: user?.preferredTheme || null,
        customThemes: (user?.customThemes as any[] | null) || null,
    };
}
