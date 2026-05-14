import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return NextResponse.json({ accounts: [], contacts: [] }, { status: 200 });
        }

        const teamId = teamInfo.teamId;

        const dbAccounts = await prismadb.crm_Accounts.findMany({
            where: { team_id: teamId },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' }
        });
        const accounts = dbAccounts.filter((a: any) => a.email && a.email.trim() !== "");

        const dbContacts = await prismadb.crm_Contacts.findMany({
            where: { team_id: teamId },
            select: { id: true, first_name: true, last_name: true, email: true, assigned_accounts: { select: { name: true } } },
            orderBy: { last_name: 'asc' }
        });
        const contacts = dbContacts.filter((c: any) => c.email && c.email.trim() !== "");

        return NextResponse.json({ accounts, contacts }, { status: 200 });

    } catch (error) {
        console.error("[GET_MANUAL_LIST_RESOURCES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
