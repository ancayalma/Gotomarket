"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { headers } from "next/headers";

export async function logActivityInternal(
    userId: string,
    action: string,
    resource: string,
    details?: string,
    team_id?: string
) {
    try {
        const headerList = await headers();
        const ipAddress = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "unknown";
        const userAgent = headerList.get("user-agent") || "unknown";

        await prismadb.systemActivity.create({
            data: {
                userId,
                team_id,
                action,
                resource,
                details,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

export async function logActivity(
    action: string,
    resource: string,
    details?: string
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        const team_id = (session?.user as any)?.team_id;
        if (!userId) return;

        await logActivityInternal(userId, action, resource, details, team_id);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

export async function getRecentActivities(limit = 50) {
    try {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const activities = await prismadb.systemActivity.findMany({
            where: {
                createdAt: {
                    gte: twoWeeksAgo
                }
            },
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        return activities;
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return [];
    }
}
