import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { systemLogger } from "@/lib/logger";

export async function PUT(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const { password, cpassword } = await req.json();

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  // RBAC: Only the user themselves or an admin can change the password
  const isSelf = session.user.id === params.userId;
  const isAdmin = (session.user as any).isAdmin || (session.user as any).role === "PLATFORM_ADMIN";

  if (!isSelf && !isAdmin) {
    return new NextResponse("Forbidden: You can only change your own password", { status: 403 });
  }

  if (!params.userId) {
    return new NextResponse("No user ID provided", { status: 400 });
  }

  if (!password || !cpassword) {
    return new NextResponse("No password provided", { status: 400 });
  }

  if (password !== cpassword) {
    return new NextResponse("Passwords do not match", { status: 400 });
  }

  if (session.user.email === "demo@basalthq.com") {
    return new NextResponse(
      "Hey, don't be a fool! There are so many works done! Thanks!",
      {
        status: 400,
      }
    );
  }

  try {
    const newUserPass = await prismadb.users.update({
      data: {
                    session_version: { increment: 1 },

        password: await hash(password, 10),
      },
      where: {
        id: params.userId,
      },
    });

    return NextResponse.json(newUserPass);
  } catch (error) {
    systemLogger.error("[NEW_USERPASS_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
