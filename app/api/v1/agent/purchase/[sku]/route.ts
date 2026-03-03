
import { NextResponse } from "next/server";
import { create402Challenge, validate402Payment } from "@/lib/surge-x402";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

const AGENT_OFFERINGS: Record<string, { price: string, resource: string }> = {
    "agent-inbound-sdr": { price: "199.00", resource: "https://agents.basalthq.com/deploy/inbound-sdr" },
    "agent-outbound-sdr": { price: "249.00", resource: "https://agents.basalthq.com/deploy/outbound-sdr" },
    "agent-customer-support": { price: "149.00", resource: "https://agents.basalthq.com/deploy/customer-support" },
    "agent-billing-specialist": { price: "179.00", resource: "https://agents.basalthq.com/deploy/billing-specialist" },
    "agent-appointment-setter": { price: "199.00", resource: "https://agents.basalthq.com/deploy/appointment-setter" }
};

export async function GET(req: Request, props: { params: Promise<{ sku: string }> }) {
    try {
        const params = await props.params;
        const rawSku = params.sku;

        if (!rawSku || rawSku === ":sku" || rawSku === "%3Asku" || rawSku === "[sku]" || rawSku === "%5Bsku%5D") {
            systemLogger.warn("[AgentAPI] Received literal placeholder for SKU instead of actual value.");
            return NextResponse.json({
                error: "Bad Request",
                message: "You must replace the ':sku' or '[sku]' placeholder with an actual SKU in your request URL.",
            }, { status: 400 });
        }

        const sku = rawSku.toLowerCase();

        systemLogger.info(`[AgentAPI] Purchase request for SKU: ${sku}`);

        // 1. Try AGENT_OFFERINGS first
        let service = AGENT_OFFERINGS[sku];

        // 2. Try Database if not found in predefined offerings
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

        // 3. Dynamic Fallback for known prefixes
        if (!service) {
            if (sku.startsWith("agent-")) {
                service = { price: "199.00", resource: `https://agents.basalthq.com/deploy/${sku.replace("agent-", "")}` };
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
                available_offerings: Object.keys(AGENT_OFFERINGS)
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
