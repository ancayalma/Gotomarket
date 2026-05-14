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

    if (checkexisting) {
      // User exists. Instead of failing, move them to the new team.
      try {
        const user = await prismadb.users.update({
          where: { id: checkexisting.id },
          data: {
            team_id: teamInfo.teamId,
            team_role: role,
            assigned_modules: assigned_modules || checkexisting.assigned_modules,
          },
        });

        const existingMessage = `You have been added to a new team on ${process.env.NEXT_PUBLIC_APP_NAME}.\n\nPlease login to ${appUrl} to access your new team.\n\nThank you\n\n${process.env.NEXT_PUBLIC_APP_NAME}`;

        // Send a notification email to the existing user
        await sendEmail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: `You have been added to a new team on ${process.env.NEXT_PUBLIC_APP_NAME}`,
          text: existingMessage,
          html: `<p>You have been added to a new team on <strong>${process.env.NEXT_PUBLIC_APP_NAME}</strong>.</p><p>Please <a href="${appUrl}">login</a> to access your new team dashboard.</p>`,
        });

        await logActivity(
          "Added Existing User",
          "User Management",
          `Added existing user ${email} to team ${teamInfo.teamId}`
        );

        return NextResponse.json(user, { status: 200 });
      } catch (err) {
        systemLogger.error("[INVITE_EXISTING_USER]", err);
        return new NextResponse("Error adding existing user to team", { status: 500 });
      }
    } else {
      // New user creation
      let user;
      try {
        user = await prismadb.users.create({
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
      } catch (createErr: any) {
        systemLogger.error("[INVITE_USER] Failed to create user:", createErr?.message || createErr);
        return NextResponse.json(
          { error: `Failed to create user: ${createErr?.message || "Unknown database error"}` },
          { status: 500 }
        );
      }

      if (!user) {
        return new NextResponse("User not created", { status: 500 });
      }

      // Send invitation email (non-blocking — user is already created)
      try {
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
      } catch (emailErr: any) {
        // Log but don't fail — user was already created successfully
        systemLogger.error(`[INVITE_USER] User ${email} created but invitation email failed:`, emailErr?.message || emailErr);
      }

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
    }
  } catch (error) {
    systemLogger.error("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
