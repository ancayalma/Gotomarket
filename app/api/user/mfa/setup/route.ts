import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { generateTotpSecret, getTotpAuthUrl, generateQrCodeDataUrl } from "@/lib/mfa-utils";

export async function GET() {
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

    // Generate a secret if they don't have one or want to reset
    const secret = generateTotpSecret();
    const authUrl = getTotpAuthUrl(user.email, secret);
    const qrCode = await generateQrCodeDataUrl(authUrl);

    // We don't save the secret yet. We only save it in /verify once they prove it works.
    // We send the secret to the client so they can send it back in /verify along with the first code.
    return NextResponse.json({
        secret,
        qrCode,
        authUrl,
    });
}
