import { prismadb } from "./lib/prisma";

async function checkProduct() {
    const products = await prismadb.crm_Products.findMany({
        where: {
            surge_id: { not: null }
        }
    });
    console.log("Recent Surge Products:");
    products.forEach(p => {
        console.log(`- ${p.name} (SKU: ${p.sku}): Pack: ${p.industryPack}, Attrs Keys: ${Object.keys(p.attributes || {}).join(", ")}`);
    });
    process.exit(0);
}

checkProduct();
