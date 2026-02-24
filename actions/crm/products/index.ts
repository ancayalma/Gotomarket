"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProducts() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const products = await prismadb.crm_Products.findMany({
            where: {
                team_id: (session.user as any).team_id,
                active: true,
            },
            include: {
                bundles: {
                    include: {
                        childProduct: true
                    }
                }
            },
            orderBy: {
                name: "asc",
            },
        });

        return products;
    } catch (error) {
        console.error("[GET_PRODUCTS]", error);
        return [];
    }
}

export async function createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    price: number;
    costPrice?: number;
    taxRate?: number;
    category?: string;
    brand?: string;
    model?: string;
    stock?: number;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    isDigital?: boolean;
    tags?: string[];
    taxable?: boolean;
    jurisdictionCode?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.crm_Products.create({
            data: {
                ...data,
                team_id: (session.user as any).team_id,
            },
        });

        revalidatePath("/crm/products");
        return { success: true };
    } catch (error) {
        console.error("[CREATE_PRODUCT]", error);
        return { success: false };
    }
}

// Helper: push product data to Surge API
async function syncProductToSurge(product: any, apiKey: string) {
    try {
        const surgeBody = {
            id: product.surge_id || undefined,
            sku: product.sku,
            name: product.name,
            priceUsd: product.price,
            stockQty: product.stock,
            category: product.category || undefined,
            description: product.description || undefined,
            tags: product.tags,
            costUsd: product.costPrice || undefined,
            taxable: product.taxable,
            jurisdictionCode: product.jurisdictionCode || undefined,
            images: product.imageUrl ? [product.imageUrl] : undefined,
            attributes: product.attributes || undefined,
            industryPack: product.industryPack || undefined,
            currency: product.currency || "USD",
            wallet: product.ownerWallet || undefined,
            isBook: product.isBook || false,
            allowDownload: product.allowDownload || false,
            drmEnabled: product.drmEnabled || false
        };

        const response = await fetch("https://surge.basalthq.com/api/inventory", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": apiKey
            },
            body: JSON.stringify(surgeBody)
        });

        if (!response.ok) return null;

        const result = await response.json();

        // Store surge_id if this was a new push
        if (!product.surge_id && result.id) {
            await prismadb.crm_Products.update({
                where: { id: product.id },
                data: { surge_id: result.id }
            });
        }

        return result;
    } catch (error) {
        console.error("[SYNC_TO_SURGE]", error);
        return null;
    }
}

// Helper: push product data to Shopify Admin REST API
async function syncProductToShopify(product: any, storeUrl: string, accessToken: string) {
    try {
        const cleanUrl = storeUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

        const shopifyBody = {
            product: {
                id: product.shopify_id ? parseInt(product.shopify_id) : undefined,
                title: product.name,
                body_html: product.description || "",
                vendor: product.brand || undefined,
                product_type: product.category || undefined,
                tags: (product.tags || []).join(", "),
                variants: [{
                    price: product.price.toString(),
                    sku: product.sku,
                    inventory_quantity: product.stock,
                    weight: product.weight || 0,
                    taxable: product.taxable
                }]
            }
        };

        const method = product.shopify_id ? "PUT" : "POST";
        const endpoint = product.shopify_id
            ? `https://${cleanUrl}/admin/api/2024-01/products/${product.shopify_id}.json`
            : `https://${cleanUrl}/admin/api/2024-01/products.json`;

        const response = await fetch(endpoint, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken
            },
            body: JSON.stringify(shopifyBody)
        });

        if (!response.ok) return null;

        const result = await response.json();

        // Store shopify_id if this was a new push
        if (!product.shopify_id && result.product?.id) {
            await prismadb.crm_Products.update({
                where: { id: product.id },
                data: { shopify_id: result.product.id.toString() }
            });
        }

        return result;
    } catch (error) {
        console.error("[SYNC_TO_SHOPIFY]", error);
        return null;
    }
}

// Helper: push product data to WooCommerce REST API v3
async function syncProductToWooCommerce(product: any, storeUrl: string, consumerKey: string, consumerSecret: string) {
    try {
        const cleanUrl = storeUrl.replace(/\/$/, "");
        const authHeader = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

        const wooBody: any = {
            name: product.name,
            regular_price: product.price.toString(),
            description: product.description || "",
            short_description: product.description || "",
            sku: product.sku,
            stock_quantity: product.stock,
            manage_stock: true,
            weight: product.weight?.toString() || "",
            virtual: product.isDigital || false,
            tax_status: product.taxable ? "taxable" : "none",
            tags: (product.tags || []).map((t: string) => ({ name: t })),
            categories: product.category ? [{ name: product.category }] : []
        };

        const method = product.woo_id ? "PUT" : "POST";
        const endpoint = product.woo_id
            ? `${cleanUrl}/wp-json/wc/v3/products/${product.woo_id}`
            : `${cleanUrl}/wp-json/wc/v3/products`;

        const response = await fetch(endpoint, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(wooBody)
        });

        if (!response.ok) return null;

        const result = await response.json();

        // Store woo_id if this was a new push
        if (!product.woo_id && result.id) {
            await prismadb.crm_Products.update({
                where: { id: product.id },
                data: { woo_id: result.id.toString() }
            });
        }

        return result;
    } catch (error) {
        console.error("[SYNC_TO_WOOCOMMERCE]", error);
        return null;
    }
}

export async function updateProduct(productId: string, data: {
    name?: string;
    sku?: string;
    description?: string;
    price?: number;
    costPrice?: number;
    taxRate?: number;
    category?: string;
    brand?: string;
    model?: string;
    stock?: number;
    weight?: number;
    width?: number;
    height?: number;
    length?: number;
    isDigital?: boolean;
    imageUrl?: string;
    tags?: string[];
    taxable?: boolean;
    jurisdictionCode?: string;
    attributes?: any;
    industryPack?: string;
    currency?: string;
    ownerWallet?: string;
    isBook?: boolean;
    allowDownload?: boolean;
    drmEnabled?: boolean;
    isSubscription?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        const teamId = (session.user as any).team_id;

        const updated = await prismadb.crm_Products.update({
            where: { id: productId, team_id: teamId },
            data
        });

        // Fetch integration config once for all sync checks
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        const syncResults: string[] = [];

        // Auto-sync to Surge if linked
        if (updated.surge_id && integration?.surge_enabled && integration?.surge_api_key) {
            const result = await syncProductToSurge(updated, integration.surge_api_key);
            if (result) syncResults.push("Surge");
        }

        // Auto-sync to Shopify if linked
        if (updated.shopify_id && integration?.shopify_enabled && integration?.shopify_access_token && integration?.shopify_store_url) {
            const result = await syncProductToShopify(updated, integration.shopify_store_url, integration.shopify_access_token);
            if (result) syncResults.push("Shopify");
        }

        // Auto-sync to WooCommerce if linked
        if (updated.woo_id && integration?.woocommerce_enabled && integration?.woocommerce_consumer_key && integration?.woocommerce_consumer_secret && integration?.woocommerce_store_url) {
            const result = await syncProductToWooCommerce(updated, integration.woocommerce_store_url, integration.woocommerce_consumer_key, integration.woocommerce_consumer_secret);
            if (result) syncResults.push("WooCommerce");
        }

        revalidatePath("/crm/products");
        return { success: true, syncedTo: syncResults };
    } catch (error) {
        console.error("[UPDATE_PRODUCT]", error);
        return { success: false };
    }
}

export async function getSurgeTaxCatalog() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { jurisdictions: [] };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        if (!integration?.surge_enabled || !integration?.surge_api_key) {
            return { jurisdictions: [] };
        }

        const response = await fetch("https://surge.basalthq.com/api/tax/catalog", {
            headers: {
                "Ocp-Apim-Subscription-Key": integration.surge_api_key
            }
        });

        if (!response.ok) return { jurisdictions: [] };

        return await response.json();
    } catch (error) {
        console.error("[GET_SURGE_TAX]", error);
        return { jurisdictions: [] };
    }
}

export async function importFromSurge() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        if (!integration?.surge_enabled || !integration?.surge_api_key) {
            return { success: false, error: "Surge integration not configured" };
        }

        const response = await fetch("https://surge.basalthq.com/api/inventory", {
            headers: {
                "Ocp-Apim-Subscription-Key": integration.surge_api_key
            }
        });

        if (!response.ok) {
            throw new Error(`Surge API error: ${response.statusText}`);
        }

        const data = await response.json();
        const surgeItems = data.items || [];

        let importedCount = 0;
        let updatedCount = 0;

        for (const item of surgeItems) {
            const existingProduct = await prismadb.crm_Products.findFirst({
                where: {
                    OR: [
                        { surge_id: item.id },
                        { sku: item.sku }
                    ],
                    team_id: teamId
                }
            });

            if (existingProduct) {
                await prismadb.crm_Products.update({
                    where: { id: existingProduct.id },
                    data: {
                        name: item.name,
                        price: item.priceUsd,
                        description: item.description,
                        category: item.category,
                        stock: item.stockQty,
                        costPrice: item.costUsd,
                        tags: item.tags || [],
                        surge_id: item.id,
                        taxable: item.taxable ?? true,
                        jurisdictionCode: item.jurisdictionCode,
                        imageUrl: item.images?.[0] || undefined,
                        industryPack: item.industryPack || undefined,
                        attributes: item.attributes || undefined,
                        currency: item.currency || "USD",
                        ownerWallet: item.wallet || undefined,
                        isBook: item.isBook || false,
                        allowDownload: item.allowDownload || false,
                        drmEnabled: item.drmEnabled || false,
                    }
                });
                updatedCount++;
            } else {
                await prismadb.crm_Products.create({
                    data: {
                        name: item.name,
                        sku: item.sku,
                        price: item.priceUsd,
                        description: item.description,
                        category: item.category,
                        stock: item.stockQty,
                        costPrice: item.costUsd,
                        tags: item.tags || [],
                        surge_id: item.id,
                        taxable: item.taxable ?? true,
                        jurisdictionCode: item.jurisdictionCode,
                        imageUrl: item.images?.[0] || undefined,
                        industryPack: item.industryPack || undefined,
                        attributes: item.attributes || undefined,
                        currency: item.currency || "USD",
                        ownerWallet: item.wallet || undefined,
                        isBook: item.isBook || false,
                        allowDownload: item.allowDownload || false,
                        drmEnabled: item.drmEnabled || false,
                        team_id: teamId
                    }
                });
                importedCount++;
            }
        }

        revalidatePath("/crm/products");
        return { success: true, importedCount, updatedCount };
    } catch (error) {
        console.error("[IMPORT_FROM_SURGE]", error);
        return { success: false, error: "Failed to import from Surge" };
    }
}

export async function exportToSurge(productId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        if (!integration?.surge_enabled || !integration?.surge_api_key) {
            return { success: false, error: "Surge integration not configured" };
        }

        const product = await prismadb.crm_Products.findUnique({
            where: { id: productId, team_id: teamId }
        });

        if (!product) return { success: false, error: "Product not found" };

        const surgeBody = {
            id: product.surge_id || undefined,
            sku: product.sku,
            name: product.name,
            priceUsd: product.price,
            stockQty: product.stock,
            category: product.category || undefined,
            description: product.description || undefined,
            tags: product.tags,
            costUsd: product.costPrice || undefined,
            taxable: product.taxable,
            jurisdictionCode: product.jurisdictionCode || undefined
        };

        const response = await fetch("https://surge.basalthq.com/api/inventory", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": integration.surge_api_key
            },
            body: JSON.stringify(surgeBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Surge API error: ${response.statusText}`);
        }

        const result = await response.json();

        // Update product with surge_id if it was a new creation
        if (!product.surge_id && result.id) {
            await prismadb.crm_Products.update({
                where: { id: product.id },
                data: { surge_id: result.id }
            });
        }

        revalidatePath("/crm/products");
        return { success: true };
    } catch (error) {
        console.error("[EXPORT_TO_SURGE]", error);
        return { success: false, error: "Failed to export to Surge" };
    }
}

// Returns which e-commerce integrations are enabled (no secrets exposed)
export async function getEnabledIntegrations() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { surge: false, shopify: false, woocommerce: false };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        return {
            surge: !!(integration?.surge_enabled && integration?.surge_api_key),
            shopify: !!(integration?.shopify_enabled && integration?.shopify_access_token),
            woocommerce: !!(integration?.woocommerce_enabled && integration?.woocommerce_consumer_key),
        };
    } catch (error) {
        console.error("[GET_ENABLED_INTEGRATIONS]", error);
        return { surge: false, shopify: false, woocommerce: false };
    }
}

export async function importFromShopify() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        if (!integration?.shopify_enabled || !integration?.shopify_access_token || !integration?.shopify_store_url) {
            return { success: false, error: "Shopify integration not configured. Go to Admin → Integrations to set it up." };
        }

        // Shopify Admin REST API — GET products
        const storeUrl = integration.shopify_store_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const response = await fetch(`https://${storeUrl}/admin/api/2024-01/products.json?limit=250`, {
            headers: {
                "X-Shopify-Access-Token": integration.shopify_access_token
            }
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => "");
            throw new Error(`Shopify API error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const shopifyProducts = data.products || [];

        let importedCount = 0;
        let updatedCount = 0;

        for (const item of shopifyProducts) {
            const sku = item.variants?.[0]?.sku || `shopify-${item.id}`;
            const price = parseFloat(item.variants?.[0]?.price || "0");
            const stock = item.variants?.[0]?.inventory_quantity || 0;
            const weight = item.variants?.[0]?.weight ? parseFloat(item.variants[0].weight) : undefined;
            const tags = item.tags ? item.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
            const imageUrl = item.image?.src || item.images?.[0]?.src || undefined;

            const existingProduct = await prismadb.crm_Products.findFirst({
                where: {
                    OR: [{ sku }],
                    team_id: teamId
                }
            });

            if (existingProduct) {
                await prismadb.crm_Products.update({
                    where: { id: existingProduct.id },
                    data: {
                        name: item.title,
                        price,
                        description: item.body_html?.replace(/<[^>]*>/g, "") || undefined,
                        category: item.product_type || undefined,
                        brand: item.vendor || undefined,
                        stock,
                        weight,
                        tags,
                        taxable: item.variants?.[0]?.taxable ?? true,
                        shopify_id: item.id.toString(),
                        imageUrl,
                    }
                });
                updatedCount++;
            } else {
                await prismadb.crm_Products.create({
                    data: {
                        name: item.title,
                        sku,
                        price,
                        description: item.body_html?.replace(/<[^>]*>/g, "") || undefined,
                        category: item.product_type || undefined,
                        brand: item.vendor || undefined,
                        stock,
                        weight,
                        tags,
                        taxable: item.variants?.[0]?.taxable ?? true,
                        shopify_id: item.id.toString(),
                        imageUrl,
                        team_id: teamId
                    }
                });
                importedCount++;
            }
        }

        revalidatePath("/crm/products");
        return { success: true, importedCount, updatedCount };
    } catch (error) {
        console.error("[IMPORT_FROM_SHOPIFY]", error);
        return { success: false, error: "Failed to import from Shopify" };
    }
}

export async function importFromWooCommerce() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const teamId = (session.user as any).team_id;
        const integration = await prismadb.tenant_Integrations.findUnique({
            where: { tenant_id: teamId }
        });

        if (!integration?.woocommerce_enabled || !integration?.woocommerce_consumer_key || !integration?.woocommerce_consumer_secret || !integration?.woocommerce_store_url) {
            return { success: false, error: "WooCommerce integration not configured. Go to Admin → Integrations to set it up." };
        }

        // WooCommerce REST API v3 — Basic Auth
        const storeUrl = integration.woocommerce_store_url.replace(/\/$/, "");
        const authHeader = "Basic " + Buffer.from(`${integration.woocommerce_consumer_key}:${integration.woocommerce_consumer_secret}`).toString("base64");

        const response = await fetch(`${storeUrl}/wp-json/wc/v3/products?per_page=100`, {
            headers: {
                "Authorization": authHeader
            }
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => "");
            throw new Error(`WooCommerce API error (${response.status}): ${errBody}`);
        }

        const wooProducts = await response.json();

        let importedCount = 0;
        let updatedCount = 0;

        for (const item of wooProducts) {
            const sku = item.sku || `woo-${item.id}`;
            const price = parseFloat(item.price || item.regular_price || "0");
            const stock = item.stock_quantity || 0;
            const weight = item.weight ? parseFloat(item.weight) : undefined;
            const tags = item.tags?.map((t: any) => t.name) || [];
            const category = item.categories?.[0]?.name || undefined;
            const isDigital = item.virtual || item.downloadable || false;
            const imageUrl = item.images?.[0]?.src || undefined;

            const existingProduct = await prismadb.crm_Products.findFirst({
                where: {
                    OR: [{ sku }],
                    team_id: teamId
                }
            });

            if (existingProduct) {
                await prismadb.crm_Products.update({
                    where: { id: existingProduct.id },
                    data: {
                        name: item.name,
                        price,
                        description: item.short_description?.replace(/<[^>]*>/g, "") || item.description?.replace(/<[^>]*>/g, "") || undefined,
                        category,
                        stock,
                        weight,
                        tags,
                        isDigital,
                        taxable: item.tax_status === "taxable",
                        woo_id: item.id.toString(),
                        imageUrl,
                    }
                });
                updatedCount++;
            } else {
                await prismadb.crm_Products.create({
                    data: {
                        name: item.name,
                        sku,
                        price,
                        description: item.short_description?.replace(/<[^>]*>/g, "") || item.description?.replace(/<[^>]*>/g, "") || undefined,
                        category,
                        stock,
                        weight,
                        tags,
                        isDigital,
                        taxable: item.tax_status === "taxable",
                        woo_id: item.id.toString(),
                        imageUrl,
                        team_id: teamId
                    }
                });
                importedCount++;
            }
        }

        revalidatePath("/crm/products");
        return { success: true, importedCount, updatedCount };
    } catch (error) {
        console.error("[IMPORT_FROM_WOOCOMMERCE]", error);
        return { success: false, error: "Failed to import from WooCommerce" };
    }
}
