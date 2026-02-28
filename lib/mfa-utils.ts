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
import { sendSmsEUM } from "./aws/eum-sms";

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
    return await sendSmsEUM({
        to: phone,
        body,
        messageType: "TRANSACTIONAL",
    });
};

// ─── WebAuthn (Fingerprint / Biometrics) ─────────────────────────────────────

const rpName = process.env.NEXT_PUBLIC_APP_NAME || "Basalt CRM";
const rpID = process.env.NEXT_PUBLIC_AUTH_DOMAIN || "localhost";
const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
        excludeCredentials: userAuthenticators.map((auth: any) => ({
            id: auth.credentialID,
            type: 'public-key',
            transports: auth.transports as any,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform',
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

    if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

        return {
            verified: true,
            authenticator: {
                credentialID: Buffer.from(credentialID).toString('base64url'),
                publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
                counter,
                transports: body.response.transports || [],
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
        allowCredentials: userAuthenticators.map((auth: any) => ({
            id: auth.credentialID,
            type: 'public-key',
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
        credential: { // SimpleWebAuthn v13 uses 'credential'
            id: auth.credentialID,
            publicKey: Buffer.from(auth.publicKey, 'base64url'),
            counter: auth.counter,
        },
    });

    return verification;
};
