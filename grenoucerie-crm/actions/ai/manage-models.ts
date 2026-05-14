
"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";
import { systemLogger } from "@/lib/logger";

// ============================================================================
// MODEL PRICING UPDATE (existing)
// ============================================================================

export const updateModelPricing = async (formData: FormData) => {
    const id = formData.get("id") as string;
    const inputPrice = parseFloat(formData.get("inputPrice") as string);
    const outputPrice = parseFloat(formData.get("outputPrice") as string);
    const isActive = formData.get("isActive") === "on";
    const isDefault = formData.get("isDefault") === "on";

    const defaultMarkup = parseFloat(formData.get("defaultMarkup") as string);
    const maxContext = parseInt(formData.get("maxContext") as string);

    if (isDefault) {
        const model = await prismadb.aiModel.findUnique({ where: { id } });
        if (model) {
            await prismadb.aiModel.updateMany({
                where: { provider: model.provider, isDefault: true },
                data: { isDefault: false }
            });
        }
    }

    await prismadb.aiModel.update({
        where: { id },
        data: {
            inputPrice,
            outputPrice,
            defaultMarkup,
            maxContext,
            isActive,
            isDefault
        }
    });

    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-setup");
    revalidatePath("/partners/ai-system-config");
};

// ============================================================================
// PROVIDER REGISTRY CRUD (Platform Admin only)
// ============================================================================

export const createAiProvider = async (formData: FormData) => {
    const slug = (formData.get("slug") as string).toUpperCase().replace(/\s+/g, "_");
    const name = formData.get("name") as string;
    const sdkType = (formData.get("sdkType") as string) || "OPENAI_COMPATIBLE";
    const baseUrl = formData.get("baseUrl") as string || null;
    const apiKeyUrl = formData.get("apiKeyUrl") as string || null;
    const color = formData.get("color") as string || "text-gray-400";
    const gradient = formData.get("gradient") as string || "from-gray-500/20 to-slate-500/20";
    const description = formData.get("description") as string || null;
    const createdBy = formData.get("createdBy") as string || null;

    const existing = await prismadb.aiProviderRegistry.findUnique({ where: { slug } });
    if (existing) throw new Error(`Provider with slug "${slug}" already exists`);

    await prismadb.aiProviderRegistry.create({
        data: {
            slug, name, sdkType, baseUrl, apiKeyUrl, color, gradient,
            description, createdBy, isBuiltIn: false,
        }
    });

    revalidatePath("/partners/ai-system-config");
    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-settings");
};

export const updateAiProvider = async (formData: FormData) => {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const sdkType = formData.get("sdkType") as string;
    const baseUrl = formData.get("baseUrl") as string || null;
    const apiKeyUrl = formData.get("apiKeyUrl") as string || null;
    const isActive = formData.get("isActive") === "on";

    await prismadb.aiProviderRegistry.update({
        where: { id },
        data: { name, sdkType, baseUrl, apiKeyUrl, isActive }
    });

    revalidatePath("/partners/ai-system-config");
    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-settings");
};

export const deleteAiProvider = async (id: string) => {
    // Safety: Don't delete built-in providers
    const provider = await prismadb.aiProviderRegistry.findUnique({ where: { id } });
    if (provider?.isBuiltIn) throw new Error("Cannot delete built-in providers");

    // Soft delete
    await prismadb.aiProviderRegistry.update({
        where: { id },
        data: { isActive: false }
    });

    revalidatePath("/partners/ai-system-config");
    revalidatePath("/partners/ai-pricing");
};

// ============================================================================
// AI MODEL CRUD (Platform Admin only)
// ============================================================================

export const createAiModel = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const modelId = formData.get("modelId") as string;
    const provider = formData.get("provider") as string;
    const description = formData.get("description") as string || null;
    const inputPrice = parseFloat(formData.get("inputPrice") as string) || 0;
    const outputPrice = parseFloat(formData.get("outputPrice") as string) || 0;
    const maxContext = parseInt(formData.get("maxContext") as string) || 128000;
    const defaultMarkup = parseFloat(formData.get("defaultMarkup") as string) || 20;
    const isActive = formData.get("isActive") !== "off";

    await prismadb.aiModel.create({
        data: {
            name, modelId, provider, description,
            inputPrice, outputPrice, maxContext, defaultMarkup,
            isActive, isDefault: false,
        }
    });

    revalidatePath("/partners/ai-pricing");
    revalidatePath("/partners/ai-system-config");
    revalidatePath("/admin/ai-settings");
};

export const toggleAiModelStatus = async (id: string, isActive: boolean) => {
    await prismadb.aiModel.update({
        where: { id },
        data: { isActive }
    });
    revalidatePath("/partners/ai-pricing");
    revalidatePath("/partners/ai-system-config");
    revalidatePath("/admin/ai-settings");
};

export const deleteAiModel = async (id: string) => {
    await prismadb.aiModel.update({
        where: { id },
        data: { isActive: false }
    });

    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-settings");
};

// ============================================================================
// CUSTOM MODEL REQUESTS (Team Admin → Platform Admin approval flow)
// ============================================================================

export const submitCustomModelRequest = async (formData: FormData) => {
    const provider = formData.get("provider") as string;
    const modelId = formData.get("modelId") as string;
    const displayName = formData.get("displayName") as string;
    const baseUrl = formData.get("baseUrl") as string || null;
    const description = formData.get("description") as string || null;
    const team_id = formData.get("team_id") as string;
    const requested_by = formData.get("requested_by") as string;
    const team_name = formData.get("team_name") as string || null;

    const request = await prismadb.customModelRequest.create({
        data: {
            provider, modelId, displayName, baseUrl, description,
            team_id, requested_by, team_name, status: "PENDING",
        }
    });

    // ─── Internal CRM Notifications for platform admins ───
    try {
        const platformAdmins = await prismadb.users.findMany({
            where: { is_admin: true },
            select: { id: true },
        });

        if (platformAdmins.length > 0) {
            await prismadb.notification.createMany({
                data: (platformAdmins as any[]).map(admin => ({
                    userId: admin.id,
                    title: "New Custom Model Request",
                    message: `${team_name || "A team"} requested model "${displayName}" (${modelId}) from ${provider}.`,
                    type: "APPROVAL",
                    link: "/partners/ai-system-config",
                    team_id: team_id || null,
                })),
            });
        }
    } catch (notifErr) {
        systemLogger.error("[MODEL_REQUEST] Failed to create notifications:", notifErr);
    }

    // ─── Email to support@basalthq.com ───
    try {
        const requesterUser = requested_by
            ? await prismadb.users.findUnique({ where: { id: requested_by }, select: { name: true, email: true } })
            : null;

        await sendEmail({
            to: "support@basalthq.com",
            from: process.env.EMAIL_FROM,
            replyTo: requesterUser?.email || undefined,
            subject: `🤖 Custom Model Request: ${displayName} (${provider})`,
            text: [
                `New custom AI model request submitted.`,
                ``,
                `Model: ${displayName}`,
                `Model ID: ${modelId}`,
                `Provider: ${provider}`,
                baseUrl ? `Base URL: ${baseUrl}` : null,
                description ? `Reason: ${description}` : null,
                ``,
                `Team: ${team_name || team_id}`,
                requesterUser ? `Requested by: ${requesterUser.name || ""} (${requesterUser.email || ""})` : null,
                ``,
                `Review this request at: ${process.env.NEXT_PUBLIC_APP_URL || "https://app.basalthq.com"}/partners/ai-system-config`,
            ].filter(Boolean).join("\n"),
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #7c3aed22, #6d28d922); padding: 24px 28px; border-bottom: 1px solid #27272a;">
                        <h2 style="margin: 0; color: #f4f4f5; font-size: 18px;">🤖 Custom Model Request</h2>
                        <p style="margin: 6px 0 0; color: #a1a1aa; font-size: 13px;">A team has requested a new AI model</p>
                    </div>
                    <div style="padding: 24px 28px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Model</td><td style="padding: 8px 0; color: #f4f4f5; font-weight: 600;">${displayName}</td></tr>
                            <tr><td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Model ID</td><td style="padding: 8px 0; color: #a1a1aa; font-family: monospace;">${modelId}</td></tr>
                            <tr><td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Provider</td><td style="padding: 8px 0; color: #f4f4f5;">${provider}</td></tr>
                            ${baseUrl ? `<tr><td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Base URL</td><td style="padding: 8px 0; color: #a1a1aa; font-family: monospace; font-size: 12px;">${baseUrl}</td></tr>` : ""}
                            <tr style="border-top: 1px solid #27272a;"><td style="padding: 12px 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Team</td><td style="padding: 12px 0 8px; color: #f4f4f5;">${team_name || team_id}</td></tr>
                            ${requesterUser ? `<tr><td style="padding: 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Requester</td><td style="padding: 8px 0; color: #f4f4f5;">${requesterUser.name || ""} <span style="color: #71717a;">(${requesterUser.email || ""})</span></td></tr>` : ""}
                        </table>
                        ${description ? `<div style="margin-top: 16px; padding: 12px 16px; background: #18181b; border: 1px solid #27272a; border-radius: 8px;"><p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5;"><strong style="color: #71717a;">Reason:</strong> ${description}</p></div>` : ""}
                        <div style="margin-top: 24px; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.basalthq.com"}/partners/ai-system-config" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">Review Request →</a>
                        </div>
                    </div>
                    <div style="padding: 16px 28px; background: #09090b; border-top: 1px solid #18181b; text-align: center;">
                        <p style="margin: 0; color: #52525b; font-size: 11px;">BasaltHQ · AI Model Management</p>
                    </div>
                </div>
            `,
        });
    } catch (emailErr) {
        systemLogger.error("[MODEL_REQUEST] Failed to send email:", emailErr);
    }

    revalidatePath("/partners/ai-system-config");
    revalidatePath("/admin/ai-settings");
};

export const reviewCustomModelRequest = async (formData: FormData) => {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string; // "APPROVED" or "REJECTED"
    const reviewed_by = formData.get("reviewed_by") as string;
    const review_notes = formData.get("review_notes") as string || null;

    const request = await prismadb.customModelRequest.findUnique({ where: { id } });
    if (!request) throw new Error("Request not found");

    await prismadb.customModelRequest.update({
        where: { id },
        data: {
            status,
            reviewed_by,
            reviewed_at: new Date(),
            review_notes,
        }
    });

    // If approved, create the model in the global registry
    if (status === "APPROVED") {
        // Check if model already exists
        const existing = await prismadb.aiModel.findFirst({
            where: { modelId: request.modelId, provider: request.provider }
        });

        if (!existing) {
            await prismadb.aiModel.create({
                data: {
                    name: request.displayName,
                    modelId: request.modelId,
                    provider: request.provider,
                    description: request.description,
                    isActive: true,
                    isDefault: false,
                    inputPrice: 0,
                    outputPrice: 0,
                    maxContext: 128000,
                    defaultMarkup: 20,
                }
            });
        }

        // Ensure the provider exists in registry (if it's a new custom one)
        const providerExists = await prismadb.aiProviderRegistry.findUnique({
            where: { slug: request.provider.toUpperCase().replace(/\s+/g, "_") }
        });

        if (!providerExists && request.baseUrl) {
            await prismadb.aiProviderRegistry.create({
                data: {
                    slug: request.provider.toUpperCase().replace(/\s+/g, "_"),
                    name: request.provider,
                    sdkType: "OPENAI_COMPATIBLE",
                    baseUrl: request.baseUrl,
                    isBuiltIn: false,
                }
            });
        }
    }

    revalidatePath("/partners/ai-system-config");
    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-settings");
};

export const getPendingModelRequests = async () => {
    return prismadb.customModelRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
    });
};

export const getAllProviders = async () => {
    return prismadb.aiProviderRegistry.findMany({
        where: { isActive: true },
        orderBy: { slug: "asc" },
    });
};

