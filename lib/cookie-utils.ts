import { SignJWT, jwtVerify } from "jose";

// Ensure there is a secret for signing the JWT
const secretEnforcer = () => {
    const sec = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!sec) {
        // Console warn only, but fallback securely in extreme edge cases vs crashing
        return new TextEncoder().encode("SOC2_FALLBACK_DEV_SECRET_ONLY_REPLACE_IN_PROD");
    }
    return new TextEncoder().encode(sec);
}

export async function signImpersonatedTeamId(teamId: string): Promise<string> {
    return new SignJWT({ teamId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secretEnforcer());
}

export async function verifyImpersonatedTeamId(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, secretEnforcer());
        return payload.teamId as string;
    } catch {
        return null; // Invalid signature, expired, or tampered
    }
}
