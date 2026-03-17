import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * Single Chat Session API
 * 
 * GET    /api/crm/chat/sessions/[sessionId] — Get session with messages
 * PUT    /api/crm/chat/sessions/[sessionId] — Update (assign agent, end, rate)
 * PATCH  /api/crm/chat/sessions/[sessionId] — Send message
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;

        const chatSession = await prismadb.crm_Live_Chat_Session.findUnique({
            where: { id: sessionId },
            include: {
                agent: { select: { name: true, avatar: true } },
            },
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json(chatSession);
    } catch (error) {
        console.error("[CHAT_SESSION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { sessionId } = await params;
        const body = await req.json();
        const { action } = body;

        if (action === "assign") {
            // Agent picks up the chat
            const updated = await prismadb.crm_Live_Chat_Session.update({
                where: { id: sessionId },
                data: {
                    agent_id: session.user.id,
                    status: "active",
                    firstReplyAt: new Date(),
                },
            });
            return NextResponse.json(updated);
        }

        if (action === "end") {
            const updated = await prismadb.crm_Live_Chat_Session.update({
                where: { id: sessionId },
                data: {
                    status: "ended",
                    endedAt: new Date(),
                    resolution_notes: body.resolution_notes || null,
                },
            });
            return NextResponse.json(updated);
        }

        if (action === "rate") {
            const updated = await prismadb.crm_Live_Chat_Session.update({
                where: { id: sessionId },
                data: {
                    satisfaction_rating: body.rating,
                },
            });
            return NextResponse.json(updated);
        }

        if (action === "create_case") {
            // Create a case from this chat session
            const chat = await prismadb.crm_Live_Chat_Session.findUnique({
                where: { id: sessionId },
            });

            if (!chat) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            const lastCaseNumber = await prismadb.crm_Cases.findFirst({
                orderBy: { case_number: "desc" },
                select: { case_number: true },
            });
            const nextNum = lastCaseNumber
                ? String(parseInt(lastCaseNumber.case_number.replace("CS-", "")) + 1).padStart(5, "0")
                : "00001";

            const messages = (chat.messages as any[]) || [];
            const transcript = messages
                .map((m: any) => `[${m.sender}] ${m.text}`)
                .join("\n");

            const newCase = await prismadb.crm_Cases.create({
                data: {
                    case_number: `CS-${nextNum}`,
                    subject: `Chat Support - ${chat.visitor_name || "Visitor"}`,
                    description: `Chat transcript:\n\n${transcript}`,
                    origin: "CHAT",
                    contact_id: chat.contact_id || undefined,
                    account_id: chat.account_id || undefined,
                    assigned_to: chat.agent_id || undefined,
                    team_id: chat.team_id || undefined,
                },
            });

            await prismadb.crm_Live_Chat_Session.update({
                where: { id: sessionId },
                data: { case_id: newCase.id },
            });

            return NextResponse.json({ case: newCase });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("[CHAT_SESSION_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Send a message to the chat
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const { sender, text, type } = await req.json();

        const chatSession = await prismadb.crm_Live_Chat_Session.findUnique({
            where: { id: sessionId },
            select: { messages: true },
        });

        if (!chatSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const messages = (chatSession.messages as any[]) || [];
        messages.push({
            sender: sender || "visitor",
            text,
            type: type || "text",
            timestamp: new Date().toISOString(),
        });

        await prismadb.crm_Live_Chat_Session.update({
            where: { id: sessionId },
            data: { messages },
        });

        return NextResponse.json({ success: true, messageCount: messages.length });
    } catch (error) {
        console.error("[CHAT_SESSION_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
