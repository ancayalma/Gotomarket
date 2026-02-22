"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function searchCrmEntities(query: string, type: "account" | "contact" | "lead", accountId?: string) {
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

    const where: any = {};
    if (!teamInfo?.isGlobalAdmin) {
        where.team_id = teamInfo?.teamId;
    }

    if (type === "account") {
        return await prismadb.crm_Accounts.findMany({
            where: {
                ...where,
                name: { contains: query, mode: "insensitive" }
            },
            select: { id: true, name: true },
            take: 10
        });
    }

    if (type === "contact") {
        return await prismadb.crm_Contacts.findMany({
            where: {
                ...where,
                OR: [
                    { first_name: { contains: query, mode: "insensitive" } },
                    { last_name: { contains: query, mode: "insensitive" } }
                ],
                ...(accountId ? { accountsIDs: accountId } : {})
            },
            select: { id: true, first_name: true, last_name: true },
            take: 10
        });
    }

    if (type === "lead") {
        return await prismadb.crm_Leads.findMany({
            where: {
                ...where,
                OR: [
                    { firstName: { contains: query, mode: "insensitive" } },
                    { lastName: { contains: query, mode: "insensitive" } }
                ],
                ...(accountId ? { accountsIDs: accountId } : {})
            },
            select: { id: true, firstName: true, lastName: true },
            take: 10
        });
    }

    return [];
}
