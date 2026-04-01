import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/crm/leads/autogen/jobs
 * Returns all lead generation jobs for the current team, ordered by most recent.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // Find all pools accessible to this user/team, then get their jobs
    const whereClause = teamId
      ? { OR: [{ team_id: teamId }, { user: session.user.id }] }
      : { user: session.user.id };

    const pools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        jobs: {
          orderBy: { startedAt: "desc" as const },
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            counters: true,
            pool: true,
          },
        },
      },
    });

    // Flatten jobs with pool info
    const jobs = pools.flatMap((pool: any) =>
      pool.jobs.map((job: any) => ({
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        counters: job.counters ?? {},
        poolId: pool.id,
        poolName: pool.name,
      }))
    );

    // Sort by startedAt desc
    jobs.sort((a: any, b: any) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error: any) {
    systemLogger.error("[LEADS_AUTOGEN_JOBS_GET]", error?.message || error);
    return new NextResponse("Failed to fetch jobs", { status: 500 });
  }
}
