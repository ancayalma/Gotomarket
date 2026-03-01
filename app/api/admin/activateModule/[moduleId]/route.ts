import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request, props: { params: Promise<{ moduleId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const user = await prismadb.system_Modules_Enabled.update({
      where: {
        id: params.moduleId,
      },
      data: {
        enabled: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    systemLogger.error("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
