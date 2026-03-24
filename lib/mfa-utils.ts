import {
    generateSecret,
    verify,
    generateURI,
    NobleCryptoPlugin,
    ScureBase32Plugin
} from "otplib";
import QRCode from "qrcode";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { prismadb } from "./prisma";
import { sendSmsEum } from "./aws/eum-sms";

/**
 * MFA & NIST 800-63B Compliance Utilities
 */

const commonOptions = {
    createCrypto: () => new NobleCryptoPlugin(),
    createBase32: () => new ScureBase32Plugin(),
};

// ─── TOTP (QR Code / 6-Digit) ────────────────────────────────────────────────

export const generateTotpSecret = () => {
    return generateSecret({ ...commonOptions, length: 20 });
};

export const getTotpAuthUrl = (email: string, secret: string) => {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "Basalt CRM";
    return generateURI({
        ...commonOptions,
        issuer: appName,
        label: email,
        secret,
    });
};

export const generateQrCodeDataUrl = async (authUrl: string) => {
    return await QRCode.toDataURL(authUrl);
};

export const verifyTotpToken = async (token: string, secret: string) => {
    const result = await verify({
        ...commonOptions,
        token,
        secret
    });
    return result.valid;
};

// ─── SMS MFA ─────────────────────────────────────────────────────────────────

export const sendMfaSms = async (phone: string, code: string) => {
    const body = `Your ${process.env.NEXT_PUBLIC_APP_NAME || "Basalt CRM"} verification code is: ${code}. Valid for 5 minutes.`;
    return await sendSmsEum({
        to: phone,
        body,
        messageType: "TRANSACTIONAL",
    });
};

// ─── WebAuthn (Fingerprint / Biometrics) ─────────────────────────────────────

const rpName = process.env.NEXT_PUBLIC_APP_NAME || "Basalt CRM";
const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Auto-derive rpID from the origin hostname (e.g. "crm.basalthq.com" or "localhost")
const rpID = process.env.NEXT_PUBLIC_AUTH_DOMAIN || (() => {
    try { return new URL(origin).hostname; } catch { return "localhost"; }
})();

export const getWebAuthnRegistrationOptions = async (userId: string, email: string) => {
    const userBytes = Buffer.from(userId);

    const userAuthenticators = await (prismadb as any).authenticator.findMany({
        where: { userId },
    });

    return await generateRegistrationOptions({
        rpName,
        rpID,
        userID: userBytes,
        userName: email,
        attestationType: 'none',
        // v13: excludeCredentials expects { id: Base64URLString, transports? }[]
        excludeCredentials: userAuthenticators.map((auth: any) => ({
            id: auth.credentialID,
            transports: auth.transports as any,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            // No authenticatorAttachment — allow both platform (biometrics) and cross-platform (USB keys)
        },
    });
};

export const verifyWebAuthnRegistration = async (body: any, currentOptions: any) => {
    const verification: any = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
    });

    // v13: registrationInfo.credential is a WebAuthnCredential { id, publicKey, counter }
    if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;

        return {
            verified: true,
            authenticator: {
                // credential.id is already a Base64URLString
                credentialID: credential.id,
                // credential.publicKey is Uint8Array — encode to base64url for DB storage
                publicKey: Buffer.from(credential.publicKey).toString('base64url'),
                counter: credential.counter,
                transports: body.response?.transports || [],
            },
        };
    }

    return { verified: false };
};

export const getWebAuthnAuthenticationOptions = async (userId: string) => {
    const userAuthenticators = await (prismadb as any).authenticator.findMany({
        where: { userId },
    });

    return await generateAuthenticationOptions({
        rpID,
        // v13: allowCredentials expects { id: Base64URLString, transports? }[]
        allowCredentials: userAuthenticators.map((auth: any) => ({
            id: auth.credentialID,
            transports: auth.transports as any,
        })),
        userVerification: 'preferred',
    });
};

export const verifyWebAuthnAuthentication = async (body: any, currentOptions: any, auth: any) => {
    const verification: any = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: currentOptions.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        // v13: credential is WebAuthnCredential { id, publicKey: Uint8Array, counter }
        credential: {
            id: auth.credentialID,
            publicKey: Buffer.from(auth.publicKey, 'base64url'),
            counter: auth.counter,
            transports: auth.transports,
        },
    });

    return verification;
};

