/**
 * SOC2 CC6.1 / CC6.7 — Field-Level Encryption for Secrets at Rest
 *
 * Uses AES-256-GCM (authenticated encryption) with a master key from env.
 * Every encrypted value gets a unique IV, and the auth tag prevents tampering.
 *
 * Usage:
 *   import { encryptSecret, decryptSecret } from "@/lib/encryption";
 *   const cipher = encryptSecret("sk_live_abc123");  // → "aes256gcm:iv:authTag:ciphertext"
 *   const plain  = decryptSecret(cipher);            // → "sk_live_abc123"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const ENCODING = "hex" as const;
const PREFIX = "aes256gcm"; // Prefix to identify encrypted values

/**
 * Get the master encryption key from environment.
 * Must be a 64-char hex string (32 bytes / 256 bits).
 *
 * Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getMasterKey(): Buffer {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key) {
        throw new Error(
            "[ENCRYPTION] ENCRYPTION_MASTER_KEY is not set. " +
            "Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }
    if (key.length !== 64) {
        throw new Error(
            `[ENCRYPTION] ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes). Got ${key.length} chars.`
        );
    }
    return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext secret.
 * Returns a prefixed string: "aes256gcm:<iv>:<authTag>:<ciphertext>"
 * Returns null/undefined unchanged for nullable fields.
 */
export function encryptSecret(plaintext: string | null | undefined): string | null {
    if (plaintext == null || plaintext === "") return null;

    // Don't double-encrypt
    if (isEncrypted(plaintext)) return plaintext;

    const key = getMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plaintext, "utf8", ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag().toString(ENCODING);

    return `${PREFIX}:${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a previously encrypted secret.
 * Accepts the prefixed format: "aes256gcm:<iv>:<authTag>:<ciphertext>"
 * Returns null/undefined unchanged. Returns plaintext unchanged if not encrypted.
 */
export function decryptSecret(ciphertext: string | null | undefined): string | null {
    if (ciphertext == null || ciphertext === "") return null;

    // If it's not in our encrypted format, return as-is (backward compat for migration)
    if (!isEncrypted(ciphertext)) return ciphertext;

    const key = getMasterKey();
    const parts = ciphertext.split(":");

    if (parts.length !== 4) {
        throw new Error("[ENCRYPTION] Malformed encrypted value — expected 4 parts separated by ':'");
    }

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, ENCODING, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Check if a value is already encrypted by our system.
 */
export function isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    return value.startsWith(`${PREFIX}:`);
}

/**
 * Encrypt multiple fields in an object. Only encrypts non-null string values
 * for the specified field names.
 *
 * Usage:
 *   const data = { api_key: "sk_live_abc", name: "My Config" };
 *   const encrypted = encryptFields(data, ["api_key"]);
 *   // → { api_key: "aes256gcm:...", name: "My Config" }
 */
export function encryptFields<T extends Record<string, any>>(
    data: T,
    fieldNames: (keyof T)[]
): T {
    const result = { ...data };
    for (const field of fieldNames) {
        const value = result[field];
        if (typeof value === "string" && value !== "") {
            (result as any)[field] = encryptSecret(value);
        }
    }
    return result;
}

/**
 * Decrypt multiple fields in an object.
 *
 * Usage:
 *   const decrypted = decryptFields(config, ["api_key"]);
 */
export function decryptFields<T extends Record<string, any>>(
    data: T,
    fieldNames: (keyof T)[]
): T {
    const result = { ...data };
    for (const field of fieldNames) {
        const value = result[field];
        if (typeof value === "string" && value !== "") {
            (result as any)[field] = decryptSecret(value);
        }
    }
    return result;
}

// ────────────────────────────────────────────────────────────────────────────
// SECRET FIELD REGISTRY — Central list of all encrypted fields per model
// Used by the Prisma extension to auto-encrypt/decrypt
// ────────────────────────────────────────────────────────────────────────────

export const SECRET_FIELDS: Record<string, string[]> = {
    TeamEmailConfig: [
        "aws_secret_access_key",
        "resend_api_key",
        "sendgrid_api_key",
        "mailgun_api_key",
        "postmark_api_token",
        "smtp_password",
    ],
    TeamAiConfig: ["apiKey"],
    SystemAiConfig: ["apiKey"],
    Tenant_Integrations: [
        "surge_api_key",
        "shopify_access_token",
        "woocommerce_consumer_secret",
        "mercury_api_key",
        "pandadoc_token",
        "discord_webhook",
    ],
    TeamCaptchaConfig: ["secret_key"],
    openAi_keys: ["api_key"],
    gmail_Tokens: ["access_token", "refresh_token"],
    microsoft_Tokens: ["access_token", "refresh_token"],
    systemServices: ["serviceKey", "servicePassword"],
};
