import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { systemLogger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Decode the URL-friendly base64 token
        let userId: string;
        let rawToken: string;
        try {
            const decoded = Buffer.from(token, 'base64url').toString('utf8');
            [userId, rawToken] = decoded.split(':');
            
            if (!userId || !rawToken) {
                return new NextResponse("Invalid token format", { status: 400 });
            }
        } catch (e) {
            return new NextResponse("Invalid token", { status: 400 });
        }

        // Find the user with this ID
        const user = await prismadb.users.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user || !user.resetToken) {
            return new NextResponse("Invalid or expired token", { status: 400 });
        }

        // Check expiration
        if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
            return new NextResponse("Token has expired", { status: 400 });
        }

        // SOC2 CC6.1 Compare bcrypt hashed token securely
        const isValidToken = await compare(rawToken, user.resetToken);
        if (!isValidToken) {
            return new NextResponse("Invalid token", { status: 400 });
        }

        // Hash the new password and clear the token fields
        const hashedPassword = await hash(newPassword, 12);

        await prismadb.users.update({
            where: { id: user.id },
            data: {
                session_version: { increment: 1 },
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        return NextResponse.json({ message: "Password successfully reset" });
    } catch (error) {
        systemLogger.error("[RESET_PASSWORD_WITH_TOKEN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
