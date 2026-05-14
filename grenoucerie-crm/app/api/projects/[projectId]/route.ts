import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logActivityInternal } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export async function DELETE(req: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!params.projectId) {
    return new NextResponse("Missing project ID", { status: 400 });
  }
  const boardId = params.projectId;

  try {
    const sections = await prismadb.sections.findMany({
      where: {
        board: boardId,
      },
    });

    for (const section of sections) {
      await prismadb.tasks.deleteMany({
        where: {
          section: section.id,
        },
      });
    }
    await prismadb.sections.deleteMany({
      where: {
        board: boardId,
      },
    });

    await prismadb.boards.delete({
      where: {
        id: boardId,
      },
    });

    const teamInfo = await getCurrentUserTeamId();
    await logActivityInternal(session.user.id, "DELETE", "Boards", `Deleted project: ${boardId}`, teamInfo?.teamId || undefined);
    return NextResponse.json({ message: "Board deleted" }, { status: 200 });
  } catch (error) {
    systemLogger.error("[PROJECT_DELETE]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
