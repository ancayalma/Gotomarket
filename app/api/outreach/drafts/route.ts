import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/outreach/drafts?poolId=xxx
 * Returns the saved draft for the current user + pool (if any).
 *
 * POST /api/outreach/drafts
 * Body: { poolId: string, name?: string, state: object }
 * Upserts a draft for the current user + pool.
 *
 * DELETE /api/outreach/drafts?poolId=xxx
 * Removes the draft for the current user + pool.
 */

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");
    if (!poolId) return NextResponse.json({ draft: null });

    const draft = await prismadb.crm_Outreach_Drafts.findUnique({
      where: {
        user_id_pool_id: { user_id: session.user.id, pool_id: poolId },
      },
      select: { id: true, name: true, state: true, updatedAt: true },
    });

    return NextResponse.json({ draft: draft || null });
  } catch (error) {
    console.error("[OUTREACH_DRAFTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { poolId, name, state } = body;

    if (!poolId || !state) {
      return new NextResponse("poolId and state are required", { status: 400 });
    }

    const draft = await prismadb.crm_Outreach_Drafts.upsert({
      where: {
        user_id_pool_id: { user_id: session.user.id, pool_id: poolId },
      },
      update: {
        name: name || "Untitled Draft",
        state,
      },
      create: {
        user_id: session.user.id,
        pool_id: poolId,
        name: name || "Untitled Draft",
        state,
      },
      select: { id: true, name: true, updatedAt: true },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[OUTREACH_DRAFTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");
    if (!poolId) return new NextResponse("poolId is required", { status: 400 });

    await prismadb.crm_Outreach_Drafts.delete({
      where: {
        user_id_pool_id: { user_id: session.user.id, pool_id: poolId },
      },
    }).catch(() => {}); // Ignore if not found

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[OUTREACH_DRAFTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
