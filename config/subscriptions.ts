export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Free",
        slug: "FREE",
        price: 0,
        features: ["crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads", "tasks", "university"], // Essential CRM + Learn
        limits: {
            max_users: 1,
            max_storage: 50, // MB
            credits: 500, // Monthly AI Credits (Text Gen)
            leadgen_credits: 100, // Aligned with LEADGEN_WIZARD.md
            emails_per_month: 1000, // Bumped up for FREE
            max_active_quests: 0, // Quests locked on FREE
            ai_tokens: 500_000, // 500K AI tokens / month
        }
    },
    INDIVIDUAL_BASIC: {
        name: "Individual Basic",
        slug: "INDIVIDUAL_BASIC",
        price: 50,
        features: [
            "crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads",
            "tasks", "quotes", "products", "contracts", "university",
            "documents", "invoice", "reports", "ai_lab", "emails",
            "personalized_signature", "custom_themes", "quests"
        ],
        limits: {
            max_users: 2,
            max_storage: 5000,
            credits: 2000,
            leadgen_credits: 1000, // Aligned with LEADGEN_WIZARD.md
            emails_per_month: 5000,
            max_active_quests: 5,
            ai_tokens: 5_000_000, // 5M AI tokens / month
        }
    },
    INDIVIDUAL_PRO: {
        name: "Individual Pro",
        slug: "INDIVIDUAL_PRO",
        price: 150,
        features: ["all", "personalized_signature", "custom_themes"],
        limits: {
            max_users: 4,
            max_storage: 50000,
            credits: 10000,
            leadgen_credits: 5000, // Aligned with LEADGEN_WIZARD.md
            emails_per_month: 25000,
            max_active_quests: 25,
            ai_tokens: 20_000_000, // 20M AI tokens / month
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
            max_active_quests: -1,
            ai_tokens: -1, // Unlimited
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
            max_active_quests: -1,
            ai_tokens: -1, // Unlimited
        }
    }
};

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

