import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyWebAuthnRegistration } from "@/lib/mfa-utils";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { body, currentOptions } = await req.json();

        const verification = await verifyWebAuthnRegistration(body, currentOptions);

        if (verification.verified && verification.authenticator) {
            const { authenticator } = verification;

            await prismadb.authenticator.create({
                data: {
                    credentialID: authenticator.credentialID,
                    publicKey: authenticator.publicKey,
                    counter: authenticator.counter,
                    transports: authenticator.transports,
                    userId: user.id,
                },
            });

            // Enable MFA — keep TOTP as default method if already configured
            const mfaMethodUpdate = user.mfaSecret ? "TOTP" : "WEBAUTHN";
            await prismadb.users.update({
                where: { id: user.id },
                data: {
                    session_version: { increment: 1 },
                    mfaEnabled: true,
                    mfaMethod: mfaMethodUpdate,
                },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    } catch (error: any) {
        console.error("[WebAuthn Register Verify Error]", error);
        return NextResponse.json(
            { error: error?.message || "WebAuthn registration verification failed" },
            { status: 500 }
        );
    }
}
