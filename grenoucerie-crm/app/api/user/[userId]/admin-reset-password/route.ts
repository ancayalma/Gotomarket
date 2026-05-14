import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRandomPassword } from "@/lib/utils";
import { hash } from "bcryptjs";
import TempPasswordEmail from "@/emails/TempPasswordEmail";
import { logActivity } from "@/actions/audit";
import { render } from "@react-email/render";
import sendEmail from "@/lib/sendmail";
import { systemLogger } from "@/lib/logger";

export async function POST(
    req: Request,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        // Check if session user has admin privileges
        const requestingUser = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { is_admin: true, team_role: true }
        });

        const isAdmin = requestingUser?.is_admin ||
            ["PLATFORM_ADMIN", "SUPER_ADMIN", "ADMIN", "OWNER"].includes(requestingUser?.team_role || "");

        if (!isAdmin) {
            return new NextResponse("Unauthorized: Admin privileges required", { status: 403 });
        }

        const user = await prismadb.users.findUnique({
            where: {
                id: params.userId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                userLanguage: true, // Needed for email template
            }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const tempPassword = generateRandomPassword();
        const hashedPassword = await hash(tempPassword, 12);

        await prismadb.users.update({
            where: {
                id: params.userId,
            },
            data: {
                session_version: { increment: 1 },
                password: hashedPassword,
                mustChangePassword: true, // Force reset on next login
            },
        });

        // Send Email using Unified Relay
        try {
            const emailHtml = await render(
                TempPasswordEmail({
                    username: user.name || "User",
                    avatar: user.avatar,
                    email: user.email,
                    password: tempPassword,
                    userLanguage: user.userLanguage || "en",
                })
            );

            await sendEmail({
                to: user.email,
                subject: "BasaltCRM - Temporary Password",
                text: `Your temporary password is: ${tempPassword}`,
                html: emailHtml,
                replyTo: "support@basalthq.com"
            });
        } catch (emailError) {
            systemLogger.error("[ADMIN_RESET_EMAIL_ERROR]", emailError);
            // Continue execution, we still reset the password in DB
        }

        await logActivity(
            "Admin Reset Password",
            "User Management",
            `Reset password for ${user.email} (Temporary sent)`
        );

        return NextResponse.json({ message: "Password reset and email sent." });
    } catch (error) {
        systemLogger.error("[ADMIN_RESET_PASSWORD_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
