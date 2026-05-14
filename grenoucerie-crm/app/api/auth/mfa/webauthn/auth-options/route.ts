import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getWebAuthnAuthenticationOptions } from "@/lib/mfa-utils";

export async function POST(req: Request) {
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prismadb.users.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (!user || !user.mfaEnabled) {
        return NextResponse.json({ error: "MFA not enabled for this user" }, { status: 400 });
    }

    const options = await getWebAuthnAuthenticationOptions(user.id);

    return NextResponse.json(options);
}
