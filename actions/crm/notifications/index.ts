"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

export async function getNotifications(includeCleared = true) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        // Pruning mechanism: Delete notifications older than 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        await prismadb.notification.deleteMany({
            where: {
                userId: session.user.id,
                createdAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        const notifications = await prismadb.notification.findMany({
            where: {
                userId: session.user.id,
                ...(includeCleared ? {} : { isCleared: false }),
                // Ensure we only fetch within the 30-day window
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 200, // Increased for history view
        });

        return notifications;
    } catch (error) {
        console.error("[GET_NOTIFICATIONS]", error);
        return [];
    }
}

export async function markAsRead(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
            data: {
                isRead: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[MARK_NOTIFICATION_READ]", error);
        return { success: false };
    }
}

export async function markAllAsRead() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[MARK_ALL_NOTIFICATIONS_READ]", error);
        return { success: false };
    }
}

export async function clearNotification(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
            data: {
                isCleared: true,
                isRead: true, // Also mark as read when cleared
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[CLEAR_NOTIFICATION]", error);
        return { success: false };
    }
}

export async function clearAllNotifications() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.updateMany({
            where: {
                userId: session.user.id,
                isCleared: false,
            },
            data: {
                isCleared: true,
                isRead: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[CLEAR_ALL_NOTIFICATIONS]", error);
        return { success: false };
    }
}

export async function deleteNotification(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.delete({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[DELETE_NOTIFICATION]", error);
        return { success: false };
    }
}

export async function deleteAllNotifications() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.deleteMany({
            where: {
                userId: session.user.id,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[DELETE_ALL_NOTIFICATIONS]", error);
        return { success: false };
    }
}
