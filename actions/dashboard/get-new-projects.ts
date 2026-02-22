"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getNewProjects = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const teamInfo = await getCurrentUserTeamId();
    const isAdmin = teamInfo?.isAdmin;
    const teamId = teamInfo?.teamId;

    let boards: any[] = [];
    let memberships: any[] = [];

    if (isAdmin && teamId) {
        // ADMIN MODE: Fetch all active boards for the team
        boards = await (prismadb as any).boards.findMany({
            where: {
                team_id: teamId,
                status: { not: "ARCHIVED" }
            },
            orderBy: { updatedAt: "desc" },
            take: 10 // Show more in pulse for admins
        });

        // Map boards to a membership-like structure for the frontend
        memberships = boards.map(board => ({
            id: `admin-${board.id}`,
            project: board.id,
            assignedAt: board.createdAt,
            board: board
        }));
    } else {
        // MEMBER MODE: Fetch only assigned memberships
        memberships = await prismadb.projectMember.findMany({
            where: {
                user: session.user.id,
                board: {
                    status: {
                        not: "ARCHIVED"
                    }
                }
            },
            include: {
                board: true,
            },
            orderBy: {
                assignedAt: "desc",
            },
        });
    }

    if (memberships.length === 0) return [];

    const boardIds = memberships.map(m => m.project);

    // Fetch all sections for these boards to get tasks
    const sections = await prismadb.sections.findMany({
        where: {
            board: { in: boardIds }
        },
        select: {
            id: true,
            board: true
        }
    });

    const sectionIds = sections.map(s => s.id);
    const tasks = await prismadb.tasks.findMany({
        where: {
            section: { in: sectionIds }
        },
        select: {
            id: true,
            section: true,
            taskStatus: true
        }
    });

    // Map tasks back to boards
    const sectionToBoard: Record<string, string> = {};
    sections.forEach(s => {
        sectionToBoard[s.id] = s.board;
    });

    const boardStats: Record<string, { total: number; complete: number }> = {};
    boardIds.forEach(id => {
        boardStats[id] = { total: 0, complete: 0 };
    });

    tasks.forEach(t => {
        const boardId = sectionToBoard[t.section || ''];
        if (boardId && boardStats[boardId]) {
            boardStats[boardId].total++;
            if (t.taskStatus === "COMPLETE") {
                boardStats[boardId].complete++;
            }
        }
    });

    // Merge stats into memberships
    const result = memberships.map(m => {
        const stats = boardStats[m.project];
        const progression = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
        return {
            ...m,
            progression,
            taskCount: stats.total
        };
    });

    return result;
};
