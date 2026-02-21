
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const integration = await prisma.tenant_Integrations.findFirst();
    console.log("Integration Count:", await prisma.tenant_Integrations.count());
    if (integration) {
        console.log("Surge Enabled:", integration.surge_enabled);
        console.log("Surge API Key Present:", !!integration.surge_api_key);
        console.log("Surge Merchant ID:", integration.surge_merchant_id);
    } else {
        console.log("No integrations found in DB.");
    }
    console.log("ENV SURGE_API_KEY Present:", !!process.env.SURGE_API_KEY);
    console.log("ENV SURGE_MERCHANT_ID Present:", !!process.env.SURGE_MERCHANT_ID);
}

main().catch(console.error).finally(() => prisma.$disconnect());
