import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth-guard";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { prismadb } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/integration-settings
 * Returns the current tenant's integration settings (subset relevant to dialer).
 */
export async function GET() {
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId) {
      return NextResponse.json({}, { status: 200 });
    }

    const integration = await prismadb.tenant_Integrations.findUnique({
      where: { tenant_id: teamInfo.teamId },
      select: { voice_agent_name: true, twilio_enabled: true, twilio_phone_number: true },
    });

    return NextResponse.json(integration || {});
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
