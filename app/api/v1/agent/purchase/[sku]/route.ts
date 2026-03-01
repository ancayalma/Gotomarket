
import { NextResponse } from "next/server";
import { create402Challenge, validate402Payment } from "@/lib/surge-x402";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

const MOCK_SERVICES: Record<string, { price: string, resource: string }> = {
    "service-consulting-1h": { price: "150.00", resource: "https://cal.com/meeting-link" },
    "service-api-access-mo": { price: "49.99", resource: "sk_live_agent_key_xyz" },
    "data-contact-enrichment": { price: "25.00", resource: "{ enriched_data: [] }" },
    "agent-sdr-01": { price: "99.00", resource: "https://agents.basalthq.com/deploy/sdr-01" },
    "agent-csm-x": { price: "79.00", resource: "https://agents.basalthq.com/deploy/csm-x" },
    "agent-data-9": { price: "49.00", resource: "https://agents.basalthq.com/deploy/data-9" },
    "agent-ae-prime": { price: "149.00", resource: "https://agents.basalthq.com/deploy/ae-prime" }
};

export async function GET(req: Request, props: { params: Promise<{ sku: string }> }) {
    try {
        const params = await props.params;
        const rawSku = params.sku;
        const sku = rawSku.toLowerCase();

        systemLogger.info(`[AgentAPI] Purchase request for SKU: ${sku}`);

        if (sku === ":sku") {
            systemLogger.warn(`[AgentAPI] User attempted to use literal :sku placeholder`);
            return NextResponse.json({
                error: "Invalid SKU",
                message: "You are using the ':sku' placeholder. Please replace it with a real SKU from the catalog.",
                hint: "Try /api/v1/agent/purchase/agent-sdr-01",
                available_mocks: Object.keys(MOCK_SERVICES)
            }, { status: 400 });
        }

        // 1. Try MOCK_SERVICES first
        let service = MOCK_SERVICES[sku];

        // 2. Try Database if not found in mock
        if (!service) {
            const dbProduct = await prismadb.crm_Products.findUnique({
                where: { sku: sku }
            });

            if (dbProduct) {
                service = {
                    price: dbProduct.price.toString(),
                    resource: dbProduct.description || `product_resource_${dbProduct.id}`
                };
            }
        }

        // 3. Dynamic Fallback for known prefixes to prevent 404s in deployment flows
        if (!service) {
            if (sku.startsWith("agent-")) {
                service = { price: "99.00", resource: `https://agents.basalthq.com/deploy/${sku.replace("agent-", "")}` };
                systemLogger.info(`[AgentAPI] Using dynamic fallback for agent SKU: ${sku}`);
            } else if (sku.startsWith("service-")) {
                service = { price: "49.99", resource: `https://api.basalthq.com/access/${sku}` };
                systemLogger.info(`[AgentAPI] Using dynamic fallback for service SKU: ${sku}`);
            }
        }

        if (!service) {
            systemLogger.warn(`[AgentAPI] SKU not found: ${sku}`);
            return NextResponse.json({
                error: "Service Not Found",
                message: `The requested SKU '${sku}' does not exist in the catalog.`,
                available_mocks: Object.keys(MOCK_SERVICES)
            }, { status: 404 });
        }

        // 0. Fetch Merchant Wallet for the challenge
        const integration = await prismadb.tenant_Integrations.findFirst({
            where: { surge_enabled: true }
        });

        const merchantWallet = integration?.surge_merchant_id || "0x_merchant_wallet_missing";

        // 1. Check for Payment Authorization Header
        const authHeader = req.headers.get("Authorization") || "";
        const isPayment = authHeader.startsWith("Payment ");

        let paymentValid = false;

        if (isPayment) {
            const proof = authHeader.replace("Payment ", "");
            paymentValid = await validate402Payment(proof, service.price, merchantWallet);
        }

        if (paymentValid) {
            // 2. Determine Action based on SKU
            return NextResponse.json({
                success: true,
                message: "Payment Accepted",
                resource: service.resource
            });
        }

        // 3. If No Payment or Invalid: Return 402 Challenge
        const challenge = create402Challenge("tenant_default", service.price, sku);
        if (challenge) challenge.recipient = merchantWallet;

        return NextResponse.json(challenge, {
            status: 402,
            headers: {
                "WWW-Authenticate": `Payment token="usdc", amount="${service.price}", network="base", recipient="${merchantWallet}"`
            }
        });

    } catch (error: any) {
        systemLogger.error("[AgentAPI] Purchase Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ sku: string }> }) {
    return GET(req, props);
}
