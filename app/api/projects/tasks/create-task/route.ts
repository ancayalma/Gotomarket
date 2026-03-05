import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

import NewTaskFromProject from "@/emails/NewTaskFromProject";
import sendEmail from "@/lib/sendmail";
import { render } from "@react-email/render";
import { systemLogger } from "@/lib/logger";

//Create new task in project route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const {
    title,
    user,
    board,
    priority,
    content,
    dueDateAt,
    accountId,
    opportunityId,
    contactId,
    leadId,
    taskStatus,
  } = body;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title || !user || !priority) {
    return new NextResponse("Missing title, user, or priority", { status: 400 });
  }

  let targetBoardId = board;

  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // If no board is provided, find or create a "Private Reminders" board for the user/team
    if (!targetBoardId) {
      const personalBoard = await prismadb.boards.findFirst({
        where: {
          user: user,
          title: "Private Reminders",
          team_id: teamId,
        },
      });

      if (personalBoard) {
        targetBoardId = personalBoard.id;
      } else {
        const newBoard = await (prismadb.boards as any).create({
          data: {
            v: 0,
            title: "Private Reminders",
            description: "Personal tasks and reminders",
            user: user,
            team_id: teamId,
            visibility: "private",
            status: "ACTIVE",
            position: 0,
            createdBy: user,
            updatedBy: user,
          },
        });
        targetBoardId = newBoard.id;
      }
    }

    //Get first section from board where position is smallest
    let sectionId = await prismadb.sections.findFirst({
      where: {
        board: targetBoardId,
      },
      orderBy: {
        position: "asc",
      },
    });

    if (!sectionId) {
      // Create default section if none exists
      sectionId = await prismadb.sections.create({
        data: {
          board: targetBoardId,
          title: "Pinned",
          position: 0,
          v: 0,
        },
      });
    }

    const tasksCount = await prismadb.tasks.count({
      where: {
        section: sectionId.id,
      },
    });

    const task = await (prismadb.tasks as any).create({
      data: {
        v: 0,
        team_id: teamId,
        priority: priority,
        title: title,
        content: content,
        dueDateAt: dueDateAt,
        section: sectionId.id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        position: tasksCount > 0 ? tasksCount : 0,
        user: user,
        taskStatus: taskStatus || "ACTIVE",
        accountId: accountId || null,
        opportunityId: opportunityId || null,
        contactId: contactId || null,
        leadId: leadId || null,
      },
    });

    //Update Board updatedAt
    await prismadb.boards.update({
      where: { id: targetBoardId },
      data: { updatedAt: new Date() },
    });

    //Notification
    if (user !== session.user.id) {
      try {
        const notifyRecipient = await prismadb.users.findUnique({
          where: { id: user },
        });

        const boardData = await prismadb.boards.findUnique({
          where: { id: targetBoardId },
        });

        const emailHtml = await render(
          NewTaskFromProject({
            taskFromUser: session.user.name!,
            username: notifyRecipient?.name!,
            userLanguage: "en",
            taskData: task,
            boardData: boardData,
          })
        );

        await sendEmail({
          from: process.env.EMAIL_FROM,
          to: notifyRecipient?.email!,
          subject: `New task - ${title}.`,
          text: `New task assigned from ${session.user.name}: ${title}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Email notification failed:", error);
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    systemLogger.error("[CREATE_TASK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
