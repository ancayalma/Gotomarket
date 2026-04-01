import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { logActivityInternal } from "@/actions/audit";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/crm/leads/pools/merge
 * Merges two or more pools into a single new pool.
 *
 * Body:
 *  - sourcePoolIds: string[]     (pools to merge)
 *  - name: string                (name for the new merged pool)
 *  - deleteOriginals: boolean    (whether to delete source pools after merge)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { sourcePoolIds, name, deleteOriginals } = body as {
      sourcePoolIds: string[];
      name: string;
      deleteOriginals: boolean;
    };

    if (!sourcePoolIds || sourcePoolIds.length < 2) {
      return NextResponse.json({ error: "Select at least two lists to merge" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Merged list name is required" }, { status: 400 });
    }

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId || null;

    // Verify all source pools exist and belong to this user/team
    const sourcePools = await (prismadb.crm_Lead_Pools as any).findMany({
      where: { id: { in: sourcePoolIds } },
      select: { id: true, name: true, user: true, team_id: true },
    });

    if (sourcePools.length !== sourcePoolIds.length) {
      return NextResponse.json({ error: "One or more source lists not found" }, { status: 404 });
    }

    // 1. Create the new merged pool
    const mergedPool = await (prismadb.crm_Lead_Pools as any).create({
      data: {
        name: name.trim(),
        user: session.user.id,
        team_id: teamId,
        status: "ACTIVE",
        description: `Merged from: ${sourcePools.map((p: any) => p.name).join(", ")}`,
      },
    });

    systemLogger.info(`[MERGE_POOLS] Created merged pool ${mergedPool.id} from ${sourcePoolIds.length} sources`);

    // 2. Move AI-generated candidates (crm_Lead_Candidates.pool -> new pool)
    const candidatesMoved = await (prismadb.crm_Lead_Candidates as any).updateMany({
      where: { pool: { in: sourcePoolIds } },
      data: { pool: mergedPool.id },
    });
    systemLogger.info(`[MERGE_POOLS] Moved ${candidatesMoved.count} candidates`);

    // 3. Move manual lead mappings (crm_Lead_Pools_Leads)
    // Get all existing mappings from source pools
    const existingMappings = await (prismadb.crm_Lead_Pools_Leads as any).findMany({
      where: { pool: { in: sourcePoolIds } },
      select: { id: true, lead: true, pool: true },
    });

    // Deduplicate by lead ID (a lead might be in multiple source pools)
    const seenLeadIds = new Set<string>();
    const mappingsToCreate: { pool: string; lead: string }[] = [];
    for (const mapping of existingMappings) {
      if (!seenLeadIds.has(mapping.lead)) {
        seenLeadIds.add(mapping.lead);
        mappingsToCreate.push({ pool: mergedPool.id, lead: mapping.lead });
      }
    }

    if (mappingsToCreate.length > 0) {
      await (prismadb.crm_Lead_Pools_Leads as any).createMany({
        data: mappingsToCreate,
      });
    }
    systemLogger.info(`[MERGE_POOLS] Created ${mappingsToCreate.length} lead mappings (deduped from ${existingMappings.length})`);

    // 4. Move jobs to the new pool
    const jobsMoved = await (prismadb.crm_Lead_Gen_Jobs as any).updateMany({
      where: { pool: { in: sourcePoolIds } },
      data: { pool: mergedPool.id },
    });
    systemLogger.info(`[MERGE_POOLS] Moved ${jobsMoved.count} jobs`);

    // 5. Optionally delete source pools
    if (deleteOriginals) {
      // Delete old mappings from source pools (they've been moved/copied)
      await (prismadb.crm_Lead_Pools_Leads as any).deleteMany({
        where: { pool: { in: sourcePoolIds } },
      });

      // Delete source event references
      try {
        const oldJobIds = await (prismadb.crm_Lead_Gen_Jobs as any).findMany({
          where: { pool: { in: sourcePoolIds } },
          select: { id: true },
        });
        if (oldJobIds.length > 0) {
          await (prismadb.crm_Lead_Source_Events as any).deleteMany({
            where: { job: { in: oldJobIds.map((j: any) => j.id) } },
          });
        }
      } catch (e) { /* Non-fatal */ }

      // Delete the source pools
      await (prismadb.crm_Lead_Pools as any).deleteMany({
        where: { id: { in: sourcePoolIds } },
      });
      systemLogger.info(`[MERGE_POOLS] Deleted ${sourcePoolIds.length} source pools`);
    }

    await logActivityInternal(
      session.user.id,
      "CREATE",
      "crm_Lead_Pools",
      `Merged ${sourcePoolIds.length} lists into "${name}" (pool ${mergedPool.id}). ${deleteOriginals ? "Originals deleted." : "Originals kept."}`,
      teamId || ""
    );

    return NextResponse.json({
      success: true,
      mergedPool: {
        id: mergedPool.id,
        name: mergedPool.name,
      },
      stats: {
        candidatesMoved: candidatesMoved.count,
        leadMappingsCreated: mappingsToCreate.length,
        jobsMoved: jobsMoved.count,
        originalPoolsDeleted: deleteOriginals ? sourcePoolIds.length : 0,
      },
    });
  } catch (error: any) {
    systemLogger.error("[MERGE_POOLS] Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to merge lists" },
      { status: 500 }
    );
  }
}
