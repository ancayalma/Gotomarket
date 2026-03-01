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
            "personalized_signature", "custom_themes"
        ],
        limits: {
            max_users: 2,
            max_storage: 5000,
            credits: 2000,
            leadgen_credits: 1000, // Aligned with LEADGEN_WIZARD.md
            emails_per_month: 5000,
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
        }
    }
};

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
