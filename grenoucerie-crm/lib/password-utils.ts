import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs";
import { createHash } from "crypto";

/**
 * NIST 800-63B Compliance Helper
 * bcrypt has a 72-character limit. To support long passphrases (up to 128+),
 * we pre-hash the password with SHA-256 before passing it to bcrypt.
 * This ensures "No Truncation" (NIST requirement).
 */

function preHash(password: string): string {
    return createHash("sha256").update(password).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
    const hashedForBcrypt = preHash(password);
    return await bcryptHash(hashedForBcrypt, 12);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
    // 1. Try new NIST 2026 format (Pre-hashed SHA-256 + Bcrypt)
    const hashedForBcrypt = preHash(password);
    const ok = await bcryptCompare(hashedForBcrypt, hashed);
    if (ok) return true;

    // 2. Fallback to legacy direct Bcrypt (for users who haven't reset since the transition)
    return await bcryptCompare(password, hashed);
}
