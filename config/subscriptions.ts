export const SUBSCRIPTION_PLANS = {
    STARTER: {
        name: "Starter",
        slug: "STARTER",
        price: 0,
        features: ["crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads", "tasks", "university", "lists", "forms", "personalized_signature"], // Essential CRM + Learn + Lists + Forms + Signature
        limits: {
            max_users: 2,
            max_storage: 50, // MB
            credits: 500, // Monthly AI Credits (Text Gen) (Legacy)
            leadgen_credits: 100, // Aligned with LEADGEN_WIZARD.md
            emails_per_month: 1000,
            sms_per_month: 0, // SMS locked on Starter
            voice_minutes_per_month: 0, // Voice locked on Starter
            max_active_quests: 0, // Quests locked on Starter
            ai_tokens: 1_000_000, // 1M AI tokens / month
            max_forms: 10, // Starter cap: 10 forms
        }
    },
    GROWTH: {
        name: "Growth",
        slug: "GROWTH",
        price: 29, // Per user/month
        features: [
            "crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads",
            "tasks", "quotes", "products", "contracts", "university",
            "documents", "invoice", "reports", "ai_lab", "emails",
            "personalized_signature", "custom_themes", "quests",
            "outreach", "messages", "forms", "lists", "campaigns"
        ],
        limits: {
            max_users: 5,
            max_storage: 5000,
            credits: 2000,
            leadgen_credits: 1000,
            emails_per_month: 5000,
            sms_per_month: 0, // SMS not included in Growth
            voice_minutes_per_month: 0, // Voice not included in Growth
            max_active_quests: 5,
            ai_tokens: 5_000_000, // 5M AI tokens / month
            max_forms: 50, // Growth cap: 50 forms
        }
    },
    SCALE: {
        name: "Scale",
        slug: "SCALE",
        price: 79, // Per user/month
        features: ["all", "personalized_signature", "custom_themes"],
        limits: {
            max_users: 10,
            max_storage: 50000,
            credits: 10000,
            leadgen_credits: 5000,
            emails_per_month: 25000,
            sms_per_month: 1000,
            voice_minutes_per_month: 100,
            max_active_quests: 25,
            ai_tokens: 20_000_000, // 20M AI tokens / month
            max_forms: -1, // Unlimited
        }
    },
    ENTERPRISE: {
        name: "Enterprise",
        slug: "ENTERPRISE",
        price: 0, // Contact us logic in UI
        features: ["all"],
        limits: {
            max_users: -1,
            max_storage: -1,
            credits: -1,
            leadgen_credits: -1,
            emails_per_month: -1,
            sms_per_month: -1,
            voice_minutes_per_month: -1,
            max_active_quests: -1,
            ai_tokens: -1, // Unlimited
            max_forms: -1, // Unlimited
        }
    },
    EXEMPT: {
        name: "Platform Exempt",
        slug: "EXEMPT",
        price: 0,
        features: ["all"],
        limits: {
            max_users: -1,
            max_storage: -1,
            credits: -1,
            leadgen_credits: -1,
            emails_per_month: -1,
            sms_per_month: -1,
            voice_minutes_per_month: -1,
            max_active_quests: -1,
            ai_tokens: -1, // Unlimited
            max_forms: -1, // Unlimited
        }
    }
};

// ---------------------------------------------------------------------------
// Legacy slug mapping (for backward compatibility during migration)
// ---------------------------------------------------------------------------
export const LEGACY_SLUG_MAP: Record<string, keyof typeof SUBSCRIPTION_PLANS> = {
    "FREE": "STARTER",
    "INDIVIDUAL_BASIC": "GROWTH",
    "INDIVIDUAL_PRO": "SCALE",
    "BASIC": "GROWTH",   // Stale slug from guard.ts
    "PRO": "SCALE",      // Stale slug from guard.ts
};

/** Resolve a plan slug to a canonical key, handling legacy names */
export function resolveSlug(slug: string | null | undefined): keyof typeof SUBSCRIPTION_PLANS {
    if (!slug) return "STARTER";
    const upper = slug.toUpperCase();
    if (upper in SUBSCRIPTION_PLANS) return upper as keyof typeof SUBSCRIPTION_PLANS;
    if (upper in LEGACY_SLUG_MAP) return LEGACY_SLUG_MAP[upper];
    return "STARTER";
}

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

/** AI Token Top-Up pricing */
export const AI_TOKEN_TOPUP = {
    price: 9.99,     // USD per top-up
    tokens: 6_000_000, // 6M tokens per top-up
} as const;

/** Discount percentage for using BasaltSurge manual payments instead of Stripe */
export const SURGE_DISCOUNT_PERCENT = 5;

/** Annual billing discount (percentage off monthly rate × 12) */
export const ANNUAL_DISCOUNT_PERCENT = 20;

// ---------------------------------------------------------------------------
// Pricing Helpers
// ---------------------------------------------------------------------------

/** Get monthly price for a plan */
export function getMonthlyPrice(planSlug: SubscriptionPlanType): number {
    return SUBSCRIPTION_PLANS[planSlug]?.price ?? 0;
}

/** Get annual price (20% off monthly × 12) */
export function getAnnualPrice(planSlug: SubscriptionPlanType): number {
    const monthly = getMonthlyPrice(planSlug);
    return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
}

/** Get effective monthly rate when paying annually */
export function getAnnualMonthlyRate(planSlug: SubscriptionPlanType): number {
    return Math.round((getAnnualPrice(planSlug) / 12) * 100) / 100;
}

/** Apply Surge discount to a price */
export function getSurgePrice(price: number): number {
    return Math.round(price * (1 - SURGE_DISCOUNT_PERCENT / 100) * 100) / 100;
}
