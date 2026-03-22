import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

// 1x1 transparent PNG
const PIXEL_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

type Params = { params: Promise<{ token: string }> };
export async function GET(
  _req: Request,
  { params }: Params
) {
  try {
    const { token: rawToken } = await params;
    const token = rawToken?.replace(/\.png$/i, "") || "";
    if (!token) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Find lead by open token
    const lead = await prismadb.crm_Leads.findFirst({
      where: { outreach_open_token: token },
      select: { id: true, outreach_opened_at: true, outreach_status: true },
    });

    if (lead) {
      // Update only if not already marked opened
      if (!lead.outreach_opened_at) {
        await prismadb.crm_Leads.update({
          where: { id: lead.id },
          data: {
            outreach_opened_at: new Date() as any,
            outreach_status: "OPENED" as any,
          },
        });

        // Create activity record
        await prismadb.crm_Lead_Activities.create({
          data: {
            lead: lead.id,
            type: "email_opened",
            metadata: {} as any,
          },
        });

        // Update outreach item + campaign stats
        const outreachItem = await prismadb.crm_Outreach_Items.findFirst({
          where: { tracking_token: token },
          select: { id: true, campaign: true, openedAt: true },
        });

        if (outreachItem && !outreachItem.openedAt) {
          await prismadb.crm_Outreach_Items.update({
            where: { id: outreachItem.id },
            data: {
              status: "OPENED" as any,
              openedAt: new Date(),
            },
          }).catch(() => { });

          // Increment campaign open count
          if (outreachItem.campaign) {
            await prismadb.crm_Outreach_Campaigns.update({
              where: { id: outreachItem.campaign },
              data: { emails_opened: { increment: 1 } },
            }).catch(() => { });
          }
        }
      }
    }

    // Return 1x1 transparent PNG
    const body = Buffer.from(PIXEL_BASE64, "base64");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Content-Length": body.length.toString(),
      },
    });
  } catch (error) {
     
    systemLogger.error("[OUTREACH_OPEN_GET]", error);
    // Always return a pixel to avoid revealing tracking status
    const body = Buffer.from(PIXEL_BASE64, "base64");
    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }
}
