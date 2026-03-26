import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const SUBSCRIPTION_PLANS = {
    STARTER: {
        name: "Starter",
        slug: "STARTER",
        price: 0,
        features: ["crm", "projects", "dashboard", "contacts", "accounts", "opportunities", "leads", "tasks", "university"],
        limits: {
            max_users: 2,
            max_storage: 50,
            credits: 500,
            leadgen_credits: 100,
            ai_tokens_included: 500000,
            ai_topup_price: 9.99,
            ai_topup_tokens: 6000000,
        }
    },
    GROWTH: {
        name: "Growth",
        slug: "GROWTH",
        price: 29,
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
            ai_tokens_included: 5000000,
            ai_topup_price: 9.99,
            ai_topup_tokens: 6000000,
        }
    },
    SCALE: {
        name: "Scale",
        slug: "SCALE",
        price: 79,
        features: ["all", "personalized_signature", "custom_themes"],
        limits: {
            max_users: 10,
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
            max_users: -1,
            max_storage: -1,
            credits: -1,
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
            max_users: -1,
            max_storage: -1,
            credits: -1,
            leadgen_credits: -1,
            ai_tokens_included: -1,
            ai_topup_price: 0,
            ai_topup_tokens: 0,
        }
    }
};

const LEGACY_MAP: Record<string, keyof typeof SUBSCRIPTION_PLANS> = {
    "FREE": "STARTER",
    "INDIVIDUAL_BASIC": "GROWTH",
    "INDIVIDUAL_PRO": "SCALE"
};

const prisma = new PrismaClient();

async function main() {
    console.log("Starting full Plan alignment migration...");

    // 1. Seed New Canonical Plans
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
            console.log(`Creating canonical plan: ${plan.name}`);
            await prisma.plan.create({ data: planData });
        } else {
            console.log(`Canonical Plan ${plan.name} exists. Updating limits to latest...`);
            await prisma.plan.update({
                where: { id: existingPlan.id },
                data: planData,
            });
        }
    }

    // 2. Migrate All Teams to Canonical Plans
    console.log("Migrating Teams to Canonical Plans...");
    const teams = await prisma.team.findMany();
    
    for (const team of teams) {
        // Resolve the raw slug or use fallback
        let rawSlug = team.subscription_plan || "FREE";
        
        // Map legacy slugs using our migration map
        const mappedSlug = LEGACY_MAP[rawSlug] || rawSlug;
        
        // Ensure the slug exists in our new plans, otherwise fallback to STARTER
        const finalSlug = Object.keys(SUBSCRIPTION_PLANS).includes(mappedSlug) ? mappedSlug : "STARTER";

        const plan = await prisma.plan.findUnique({
            where: { slug: finalSlug }
        });

        if (plan) {
            console.log(`Migrating team ${team.name} -> ${plan.name} (was: ${rawSlug})`);
            await prisma.team.update({
                where: { id: team.id },
                data: { 
                    plan_id: plan.id
                }
            });
        }
    }

    // 3. Nuke Legacy Plans
    console.log("Cleaning up and deleting legacy plans (FREE, INDIVIDUAL_BASIC, INDIVIDUAL_PRO)...");
    const legacySlugs = ["FREE", "INDIVIDUAL_BASIC", "INDIVIDUAL_PRO"];
    for (const slug of legacySlugs) {
        try {
            await prisma.plan.delete({
                where: { slug: slug }
            });
            console.log(`Successfully nuked legacy plan: ${slug}`);
        } catch (e) {
            console.log(`Legacy plan ${slug} not found or could not be deleted.`);
        }
    }
    
    // Nuke any other weird string plans to make it completely clean
    const allPlans = await prisma.plan.findMany();
    for (const p of allPlans) {
        if (!Object.keys(SUBSCRIPTION_PLANS).includes(p.slug)) {
             try {
                 await prisma.plan.delete({ where: { id: p.id } });
                 console.log(`Nuked unrecognized plan: ${p.slug}`);
             } catch(e) { /* ignore */ }
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
