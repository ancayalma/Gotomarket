import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * Live Chat Session API
 * 
 * GET  /api/crm/chat/sessions — List active/recent sessions for agents
 * POST /api/crm/chat/sessions — Initiate a new chat session (from widget)
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        const url = new URL(req.url);
        const status = url.searchParams.get("status"); // "waiting", "active", "ended"
        const agentId = url.searchParams.get("agent_id");

        const where: any = {};
        if (user?.team_id) where.team_id = user.team_id;
        if (status) where.status = status;
        if (agentId) where.agent_id = agentId;

        const sessions = await prismadb.crm_Live_Chat_Session.findMany({
            where,
            orderBy: { startedAt: "desc" },
            take: 50,
            include: {
                agent: { select: { name: true, avatar: true } },
            },
        });

        // Queue stats
        const queueStats = await prismadb.crm_Live_Chat_Session.groupBy({
            by: ["status"],
            where: user?.team_id ? { team_id: user.team_id } : {},
            _count: true,
        });

        return NextResponse.json({
            sessions,
            queueStats: queueStats.reduce((acc: any, s) => {
                acc[s.status] = s._count;
                return acc;
            }, {}),
        });
    } catch (error) {
        console.error("[CHAT_SESSIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { visitor_name, visitor_email, visitor_page, team_id, department } = body;

        const chatSession = await prismadb.crm_Live_Chat_Session.create({
            data: {
                visitor_name: visitor_name || "Visitor",
                visitor_email: visitor_email || null,
                visitor_page: visitor_page || null,
                visitor_ip: null,
                status: "waiting",
                department: department || null,
                queue_name: "General",
                team_id: team_id || null,
                messages: [],
            },
        });

        return NextResponse.json({
            sessionId: chatSession.id,
            status: "waiting",
            message: "Chat session created. An agent will be with you shortly.",
        });
    } catch (error) {
        console.error("[CHAT_SESSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
