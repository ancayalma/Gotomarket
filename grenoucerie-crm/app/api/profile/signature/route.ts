import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { systemLogger } from "@/lib/logger";

/**
 * GET/POST /api/profile/signature
 * Supports optional ?brandId= query param for per-brand signatures.
 * Without brandId: operates on user-level signature (backward compatible).
 * With brandId: operates on TeamBrandIdentity signature_html / signature_meta.
 *
 * GET: returns { signature_html, signature_meta, signature_updated_at }
 * POST: body { signatureHtml: string, meta?: any } - saves sanitized HTML and meta
 */

// very basic sanitization: strip <script> tags and on* event attributes
function sanitizeSignatureHtml(html: string) {
  try {
    let s = html || "";
    // remove script blocks
    s = s.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
    // remove inline event handlers e.g., onclick=""
    s = s.replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, "");
    // limit overall size to avoid abuse
    if (s.length > 100_000) {
      s = s.slice(0, 100_000);
    }
    return s;
  } catch {
    return html;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (brandId) {
      // Brand-level signature
      const brand = await prismadb.teamBrandIdentity.findUnique({
        where: { id: brandId },
        select: {
          signature_html: true,
          signature_meta: true,
          updatedAt: true,
        },
      });
      return NextResponse.json(
        {
          signature_html: brand?.signature_html || "",
          signature_meta: brand?.signature_meta || null,
          signature_updated_at: brand?.updatedAt || null,
        },
        { status: 200 }
      );
    }

    // User-level signature (backward compatible)
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: {
        signature_html: true,
        signature_meta: true,
        signature_updated_at: true,
      },
    });

    return NextResponse.json(
      {
        signature_html: user?.signature_html || "",
        signature_meta: user?.signature_meta || null,
        signature_updated_at: user?.signature_updated_at || null,
      },
      { status: 200 }
    );
  } catch (error) {
     
    systemLogger.error("[PROFILE_SIGNATURE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    const payload = await req.json().catch(() => ({}));
    const signatureHtmlRaw = (payload?.signatureHtml ?? "").toString();
    const meta = payload?.meta;

    if (!signatureHtmlRaw || signatureHtmlRaw.trim().length === 0) {
      return new NextResponse("signatureHtml is required", { status: 400 });
    }

    const signatureHtml = sanitizeSignatureHtml(signatureHtmlRaw);

    if (brandId) {
      // Brand-level save
      await prismadb.teamBrandIdentity.update({
        where: { id: brandId },
        data: {
          signature_html: signatureHtml,
          signature_meta: meta ?? undefined,
        },
      });

      import("@/actions/quests/add-raw-xp")
        .then((m) => m.grantOneTimeXP({
            userId: session.user.id,
            xpAmount: 25,
            flagKey: "brand_signature_setup",
            reason: "Configured Brand Signature"
        }))
        .catch((e) => systemLogger.warn(`[SIGNATURE_SETUP] Failed to award XP: ${e?.message}`));

      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    // User-level save (backward compatible)
    await prismadb.users.update({
      where: { id: session.user.id },
      data: {
        signature_html: signatureHtml,
        signature_meta: meta ?? undefined,
        signature_updated_at: new Date() as any,
      },
    });

    import("@/actions/quests/add-raw-xp")
      .then((m) => m.grantOneTimeXP({
          userId: session.user.id,
          xpAmount: 25,
          flagKey: "signature_setup",
          reason: "Configured Custom Signature"
      }))
      .catch((e) => systemLogger.warn(`[SIGNATURE_SETUP] Failed to award XP: ${e?.message}`));

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
     
    systemLogger.error("[PROFILE_SIGNATURE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
