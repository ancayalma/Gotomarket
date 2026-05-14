import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWebAuthnRegistrationOptions } from "@/lib/mfa-utils";
import { prismadb } from "@/lib/prisma";

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

    const options = await getWebAuthnRegistrationOptions(user.id, user.email);

    // Note: challenge must be stored to be verified later.
    // We'll return it and expect the client to use it, but for a secure implementation
    // should ideally be stored in a signed cookie or session.
    return NextResponse.json(options);
}
