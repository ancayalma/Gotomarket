import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { systemLogger } from "@/lib/logger";

export async function PUT(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const { name, username, account_name, lastKnownRegion } = await req.json();

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.userId) {
    return new NextResponse("No user ID provided", { status: 400 });
  }

  try {
    const newUserPass = await prismadb.users.update({
      data: {
        name: name,
        username: username,
        account_name: account_name,
        lastKnownRegion: lastKnownRegion,
      },
      where: {
        id: params.userId,
      },
    });

    import("@/actions/quests/add-raw-xp")
      .then((m) => m.grantOneTimeXP({
          userId: params.userId,
          xpAmount: 10,
          flagKey: "profile_completed",
          reason: "Completed User Profile"
      }))
      .catch((e) => systemLogger.warn(`[UPDATE_PROFILE] Failed to award XP: ${e?.message}`));

    import("@/actions/university/log-user-metric")
      .then((m) => m.logUserMetric("updated_timezone"))
      .catch((e) => systemLogger.warn(`[UPDATE_PROFILE] Failed to log user metric: ${e?.message}`));

    return NextResponse.json(newUserPass);
  } catch (error) {
    systemLogger.error("[UPDATE_USER_PROFILE_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
