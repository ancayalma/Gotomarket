import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { verifyWebAuthnAuthentication } from "@/lib/mfa-utils";
import { SignJWT } from "jose";

export async function POST(req: Request) {
    const { body, currentOptions, email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prismadb.users.findUnique({
        where: { email: email.toLowerCase() },
        include: { authenticators: true },
    });

    if (!user || user.authenticators.length === 0) {
        return NextResponse.json({ error: "No authenticators found" }, { status: 400 });
    }

    const authenticator = user.authenticators.find(
        (a) => a.credentialID === body.id
    );

    if (!authenticator) {
        return NextResponse.json({ error: "Authenticator not recognized" }, { status: 400 });
    }

    const verification = await verifyWebAuthnAuthentication(body, currentOptions, authenticator);

    if (verification.verified) {
        // Update counter
        await prismadb.authenticator.update({
            where: { id: authenticator.id },
            data: { counter: verification.authenticationInfo.newCounter },
        });

        // Generate a short-lived token to prove MFA was completed
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback_secret");
        const mfaToken = await new SignJWT({ sub: user.id, mfaVerified: true })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("2m") // Valid for 2 minutes
            .sign(secret);

        return NextResponse.json({ success: true, mfaToken });
    }

    return NextResponse.json({ error: "WebAuthn verification failed" }, { status: 400 });
}
