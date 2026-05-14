import { SUBSCRIPTION_PLANS, SubscriptionPlanType, resolveSlug } from "@/config/subscriptions";

// Define a type for the DB Plan partial we need
type DBPlan = {
    slug: string;
    features: string[];
    max_users: number;
    max_storage: number;
    max_credits: number;
}

type TeamWithPlan = {
    subscription_plan?: string | null; // Old Enum
    assigned_plan?: DBPlan | null;      // New Relation
    module_overrides?: string[];
    temporary_modules?: { module: string; expires_at: Date | string }[];
}

export const getSubscriptionPlan = (slug?: string) => {
    const planSlug = resolveSlug(slug);
    return SUBSCRIPTION_PLANS[planSlug] || SUBSCRIPTION_PLANS.STARTER;
};

export const checkLimit = (
    planSlug: string | undefined,
    metric: keyof typeof SUBSCRIPTION_PLANS["STARTER"]["limits"],
    currentUsage: number
) => {
    const plan = getSubscriptionPlan(planSlug);
    const limit = plan.limits[metric];

    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
};

export const checkTeamLimit = (
    team: TeamWithPlan,
    metric: keyof typeof SUBSCRIPTION_PLANS["STARTER"]["limits"],
    currentUsage: number
) => {
    // 1. Check DB Plan
    if (team.assigned_plan) {
        let limit = 0;
        if (metric === 'max_users') limit = team.assigned_plan.max_users;
        if (metric === 'max_storage') limit = team.assigned_plan.max_storage;
        if (metric === 'credits') limit = team.assigned_plan.max_credits;

        // Handle extended metrics if they exist on the DB model, 
        // fallback to config defaults if not in DB yet
        if (metric === 'leadgen_credits') {
            limit = (team.assigned_plan as any).leadgen_credits ?? getSubscriptionPlan(team.assigned_plan.slug).limits.leadgen_credits;
        }
        if (metric === 'emails_per_month') {
            limit = (team.assigned_plan as any).emails_per_month ?? getSubscriptionPlan(team.assigned_plan.slug).limits.emails_per_month;
        }
        if (metric === 'ai_tokens') {
            limit = (team.assigned_plan as any).ai_tokens_included ?? getSubscriptionPlan(team.assigned_plan.slug).limits.ai_tokens;
        }

        if (limit === -1) return true;
        return currentUsage < limit;
    }

    // 2. Fallback to constant
    return checkLimit(team.subscription_plan || "STARTER", metric, currentUsage);
}

export const hasFeature = (
    planSlug: string | undefined,
    featureName: string
) => {
    const plan = getSubscriptionPlan(planSlug);
    if (plan.features.includes("all")) return true;
    return plan.features.includes(featureName);
};

export const checkTeamFeature = (
    team: TeamWithPlan,
    featureName: string
) => {
    // 0. Check Override (Highest Priority)
    if (team.module_overrides?.includes("all")) return true;
    if (team.module_overrides?.includes(featureName)) return true;

    // 0.5 Check Temporary Educational Unlocks
    if (team.temporary_modules && team.temporary_modules.length > 0) {
        const tempModule = team.temporary_modules.find(m => m.module === featureName || m.module === "all");
        if (tempModule) {
            const expires = new Date(tempModule.expires_at).getTime();
            if (expires > Date.now()) {
                return true;
            }
        }
    }

    // 1. Check DB Plan
    if (team.assigned_plan) {
        if (team.assigned_plan.features.includes("all")) return true;
        if (team.assigned_plan.features.includes(featureName)) return true;

        // 1b. Also check the config constant for the same slug.
        // This ensures newly added baseline features (e.g. "lists" added to STARTER)
        // are recognized even if the DB plan record hasn't been updated yet.
        const configPlan = getSubscriptionPlan(team.assigned_plan.slug);
        if (configPlan.features.includes("all")) return true;
        if (configPlan.features.includes(featureName)) return true;

        return false;
    }

    // 2. Fallback to constant
    return hasFeature(team.subscription_plan || "STARTER", featureName);
}
