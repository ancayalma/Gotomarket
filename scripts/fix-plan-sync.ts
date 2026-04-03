/**
 * fix-plan-sync.ts
 * 
 * One-time migration script to unify subscription_plan with assigned_plan.
 * 
 * For ORGANIZATION teams: sets subscription_plan = assigned_plan.slug
 * For DEPARTMENT teams: sets subscription_plan = parent org's resolved plan, clears plan_id
 * 
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/fix-plan-sync.ts   # Preview changes
 *   npx tsx scripts/fix-plan-sync.ts              # Apply changes
 */

import { prismadb } from "../lib/prisma";

const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
    console.log(`\n=== Subscription Plan Sync Migration ===`);
    console.log(`Mode: ${DRY_RUN ? "🔍 DRY RUN (no changes will be made)" : "⚡ LIVE — changes will be applied"}\n`);

    // 1. Fetch all teams with their plan relations
    const allTeams = await prismadb.team.findMany({
        include: {
            assigned_plan: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { created_at: "asc" },
    });

    const orgs = allTeams.filter((t: any) => t.team_type === "ORGANIZATION");
    const depts = allTeams.filter((t: any) => t.team_type === "DEPARTMENT");

    console.log(`Found ${orgs.length} organizations, ${depts.length} departments\n`);

    // Build a map of org ID -> resolved plan slug for department inheritance
    const orgPlanMap = new Map<string, string>();

    // ── Phase A: Fix Organizations ──
    console.log("── ORGANIZATIONS ──");
    let orgChanges = 0;

    for (const org of orgs) {
        const currentSubPlan = (org as any).subscription_plan as string;
        const assignedPlan = (org as any).assigned_plan as { id: string; name: string; slug: string } | null;
        const resolvedSlug = assignedPlan?.slug || currentSubPlan || "STARTER";

        // Store for dept inheritance
        orgPlanMap.set(org.id, resolvedSlug);

        if (assignedPlan && currentSubPlan !== assignedPlan.slug) {
            console.log(`  ✏️  ${org.name} (${org.slug})`);
            console.log(`      subscription_plan: "${currentSubPlan}" → "${assignedPlan.slug}"`);
            console.log(`      plan_id: ${(org as any).plan_id} (${assignedPlan.name})`);

            if (!DRY_RUN) {
                await prismadb.team.update({
                    where: { id: org.id },
                    data: { subscription_plan: assignedPlan.slug as any },
                });
            }
            orgChanges++;
        } else if (!assignedPlan) {
            console.log(`  ⚠️  ${org.name} (${org.slug}) — no assigned_plan, keeping subscription_plan="${currentSubPlan}"`);
        } else {
            console.log(`  ✅ ${org.name} (${org.slug}) — already synced (${currentSubPlan})`);
        }
    }

    console.log(`\n  Organizations updated: ${orgChanges}\n`);

    // ── Phase B: Fix Departments ──
    console.log("── DEPARTMENTS ──");
    let deptChanges = 0;

    for (const dept of depts) {
        const currentSubPlan = (dept as any).subscription_plan as string;
        const parentId = (dept as any).parent_id as string | null;
        const currentPlanId = (dept as any).plan_id as string | null;

        if (!parentId) {
            console.log(`  ⚠️  ${dept.name} (${dept.slug}) — no parent_id, skipping`);
            continue;
        }

        const parentPlan = orgPlanMap.get(parentId);
        if (!parentPlan) {
            console.log(`  ⚠️  ${dept.name} (${dept.slug}) — parent ${parentId} not found in org map, skipping`);
            continue;
        }

        const needsSync = currentSubPlan !== parentPlan || currentPlanId !== null;

        if (needsSync) {
            console.log(`  ✏️  ${dept.name} (${dept.slug})`);
            console.log(`      subscription_plan: "${currentSubPlan}" → "${parentPlan}" (inheriting from parent)`);
            if (currentPlanId) {
                console.log(`      plan_id: "${currentPlanId}" → null (departments don't own plans)`);
            }

            if (!DRY_RUN) {
                await prismadb.team.update({
                    where: { id: dept.id },
                    data: {
                        subscription_plan: parentPlan as any,
                        plan_id: null,  // Departments don't own plans
                    },
                });
            }
            deptChanges++;
        } else {
            console.log(`  ✅ ${dept.name} (${dept.slug}) — already synced (${currentSubPlan}, no plan_id)`);
        }
    }

    console.log(`\n  Departments updated: ${deptChanges}\n`);

    // ── Summary ──
    console.log("=== Summary ===");
    console.log(`  Total changes: ${orgChanges + deptChanges}`);
    console.log(`  Organizations: ${orgChanges}`);
    console.log(`  Departments: ${deptChanges}`);
    if (DRY_RUN) {
        console.log(`\n  ℹ️  Run without DRY_RUN=1 to apply changes.`);
    } else {
        console.log(`\n  ✅ All changes applied.`);
    }
}

main()
    .catch((err) => {
        console.error("Migration failed:", err);
        process.exit(1);
    })
    .finally(() => process.exit(0));
