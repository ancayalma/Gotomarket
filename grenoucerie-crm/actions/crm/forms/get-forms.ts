"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function getActiveForms() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return [];
        }

        const teamId = (session.user as any).team_id;
        if (!teamId) {
            return [];
        }

        const forms = await (prismadb as any).form.findMany({
            where: {
                team_id: teamId,
                status: "ACTIVE"
            },
            select: {
                id: true,
                slug: true,
                name: true
            },
            orderBy: {
                name: "asc"
            }
        });

        return forms.map((form: any) => ({
            id: form.slug, // We use slug as the trigger target
            name: form.name
        }));
    } catch (error) {
        console.error("Failed to fetch active forms:", error);
        return [];
    }
}
