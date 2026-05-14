"use server";

import { getServerSession } from "next-auth";
import { render } from "@react-email/render";

import { SendMailToAll } from "./schema";
import { InputType, ReturnType } from "./types";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createSafeAction } from "@/lib/create-safe-action";
import MessageToAllUsers from "@/emails/admin/MessageToAllUser";
import sendEmail from "@/lib/sendmail";

const handler = async (data: InputType): Promise<ReturnType> => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      error: "You must be authenticated.",
    };
  }

  //Only admin can send mail to all users
  if (!session.user.isAdmin) {
    return {
      error: "You are not authorized to perform this action.",
    };
  }



  const { title, message } = data;

  if (!title || !message) {
    return {
      error: "Title and message are required.",
    };
  }

  try {
    const users = await prismadb.users.findMany({
      /*       where: {
        email: {
          //contains: "marketing@basalthq.com",
          equals: "marketing@basalthq.com",
        },
      }, */
    });
    //console.log(users.length, "user.length");

    //For each user, send mail
    for (const user of users) {
      const emailHtml = await render(
        MessageToAllUsers({
          title: title,
          message: message,
          username: user?.name!,
        })
      );

      //send via Unified Relay
      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: user.email || "info@softbase.com",
        subject: title,
        text: message,
        html: emailHtml,
      });
    }
  } catch (error) {
    console.log(error);
    return {
      error: "Failed to send mail to all users.",
    };
  }

  return { data: { title: title, message: message } };
};

export const sendMailToAll = createSafeAction(SendMailToAll, handler);
