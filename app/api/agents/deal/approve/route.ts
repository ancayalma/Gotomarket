import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeApprovedAction, rejectAction } from "@/lib/agents/deal-agent";
import { systemLogger } from "@/lib/logger";

/**
 * POST /api/agents/deal/approve
 *
 * Human approval/rejection of a proposed agentic action.
 * Body: {
 *   actionId: string;
 *   decision: "approve" | "reject";
 *   modifiedPayload?: Record<string, any>;  // Optional: modify params before approval
 *   reason?: string;  // For rejections
 * }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    if (!body.actionId || !body.decision) {
      return new NextResponse("actionId and decision are required", { status: 400 });
    }

    if (body.decision === "approve") {
      const result = await executeApprovedAction(
        body.actionId,
        session.user.id,
        body.modifiedPayload
      );
      return NextResponse.json(result);
    } else if (body.decision === "reject") {
      await rejectAction(body.actionId, session.user.id, body.reason);
      return NextResponse.json({ success: true, status: "REJECTED" });
    } else {
      return new NextResponse("decision must be 'approve' or 'reject'", { status: 400 });
    }
  } catch (error: any) {
    systemLogger.error("[DEAL_AGENT_APPROVE]", error?.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
