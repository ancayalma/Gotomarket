import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Find the user with this token
        const user = await prismadb.users.findFirst({
            where: {
                resetToken: token,
            },
        });

        if (!user) {
            return new NextResponse("Invalid or expired token", { status: 400 });
        }

        // Check expiration
        if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
            return new NextResponse("Token has expired", { status: 400 });
        }

        // Hash the new password and clear the token fields
        const hashedPassword = await hash(newPassword, 12);

        await prismadb.users.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        return NextResponse.json({ message: "Password successfully reset" });
    } catch (error) {
        console.log("[RESET_PASSWORD_WITH_TOKEN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
