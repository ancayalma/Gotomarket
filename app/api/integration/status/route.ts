import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/api-auth-guard";

/**
 * GET /api/integration/status
 * BasaltCRM integration status endpoint for BasaltECHO connection and softphone config.
 *
 * Response:
 * {
 *   basaltecho_connected: boolean,
 *   iframeSrc: string,     // e.g., https://basaltcrm.my.connect.aws/ccp-v2/
 *   iframeOrigin: string,  // e.g., https://basaltcrm.my.connect.aws
 *   queueId?: string,
 *   flowId?: string
 * }
 *
 * Notes:
 * - Computes basaltecho_connected from stored OAuth tokens / connection state.
 * - queueId/flowId can be populated from workspace configuration if applicable.
 */

export async function GET(_req: NextRequest) {
  // ── Auth guard ──
  const session = await requireApiAuth();
  if (session instanceof Response) return session;

  try {
    const base = String(process.env.NEXT_PUBLIC_CONNECT_BASE_URL || "").trim();
    if (!base || !/^https?:\/\//i.test(base)) {
      return NextResponse.json(
        { ok: false, error: "invalid_connect_base_url" },
        { status: 500 }
      );
    }

    // Resolve BasaltECHO connection and wallet from CRM persistence (systemServices) and env
    let basaltechoConnected = false;
    let basaltechoWallet: string | null = null;
    try {
      const svc = await prismadb.systemServices.findFirst({ where: { name: "basaltecho" } });
      const configuredBase = String(process.env.BASALTECHO_BASE_URL || process.env.NEXT_PUBLIC_BASALTECHO_BASE_URL || "").trim();
      basaltechoConnected = !!(configuredBase || (svc?.serviceUrl && String(svc.serviceUrl).trim()));
      basaltechoWallet = svc?.serviceId ? String(svc.serviceId).trim().toLowerCase() : null;
    } catch { }

    const iframeSrc = `${base.replace(/\/+$/, "")}/ccp-v2/`;
    const iframeOrigin = base.replace(/\/+$/, "");

    // Optional queue/flow identifiers from env (or workspace config)
    const queueId = process.env.CONNECT_QUEUE_ID;
    const flowId = process.env.CONNECT_CONTACT_FLOW_ID;

    return NextResponse.json(
      {
        basaltecho_connected: basaltechoConnected,
        basaltecho_wallet: basaltechoWallet,
        iframeSrc,
        iframeOrigin,
        ...(queueId ? { queueId } : {}),
        ...(flowId ? { flowId } : {}),
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
