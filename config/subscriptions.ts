export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Testing Plan",
        slug: "FREE",
        price: 2, // From screenshot
        features: ["crm", "projects", "documents", "invoices"],
        limits: {
            max_users: 1,
            max_storage: 500, // MB
            credits: 50, // General monthly credits
            leadgen_credits: 100,
        }
    },
    INDIVIDUAL_BASIC: {
        name: "Individual Basic",
        slug: "INDIVIDUAL_BASIC",
        price: 50,
        features: ["crm", "projects", "documents", "invoices", "reports", "openai", "emails"],
        limits: {
            max_users: 2,
            max_storage: 5000,
            credits: 1000,
            leadgen_credits: 1000,
        }
    },
    INDIVIDUAL_PRO: {
        name: "Individual Pro",
        slug: "INDIVIDUAL_PRO",
        price: 150,
        features: ["all"],
        limits: {
            max_users: 4,
            max_storage: 50000,
            credits: 10000,
            leadgen_credits: 5000,
        }
    },
    ENTERPRISE: {
        name: "Platform Exempt",
        slug: "ENTERPRISE",
        price: 0,
        features: ["all"],
        limits: {
            max_users: -1,
            max_storage: -1,
            credits: -1,
            leadgen_credits: -1,
        }
    }
};

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
