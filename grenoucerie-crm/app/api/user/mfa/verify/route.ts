import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { verifyTotpToken } from "@/lib/mfa-utils";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, secret } = await req.json();

    if (!code || !secret) {
        return NextResponse.json({ error: "Missing code or secret" }, { status: 400 });
    }

    const isValid = await verifyTotpToken(code, secret);

    if (!isValid) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // Verification successful! Enable MFA for this user.
    await prismadb.users.update({
        where: { email: session.user.email },
        data: {
            mfaEnabled: true,
            mfaMethod: "TOTP",
            mfaSecret: secret,
        },
    });

    return NextResponse.json({ success: true });
}
