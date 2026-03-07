import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logActivityInternal } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { validateResourceOwnership, unauthorizedResponse } from "@/lib/api-utils";
import { systemLogger } from "@/lib/logger";

export async function DELETE(req: Request, props: { params: Promise<{ accountId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();

    // SOC2: Verify ownership before deletion
    const existing = await prismadb.crm_Accounts.findUnique({
      where: { id: params.accountId },
      select: { team_id: true, name: true },
    });

    if (!existing) {
      return new NextResponse("Account not found", { status: 404 });
    }

    if (!validateResourceOwnership(teamInfo?.teamId || null, existing.team_id, false)) {
      return await unauthorizedResponse("DELETE", `crm_Accounts:${params.accountId}`);
    }

    await prismadb.crm_Accounts.delete({
      where: {
        id: params.accountId,
      },
    });

    await logActivityInternal(session.user.id, "DELETE", "crm_Accounts", `Deleted account: ${existing.name} (${params.accountId})`, teamInfo?.teamId || undefined);
    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    systemLogger.error("[ACCOUNT_DELETE]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
