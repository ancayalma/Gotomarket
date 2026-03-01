import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

import { generateRandomPassword } from "@/lib/utils";

import { hash } from "bcryptjs";
import PasswordResetEmail from "@/emails/PasswordReset";
import { render } from "@react-email/render";
import sendEmail from "@/lib/sendmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    //console.log(body, "body");
    //console.log(email, "email");

    if (!email) {
      return new NextResponse("Email is required!", {
        status: 401,
      });
    }

    // Normalize incoming email to reduce case sensitivity issues
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : email;

    // Create a reset token
    const token = crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await prismadb.users.findFirst({
      where: {
        OR: [
          { email: email },
          { email: normalizedEmail as string },
        ],
      },
    });

    if (user) {
      // Save token to database
      await prismadb.users.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpires: tokenExpires,
        },
      });

      try {
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
        const emailHtml = await render(
          PasswordResetEmail({
            username: user.name || "User",
            avatar: user.avatar,
            email: user.email,
            resetLink: resetLink,
            userLanguage: "en",
          })
        );

        await sendEmail({
          to: user.email,
          subject: "BasaltCRM - Password reset",
          text: `Click here to reset your password: ${resetLink}`,
          html: emailHtml,
          replyTo: "support@basalthq.com"
        });
        console.log("Password reset email sent to: " + user.email);
      } catch (e) {
        console.log("[USER_PASSWORD_CHANGE_EMAIL_ERROR]", e);
      }
    }

    // Always return success to prevent user enumeration
    return NextResponse.json({ message: "If an account exists, a password reset link has been sent.", status: true });
  } catch (error) {
    console.log("[USER_PASSWORD_CHANGE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
