import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { logActivityInternal } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { id } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!id) {
    return new NextResponse("Missing section ID ", { status: 400 });
  }

  console.log(id, "id");

  try {
    const tasks = await prismadb.tasks.findMany({});

    for (const task of tasks) {
      if (task.section === id) {
        await prismadb.tasks.delete({
          where: {
            id: task.id,
          },
        });
      }
    }

    await prismadb.sections.delete({
      where: {
        id: id,
      },
    });

    const teamInfo = await getCurrentUserTeamId();
    await logActivityInternal(session.user.email || "SYSTEM", "DELETE", "Sections", `Deleted section ${id}`, teamInfo?.teamId!);
    return NextResponse.json("deletedSection");
  } catch (error) {
    systemLogger.error("[PROJECT_SECTION_DELETE]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
