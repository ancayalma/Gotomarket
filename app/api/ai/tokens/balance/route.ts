import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeamAiTokenBalance } from "@/lib/ai-tokens";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * GET /api/ai/tokens/balance
 * Returns the current team's AI token balance.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return NextResponse.json({ error: "No team found" }, { status: 400 });
        }

        const balance = await getTeamAiTokenBalance(teamInfo.teamId);

        return NextResponse.json({ balance, unlimited: balance < 0 });
    } catch (error) {
        console.error("[AI_TOKENS_BALANCE]", error);
        return NextResponse.json({ error: "Failed to get balance" }, { status: 500 });
    }
}
