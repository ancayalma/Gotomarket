/**
 * Stripe Product & Price Seeder
 * 
 * Creates Stripe Products and Prices for all CRM subscription plans
 * and the AI Token Top-Up package. Outputs the price IDs to be stored
 * in the environment.
 * 
 * Usage:
 *   npx tsx scripts/seed-stripe.ts
 * 
 * Idempotent: Searches for existing products by metadata before creating new ones.
 */

import "dotenv/config";
import Stripe from "stripe";

const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
if (!STRIPE_API_KEY) {
    console.error("❌ STRIPE_API_KEY is not set in .env");
    process.exit(1);
}

const stripe = new Stripe(STRIPE_API_KEY, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
});

// ---------------------------------------------------------------------------
// Plan Definitions (mirrors config/subscriptions.ts)
// ---------------------------------------------------------------------------

const PLANS = [
    {
        slug: "INDIVIDUAL_BASIC",
        name: "Basalt CRM — Individual Basic",
        description: "Essential CRM with AI-powered tools. 2 users, 5M AI tokens/month.",
        monthlyPrice: 5000,   // $50.00 in cents
        annualPrice: 48000,   // $480.00 in cents ($40/mo with 20% discount)
    },
    {
        slug: "INDIVIDUAL_PRO",
        name: "Basalt CRM — Individual Pro",
        description: "Full-featured CRM for growing teams. 4 users, 20M AI tokens/month.",
        monthlyPrice: 15000,  // $150.00 in cents
        annualPrice: 144000,  // $1,440.00 in cents ($120/mo with 20% discount)
    },
];

const TOPUP = {
    slug: "AI_TOKEN_TOPUP",
    name: "AI Token Top-Up — 6M Tokens",
    description: "One-time purchase of 6,000,000 additional AI tokens for your team.",
    price: 999,  // $9.99 in cents
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findExistingProduct(slug: string): Promise<Stripe.Product | null> {
    // Search by metadata.slug
    const products = await stripe.products.search({
        query: `metadata["slug"]:"${slug}"`,
    });
    return products.data[0] || null;
}

async function findExistingPrice(productId: string, interval?: string): Promise<Stripe.Price | null> {
    const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10,
    });

    if (!interval) {
        // One-time price
        return prices.data.find(p => !p.recurring) || null;
    }

    return prices.data.find(p => p.recurring?.interval === interval) || null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log("🔧 Stripe Product & Price Seeder");
    console.log("=".repeat(60));

    const envLines: string[] = [];

    // ── Subscription Plans ─────────────────────────────────────

    for (const plan of PLANS) {
        console.log(`\n📦 ${plan.name}`);

        // Find or create product
        let product = await findExistingProduct(plan.slug);
        if (product) {
            console.log(`   ✅ Product exists: ${product.id}`);
            // Update name/description if changed
            product = await stripe.products.update(product.id, {
                name: plan.name,
                description: plan.description,
            });
        } else {
            product = await stripe.products.create({
                name: plan.name,
                description: plan.description,
                metadata: { slug: plan.slug },
            });
            console.log(`   ✨ Created product: ${product.id}`);
        }

        // Monthly price
        let monthlyPrice = await findExistingPrice(product.id, "month");
        if (monthlyPrice) {
            console.log(`   ✅ Monthly price exists: ${monthlyPrice.id} ($${(monthlyPrice.unit_amount || 0) / 100}/mo)`);
            // If price changed, deactivate old and create new
            if (monthlyPrice.unit_amount !== plan.monthlyPrice) {
                await stripe.prices.update(monthlyPrice.id, { active: false });
                monthlyPrice = await stripe.prices.create({
                    product: product.id,
                    currency: "usd",
                    unit_amount: plan.monthlyPrice,
                    recurring: { interval: "month" },
                    metadata: { slug: plan.slug, interval: "monthly" },
                });
                console.log(`   🔄 Updated monthly price: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`);
            }
        } else {
            monthlyPrice = await stripe.prices.create({
                product: product.id,
                currency: "usd",
                unit_amount: plan.monthlyPrice,
                recurring: { interval: "month" },
                metadata: { slug: plan.slug, interval: "monthly" },
            });
            console.log(`   ✨ Created monthly price: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`);
        }

        // Annual price
        let annualPrice = await findExistingPrice(product.id, "year");
        if (annualPrice) {
            console.log(`   ✅ Annual price exists: ${annualPrice.id} ($${(annualPrice.unit_amount || 0) / 100}/yr)`);
            if (annualPrice.unit_amount !== plan.annualPrice) {
                await stripe.prices.update(annualPrice.id, { active: false });
                annualPrice = await stripe.prices.create({
                    product: product.id,
                    currency: "usd",
                    unit_amount: plan.annualPrice,
                    recurring: { interval: "year" },
                    metadata: { slug: plan.slug, interval: "annual" },
                });
                console.log(`   🔄 Updated annual price: ${annualPrice.id} ($${plan.annualPrice / 100}/yr)`);
            }
        } else {
            annualPrice = await stripe.prices.create({
                product: product.id,
                currency: "usd",
                unit_amount: plan.annualPrice,
                recurring: { interval: "year" },
                metadata: { slug: plan.slug, interval: "annual" },
            });
            console.log(`   ✨ Created annual price: ${annualPrice.id} ($${plan.annualPrice / 100}/yr)`);
        }

        const slugUpper = plan.slug.toUpperCase();
        envLines.push(`STRIPE_PRICE_${slugUpper}_MONTHLY=${monthlyPrice.id}`);
        envLines.push(`STRIPE_PRICE_${slugUpper}_ANNUAL=${annualPrice.id}`);
    }

    // ── AI Token Top-Up ────────────────────────────────────────

    console.log(`\n📦 ${TOPUP.name}`);

    let topupProduct = await findExistingProduct(TOPUP.slug);
    if (topupProduct) {
        console.log(`   ✅ Product exists: ${topupProduct.id}`);
        topupProduct = await stripe.products.update(topupProduct.id, {
            name: TOPUP.name,
            description: TOPUP.description,
        });
    } else {
        topupProduct = await stripe.products.create({
            name: TOPUP.name,
            description: TOPUP.description,
            metadata: { slug: TOPUP.slug },
        });
        console.log(`   ✨ Created product: ${topupProduct.id}`);
    }

    let topupPrice = await findExistingPrice(topupProduct.id);
    if (topupPrice) {
        console.log(`   ✅ Price exists: ${topupPrice.id} ($${(topupPrice.unit_amount || 0) / 100})`);
        if (topupPrice.unit_amount !== TOPUP.price) {
            await stripe.prices.update(topupPrice.id, { active: false });
            topupPrice = await stripe.prices.create({
                product: topupProduct.id,
                currency: "usd",
                unit_amount: TOPUP.price,
                metadata: { slug: TOPUP.slug, type: "one_time" },
            });
            console.log(`   🔄 Updated price: ${topupPrice.id} ($${TOPUP.price / 100})`);
        }
    } else {
        topupPrice = await stripe.prices.create({
            product: topupProduct.id,
            currency: "usd",
            unit_amount: TOPUP.price,
            metadata: { slug: TOPUP.slug, type: "one_time" },
        });
        console.log(`   ✨ Created price: ${topupPrice.id} ($${TOPUP.price / 100})`);
    }

    envLines.push(`STRIPE_PRICE_AI_TOPUP=${topupPrice.id}`);

    // ── Summary ────────────────────────────────────────────────

    console.log("\n" + "=".repeat(60));
    console.log("✅ Done! Add these to your .env:\n");
    console.log(envLines.join("\n"));
    console.log("\n" + "=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
