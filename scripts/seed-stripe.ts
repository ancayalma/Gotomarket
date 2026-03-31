/**
 * Stripe Product & Price Seeder
 * 
 * Creates Stripe Products and Prices for all CRM subscription plans
 * and the AI Token Top-Up package. Outputs the price IDs to be stored
 * in the environment.
 * 
 * Usage:
 *   npx tsx scripts/seed-stripe.ts          # Create/update products & prices
 *   npx tsx scripts/seed-stripe.ts --wipe   # Archive old products, then recreate
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
        slug: "GROWTH",
        name: "Basalt CRM — Growth",
        description: "CRM for growing teams. 5 users, 5M AI tokens/month, 5,000 emails/month.",
        monthlyPrice: 2900,    // $29.00 in cents
        annualPrice: 27840,    // $278.40 in cents ($23.20/mo with 20% discount)
    },
    {
        slug: "SCALE",
        name: "Basalt CRM — Scale",
        description: "Full-featured CRM with SMS, voice & unlimited forms. 10 users, 20M AI tokens/month.",
        monthlyPrice: 7900,    // $79.00 in cents
        annualPrice: 75840,    // $758.40 in cents ($63.20/mo with 20% discount)
    },
];

const TOPUP = {
    slug: "AI_TOKEN_TOPUP",
    name: "AI Token Top-Up — 6M Tokens",
    description: "One-time purchase of 6,000,000 additional AI tokens for your team.",
    price: 999,  // $9.99 in cents
};

// Legacy slugs that should be deactivated during --wipe
const LEGACY_SLUGS = ["INDIVIDUAL_BASIC", "INDIVIDUAL_PRO", "BASIC", "PRO", "FREE"];

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

async function archiveProduct(slug: string) {
    const product = await findExistingProduct(slug);
    if (!product) return;

    // Deactivate all prices
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
    for (const price of prices.data) {
        await stripe.prices.update(price.id, { active: false });
        console.log(`   🗑️  Deactivated price: ${price.id}`);
    }

    // Archive the product
    await stripe.products.update(product.id, { active: false });
    console.log(`   🗑️  Archived product: ${product.id} (${slug})`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const isWipe = process.argv.includes("--wipe");

    console.log("🔧 Stripe Product & Price Seeder");
    if (isWipe) console.log("⚠️  WIPE MODE: Archiving old products first");
    console.log("=".repeat(60));

    // ── Wipe Mode: Archive legacy and current products ──────────
    if (isWipe) {
        console.log("\n🗑️  Archiving legacy products...");
        for (const slug of LEGACY_SLUGS) {
            await archiveProduct(slug);
        }

        console.log("\n🗑️  Archiving current products (will be recreated)...");
        for (const plan of PLANS) {
            await archiveProduct(plan.slug);
        }
        await archiveProduct(TOPUP.slug);

        console.log("\n✅ Archive complete. Recreating fresh products...\n");
    }

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
                active: true,
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

        envLines.push(`STRIPE_PRICE_${plan.slug}_MONTHLY=${monthlyPrice.id}`);
        envLines.push(`STRIPE_PRICE_${plan.slug}_ANNUAL=${annualPrice.id}`);
    }

    // ── AI Token Top-Up ────────────────────────────────────────

    console.log(`\n📦 ${TOPUP.name}`);

    let topupProduct = await findExistingProduct(TOPUP.slug);
    if (topupProduct) {
        console.log(`   ✅ Product exists: ${topupProduct.id}`);
        topupProduct = await stripe.products.update(topupProduct.id, {
            name: TOPUP.name,
            description: TOPUP.description,
            active: true,
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
