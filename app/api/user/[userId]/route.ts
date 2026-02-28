import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getSessionAndTeam, unauthorizedResponse } from "@/lib/api-utils";
import { logActivityInternal } from "@/actions/audit";

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const user = await prismadb.users.findMany({
      where: {
        id: params.userId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USER_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const { error, teamInfo, session } = await getSessionAndTeam();

  if (error) return error;

  // SOC2 Check: Only a Platform Admin or the user themselves can delete their account
  const isDeletingSelf = session!.user.id === params.userId;
  const hasAdminRights = teamInfo!.isAdmin || teamInfo!.isPlatformAdmin;

  if (!isDeletingSelf && !hasAdminRights) {
    return await unauthorizedResponse("DELETE", `Users:${params.userId}`);
  }

  try {
    // Manually handle common user relations to avoid P2014 constraint issues
    await prismadb.projectMember.deleteMany({ where: { user: params.userId } });
    await (prismadb as any).systemActivity.deleteMany({ where: { userId: params.userId } });
    await prismadb.notification.deleteMany({ where: { userId: params.userId } });
    await prismadb.dashboardPreference.deleteMany({ where: { userId: params.userId } });

    // Purge MFA Authenticators (WebAuthn)
    await (prismadb as any).authenticator.deleteMany({ where: { userId: params.userId } });

    const user = await prismadb.users.delete({
      where: {
        id: params.userId,
      },
      select: { email: true, name: true, team_id: true }
    });

    await logActivityInternal(
      session!.user.id,
      "RECORD_DELETE",
      "Users",
      `Deleted user account: ${user.email} (${user.name})`,
      teamInfo!.teamId || undefined
    );

    return NextResponse.json({ success: true, message: "User purged" });
  } catch (error) {
    console.log("[USER_DELETE]", error);
    return NextResponse.json({ error: "Failed to purge user" }, { status: 500 });
  }
}
