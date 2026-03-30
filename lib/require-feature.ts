import { prismadb } from "@/lib/prisma";
import { resolveSlug, SUBSCRIPTION_PLANS } from "@/config/subscriptions";

/**
 * Server-side feature access check.
 * Returns true if the team's plan includes the given feature,
 * or if the team has a module_override for it.
 */
export async function requireFeature(
    teamId: string,
    feature: string
): Promise<boolean> {
    const team = await prismadb.team.findUnique({
        where: { id: teamId },
        select: {
            subscription_plan: true,
            module_overrides: true,
            assigned_plan: {
                select: {
                    slug: true,
                    features: true,
                }
            }
        }
    });

    if (!team) return false;

    // 0. Module overrides (highest priority — platform admin can grant anything)
    if (team.module_overrides?.includes("all")) return true;
    if (team.module_overrides?.includes(feature)) return true;

    // 1. DB-assigned plan (if platform admin has assigned a custom plan)
    if (team.assigned_plan) {
        if (team.assigned_plan.features.includes("all")) return true;
        if (team.assigned_plan.features.includes(feature)) return true;
        // Also check config — catches newly added baseline features not yet in DB
        const configSlug = resolveSlug(team.assigned_plan.slug);
        const configPlan = SUBSCRIPTION_PLANS[configSlug];
        if (configPlan.features.includes("all")) return true;
        return configPlan.features.includes(feature);
    }

    // 2. Subscription plan slug (from the enum on the team record)
    const slug = resolveSlug(team.subscription_plan);
    const plan = SUBSCRIPTION_PLANS[slug];
    if (plan.features.includes("all")) return true;
    return plan.features.includes(feature);
}
