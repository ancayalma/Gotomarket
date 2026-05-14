import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LeadGenWizardSchema, startLeadGenJob } from "@/actions/leads/start-leadgen-job";
import { prismadb } from "@/lib/prisma";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";
import { getTeamCreditsInfo } from "@/actions/crm/credits/index";

/**
 * POST /api/crm/leads/autogen
 * Starts a Lead Generation Job (creates a Lead Pool + Job in QUEUED status).
 * Body: LeadGenWizardSchema
 * Response: { poolId, jobId }
 * 
 * ADMIN ONLY: Only admins can create lead pools
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check if user is admin - only admins can create lead pools
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: {
        team_id: true,
        team_role: true,
        is_admin: true,
        is_account_admin: true,
        assigned_role: { select: { name: true } },
      },
    });

    const role = (user?.team_role || '').trim().toUpperCase();
    const isHighTier = ['PLATFORM_ADMIN', 'PLATFORM ADMIN', 'SUPER_ADMIN', 'OWNER', 'SYSADM'].includes(role);
    const isAdmin = isHighTier || role === 'ADMIN' || user?.is_admin || user?.is_account_admin || user?.assigned_role?.name === "SuperAdmin";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can create lead pools" },
        { status: 403 }
      );
    }
    
    // Server-side limits enforcement (cannot be bypassed)
    if (user?.team_id) {
        const limitsInfo = await getTeamCreditsInfo();
        if (limitsInfo && !limitsInfo.isUnlimited) {
            if (limitsInfo.remaining !== undefined && limitsInfo.remaining !== -1 && limitsInfo.remaining <= 0) {
               return NextResponse.json({ error: "You have exhausted your LeadGen Target for this month." }, { status: 403 });
            }
            if (limitsInfo.aiTokensLimit !== undefined && limitsInfo.aiTokensLimit !== -1 && limitsInfo.aiTokensBalance !== undefined && limitsInfo.aiTokensBalance <= 0) {
               return NextResponse.json({ error: "You do not have enough AI Tokens to run Lead Generation." }, { status: 403 });
            }
        }
    }

    const body = await req.json();
    const parsed = LeadGenWizardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { poolId, jobId } = await startLeadGenJob({
      userId: session.user.id,
      wizard: parsed.data,
    });

    // NOTE: You may kick off the actual scraping pipeline here (queue/worker)
    // e.g., await runLeadGenPipeline({ jobId, userId: session.user.id });
    // For now we return identifiers; UI can poll status route.

    await logActivityInternal(session.user.email || "SYSTEM", "CREATE", "LeadGenJob", `Started lead generation job ${jobId} and pool ${poolId}`);
    return NextResponse.json({ poolId, jobId }, { status: 201 });
  } catch (error) {
    systemLogger.error("[LEADS_AUTOGEN_POST]", error);
    return new NextResponse("Failed to start lead generation job", { status: 500 });
  }
}

/**
 * GET /api/crm/leads/autogen
 * Optional convenience endpoint to validate auth or provide minimal info.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
