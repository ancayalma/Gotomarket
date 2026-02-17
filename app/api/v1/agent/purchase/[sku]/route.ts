
import { NextResponse } from "next/server";
import { create402Challenge, validate402Payment } from "@/lib/surge-x402";
import { prismadb } from "@/lib/prisma";

const MOCK_SERVICES: Record<string, { price: string, resource: string }> = {
    "service-consulting-1h": { price: "150.00", resource: "https://cal.com/meeting-link" },
    "service-api-access-mo": { price: "49.99", resource: "sk_live_agent_key_xyz" },
    "data-contact-enrichment": { price: "25.00", resource: "{ enriched_data: [] }" }
};

export async function GET(req: Request, props: { params: Promise<{ sku: string }> }) {
    try {
        const params = await props.params;
        const rawSku = params.sku;
        const sku = rawSku.toLowerCase();

        console.log(`[AgentAPI] Purchase request for SKU: ${sku}`);

        if (sku === ":sku") {
            return NextResponse.json({
                error: "Invalid SKU",
                message: "You are using the ':sku' placeholder. Please replace it with a real SKU from the catalog.",
                hint: "Try /api/v1/agent/purchase/service-consulting-1h",
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

        if (!service) {
            console.warn(`[AgentAPI] SKU not found: ${sku}`);
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
        console.error("[AgentAPI] Purchase Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ sku: string }> }) {
    return GET(req, props);
}
