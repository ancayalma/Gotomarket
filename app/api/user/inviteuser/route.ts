import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRandomPassword } from "@/lib/utils";
import { logActivity } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";

import { hash } from "bcryptjs";
import { hashPassword } from "@/lib/password-utils";

import InviteUserEmail from "@/emails/InviteUser";
import sendEmail from "@/lib/sendmail";
import { render } from "@react-email/render";
import { systemLogger } from "@/lib/logger";
import { verifyEmailIdentity } from "@/lib/aws/ses-verify";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId) {
    return NextResponse.json(
      { error: "No active team found to invite user to." },
      { status: 400 }
    );
  }

  // SOC2 CC6.1 / A1.2: Check resource quotas before allowing invitation
  if (teamInfo?.teamId) {
    const { checkTeamQuota } = await import("@/lib/quota-service");
    const quota = await checkTeamQuota(teamInfo.teamId, "USERS", teamInfo.userId);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.message }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { name, email, language, assigned_modules, role = "MEMBER" } = body;

    if (!name || !email || !language) {
      return NextResponse.json(
        { error: "Name, Email, and Language is required!" },
        {
          status: 400,
        }
      );
    }

    const password = generateRandomPassword();

    const origin = req.headers.get("origin");
    const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL;
    console.log("InviteUser Route - appUrl:", appUrl);

    const message = `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${email} \n\n Your password is: ${password} \n\n Please login to ${appUrl} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;

    //Check if user already exists in local database
    const checkexisting = await prismadb.users.findFirst({
      where: {
        email: email,
      },
    });

    //If user already exists, return error else create user and send email
    if (checkexisting) {
      return NextResponse.json(
        { error: "User already exist, reset password instead!" },
        {
          status: 400,
        }
      );
    } else {
      try {
        const user = await prismadb.users.create({
          data: {
            name,
            username: "",
            avatar: "",
            account_name: "",
            is_account_admin: false,
            is_admin: false,
            email,
            userStatus: "ACTIVE",
            userLanguage: "en",
            password: await hashPassword(password),
            assigned_modules: assigned_modules || [],
            team_id: teamInfo.teamId, // Assign to the current team
            team_role: role, // Default to MEMBER or provided role
          },
        });

        if (!user) {
          return new NextResponse("User not created", { status: 500 });
        }

        const emailHtml = await render(
          InviteUserEmail({
            invitedByUsername: session.user?.name! || "admin",
            username: user?.name!,
            invitedUserPassword: password,
            userLanguage: "en",
            appUrl: appUrl || "",
          })
        );

        await sendEmail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: `You have been invited to ${process.env.NEXT_PUBLIC_APP_NAME}`,
          text: message,
          html: emailHtml,
        });

        console.log("Invitation email sent successfully via Unified Relay");

        // Auto-trigger SES email verification for the new user's email
        try {
            await verifyEmailIdentity(user.email);
            console.log(`[SES_VERIFY] Auto-triggered verification for invited user: ${user.email}`);
        } catch (sesError) {
            // Non-blocking — verification can be re-triggered from the post-login modal
            systemLogger.error(`[SES_VERIFY] Failed to auto-trigger for ${user.email}:`, sesError);
        }

        await logActivity(
          "Invited User",
          "User Management",
          `Invited user ${email} to team ${teamInfo.teamId}`
        );

        return NextResponse.json(user, { status: 200 });
      } catch (err) {
        console.log(err);
        return new NextResponse("Error creating user or sending email", { status: 500 });
      }
    }
  } catch (error) {
    systemLogger.error("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
