import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logActivityInternal } from "@/actions/audit";
import { encryptSecret } from "@/lib/encryption";
import { systemLogger } from "@/lib/logger";

// POST /api/teams/[teamId]/ai-config - Update team AI configuration
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;

        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
        }

        const { provider, modelId, useSystemKey, apiKey, services } = body;

        // Validate provider string is non-empty
        if (!provider || typeof provider !== "string" || provider.trim().length === 0) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        // Verify user belongs to this team or is a global admin
        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: {
                team_id: true,
                team_role: true,
                assigned_team: { select: { slug: true } }
            },
        });

        // PLATFORM_ADMIN has god mode - no team restriction
        const isGlobalAdmin = user?.team_role === "PLATFORM_ADMIN";
        const isTeamAdmin = user?.team_id === teamId && ["OWNER", "ADMIN", "PLATFORM_ADMIN"].includes(user?.team_role || "");

        if (!isGlobalAdmin && !isTeamAdmin) {
            return NextResponse.json({ error: "Not authorized to modify this team's settings" }, { status: 403 });
        }

        const encryptedKey = useSystemKey ? null : encryptSecret(apiKey || null);

        // Upsert team AI config
        const config = await prismadb.teamAiConfig.upsert({
            where: { team_id: teamId },
            create: {
                team_id: teamId,
                provider,
                modelId: modelId || null,
                useSystemKey: useSystemKey ?? true,
                apiKey: encryptedKey,
                configuration: { services: services || {} },
            },
            update: {
                provider,
                modelId: modelId || null,
                useSystemKey: useSystemKey ?? true,
                apiKey: encryptedKey,
                configuration: { services: services || {} },
            },
        });

        // ── PLATFORM ADMIN: Also update SystemAiConfig (global defaults for all teams) ──
        // When a platform admin saves from the system config page, the same provider/model
        // should be set as the global fallback for teams without their own config.
        if (isGlobalAdmin || user?.assigned_team?.slug === "basalthq") {
            try {
                // Find existing system config for this provider, or use the first active one
                const existingSystemConfig = await prismadb.systemAiConfig.findFirst({
                    where: { provider },
                });

                const systemConfigData: any = {
                    provider,
                    defaultModelId: modelId || null,
                    isActive: true,
                    configuration: { services: services || {} },
                };

                // Only set apiKey on system config if it's an IAM-managed provider (Bedrock)
                // or if the admin explicitly provided a key
                if (provider === "BEDROCK") {
                    systemConfigData.apiKey = "MANAGED_BY_IAM";
                } else if (!useSystemKey && apiKey) {
                    systemConfigData.apiKey = encryptedKey;
                }

                if (existingSystemConfig) {
                    await prismadb.systemAiConfig.update({
                        where: { id: existingSystemConfig.id },
                        data: systemConfigData,
                    });
                } else {
                    await prismadb.systemAiConfig.create({
                        data: systemConfigData,
                    });
                }

                systemLogger.info(`[SYSTEM_AI_CONFIG] Platform admin updated global AI defaults: provider=${provider}, model=${modelId}, services=${JSON.stringify(services || {})}`);
            } catch (sysErr) {
                // Don't fail the whole request if system config update fails
                systemLogger.error("[SYSTEM_AI_CONFIG] Failed to update system config:", sysErr);
            }
        }

        const actorId = (session.user as any)?.id;
        if (actorId) {
            await logActivityInternal(actorId, "UPDATE", "TeamAiConfig", `Updated AI config for team ${teamId} (provider: ${provider})`, teamId);
        }
        return NextResponse.json({ ...config, apiKey: config.apiKey ? "HasValue" : null });
    } catch (error) {
        systemLogger.error("[TEAM_AI_CONFIG_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/teams/[teamId]/ai-config - Get team AI configuration
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;

        const config = await prismadb.teamAiConfig.findUnique({
            where: { team_id: teamId },
        });

        return NextResponse.json(config);
    } catch (error) {
        systemLogger.error("[TEAM_AI_CONFIG_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
