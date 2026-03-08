import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { prismadb } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/encryption";

// Microsoft OAuth Constants
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = process.env.AZURE_TENANT_ID || "common";
const REDIRECT_URI = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/microsoft/callback`;

// Scopes for Calendar and Offline Access
const SCOPES = [
    "User.Read",
    "Calendars.ReadWrite",
    "Mail.Read",
    "offline_access" // Crucial for refresh tokens
].join(" ");

export async function resolveMicrosoftConfig() {
    let config: any = null;
    try {
        config = await prismadb.systemAuthConfig.findUnique({ where: { provider: "microsoft" } });
    } catch (e) {
        // Ignore DB error
    }

    const clientId = config?.enabled && config?.clientId ? config.clientId : process.env.AZURE_CLIENT_ID;
    const clientSecret = config?.enabled && config?.clientSecret ? config.clientSecret : process.env.AZURE_CLIENT_SECRET;
    const tenantId = config?.enabled && config?.tenantId ? config.tenantId : (process.env.AZURE_TENANT_ID || "common");

    if (!clientId) {
        throw new Error("Missing Microsoft OAuth configuration. Please configure it in SystemAuthConfig or .env");
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
    const nextAuthUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
    
    // Explicitly calculate redirect URL avoiding hardcoded localhost when in cloud
    const baseUrl = appUrl || nextAuthUrl || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/microsoft/callback`;

    return { clientId, clientSecret, tenantId, redirectUri };
}

export async function getMicrosoftAuthUrl(userId: string) {
    const { clientId, tenantId, redirectUri } = await resolveMicrosoftConfig();

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        response_mode: "query",
        scope: SCOPES,
        state: userId, // Pass userId as state to link on callback
    });

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(userId: string, code: string) {
    const { clientId, clientSecret, tenantId, redirectUri } = await resolveMicrosoftConfig();
    
    if (!clientId || !clientSecret) throw new Error("Missing Azure Credentials");

    const params = new URLSearchParams({
        client_id: clientId,
        scope: SCOPES,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        client_secret: clientSecret as string,
    });

    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || "Failed to exchange code");
    }

    // Save tokens
    await prismadb.microsoft_Tokens.upsert({
        where: { id: (await prismadb.microsoft_Tokens.findFirst({ where: { user: userId } }))?.id || "new" },
        update: {
            access_token: encryptSecret(data.access_token) || "",
            refresh_token: encryptSecret(data.refresh_token) || "",
            scope: data.scope,
            expiry_date: new Date(Date.now() + data.expires_in * 1000),
            updatedAt: new Date(),
        } as any, // Prisma generic type workaround
        create: {
            user: userId,
            access_token: encryptSecret(data.access_token) || "",
            refresh_token: encryptSecret(data.refresh_token) || "",
            scope: data.scope,
            expiry_date: new Date(Date.now() + data.expires_in * 1000),
        } as any,
    });

    return data;
}

/**
 * Get an authenticated Microsoft Graph Client for a user
 */
export async function getGraphClient(userId: string) {
    const token = await prismadb.microsoft_Tokens.findFirst({
        where: { user: userId },
    });

    if (!token) return null;

    const { clientId, clientSecret, tenantId, redirectUri } = await resolveMicrosoftConfig();

    // Check expiry
    let accessToken = decryptSecret(token.access_token) || token.access_token;
    if (token.expiry_date && new Date() > token.expiry_date && token.refresh_token) {
        // Refresh
        try {
            const params = new URLSearchParams({
                client_id: clientId!,
                scope: SCOPES,
                refresh_token: decryptSecret(token.refresh_token) || token.refresh_token,
                redirect_uri: redirectUri,
                grant_type: "refresh_token",
                client_secret: clientSecret!,
            });

            const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });

            const data = await response.json();
            if (response.ok) {
                accessToken = data.access_token;
                // Update DB
                await prismadb.microsoft_Tokens.update({
                    where: { id: token.id },
                    data: {
                        access_token: encryptSecret(data.access_token) || "",
                        refresh_token: encryptSecret(data.refresh_token || (decryptSecret(token.refresh_token) || token.refresh_token)) || "",
                        expiry_date: new Date(Date.now() + data.expires_in * 1000),
                        updatedAt: new Date(),
                    },
                });
            }
        } catch (e) {
            console.error("Failed to refresh Microsoft token", e);
            return null;
        }
    }

    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });

    return client;
}
