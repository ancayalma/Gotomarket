"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function logUserMetric(metricKey: string) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        
        if (!userId) return { success: false, error: "Unauthorized" };

        const existingMetric = await prismadb.userMetrics.findUnique({
            where: {
                userId_metricKey: {
                    userId,
                    metricKey
                }
            }
        });

        if (existingMetric) {
            await prismadb.userMetrics.update({
                where: { id: existingMetric.id },
                data: {
                    count: { increment: 1 }
                }
            });
        } else {
            await prismadb.userMetrics.create({
                data: {
                    userId,
                    metricKey,
                    count: 1
                }
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to log user metric:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
