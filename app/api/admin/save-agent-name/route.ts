import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth-guard";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { prismadb } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/save-agent-name
 * Quick-save just the voice_agent_name field from the dialer config tab.
 * Body: { voice_agent_name: string }
 */
export async function POST(req: Request) {
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const { voice_agent_name } = await req.json();
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId) {
      return NextResponse.json({ error: "No team" }, { status: 400 });
    }

    await prismadb.tenant_Integrations.upsert({
      where: { tenant_id: teamInfo.teamId },
      create: {
        tenant_id: teamInfo.teamId,
        voice_agent_name: voice_agent_name || undefined,
        preferred_chain: "BASE",
      },
      update: {
        voice_agent_name: voice_agent_name || undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
