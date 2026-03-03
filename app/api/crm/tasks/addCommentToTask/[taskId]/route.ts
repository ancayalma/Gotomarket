import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import NewTaskCommentEmail from "@/emails/NewTaskComment";
import { systemLogger } from "@/lib/logger";


export async function POST(req: Request, props: { params: Promise<{ taskId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { comment } = body;
  const { taskId } = params;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!taskId) {
    return new NextResponse("Missing taskId", { status: 400 });
  }

  if (!comment) {
    return new NextResponse("Missing comment", { status: 400 });
  }

  try {
    const task = await prismadb.crm_Accounts_Tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }

    const newComment = await prismadb.tasksComments.create({
      data: {
        v: 0,
        comment: comment,
        task: taskId,
        user: session.user.id,
      },
    });

    if (task.user && task.user !== session.user.id) {
      const assignedUser = await prismadb.users.findUnique({
        where: { id: task.user },
        select: { email: true, name: true }
      });

      if (assignedUser?.email) {
        // Send email notification dynamically via lib/sendmail
        try {
          const { default: sendEmail } = await import("@/lib/sendmail");
          await sendEmail({
            to: assignedUser.email,
            subject: `New Comment on Your Task: ${task.title}`,
            text: `You have a new comment on your task "${task.title}".\n\nComment: ${comment}\n\nLogin to BasaltCRM to view more details.`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #0f766e;">New Task Comment</h2>
                <p>You have a new comment on your task: <strong>${task.title}</strong></p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
                  <p style="margin: 0; white-space: pre-wrap;">${comment}</p>
                </div>
                <p style="font-size: 14px; color: #666;">Login to BasaltCRM to view more details and reply.</p>
              </div>
            `
          });
        } catch (emailError) {
          systemLogger.error("[task_comment_email]", emailError);
        }
      }
    }

    return NextResponse.json(newComment, { status: 200 });

    /*      */
  } catch (error) {
    systemLogger.error("[COMMENTS_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
