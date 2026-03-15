import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Free",
        slug: "FREE",
        price: 0,
        features: ["crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads", "tasks", "university"],
        limits: {
            max_users: 1,
            max_storage: 50,
            credits: 500,
            leadgen_credits: 100,
            ai_tokens_included: 500000,
            ai_topup_price: 9.99,
            ai_topup_tokens: 6000000,
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
            leadgen_credits: 1000,
            ai_tokens_included: 5000000,
            ai_topup_price: 9.99,
            ai_topup_tokens: 6000000,
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
            leadgen_credits: 5000,
            ai_tokens_included: 20000000,
            ai_topup_price: 9.99,
            ai_topup_tokens: 6000000,
        }
    },
    ENTERPRISE: {
        name: "Enterprise",
        slug: "ENTERPRISE",
        price: 0,
        features: ["all"],
        limits: {
            max_users: 9999,
            max_storage: 100000,
            credits: 50000,
            leadgen_credits: -1,
            ai_tokens_included: -1,
            ai_topup_price: 0,
            ai_topup_tokens: 0,
        }
    },
    EXEMPT: {
        name: "Platform Exempt",
        slug: "EXEMPT",
        price: 0,
        features: ["all"],
        limits: {
            max_users: 9999,
            max_storage: 100000,
            credits: -1,
            leadgen_credits: -1,
            ai_tokens_included: -1,
            ai_topup_price: 0,
            ai_topup_tokens: 0,
        }
    }
};

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Plan migration...");

    // 1. Seed Plans
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
        const existingPlan = await prisma.plan.findUnique({
            where: { slug: key },
        });

        const planData = {
            name: plan.name,
            slug: key,
            features: plan.features,
            max_users: plan.limits.max_users,
            max_storage: plan.limits.max_storage,
            max_credits: plan.limits.credits,
            leadgen_credits_monthly: plan.limits.leadgen_credits,
            ai_tokens_included: plan.limits.ai_tokens_included,
            ai_topup_price: plan.limits.ai_topup_price,
            ai_topup_tokens: plan.limits.ai_topup_tokens,
            price: plan.price,
            isActive: true,
        };

        if (!existingPlan) {
            console.log(`Creating plan: ${plan.name}`);
            await prisma.plan.create({ data: planData });
        } else {
            console.log(`Plan ${plan.name} already exists. Updating details...`);
            await prisma.plan.update({
                where: { id: existingPlan.id },
                data: planData,
            });
        }
    }

    // 2. Migrate Teams
    console.log("Migrating Teams...");
    const teams = await prisma.team.findMany({
        where: {
            OR: [
                { plan_id: null },
                { plan_id: { isSet: false } }
            ]
        }
    });

    for (const team of teams) {
        const planSlug = team.subscription_plan || "FREE";

        const plan = await prisma.plan.findUnique({
            where: { slug: planSlug }
        });

        if (plan) {
            console.log(`Assigning plan ${plan.name} to team ${team.name}`);
            await prisma.team.update({
                where: { id: team.id },
                data: { plan_id: plan.id }
            });
        } else {
            console.warn(`Could not find plan for slug: ${planSlug} for team ${team.name}`);
        }
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
