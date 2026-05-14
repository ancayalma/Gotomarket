
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIDailyBriefing } from "@/actions/calendar/get-ai-briefing";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const briefing = await getAIDailyBriefing(session.user.id);
        return NextResponse.json(briefing);
    } catch (error: any) {
        return new NextResponse(error.message, { status: 500 });
    }
}
