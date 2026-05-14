import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { thirdwebAuth } from "@/lib/thirdweb-auth";

const COOKIE_DOMAIN = process.env.NODE_ENV === "production" ? ".basalthq.com" : undefined;

/**
 * Thirdweb Auth catch-all handler.
 * 
 * GET  /api/auth/thirdweb/payload?address=...&chainId=...
 * GET  /api/auth/thirdweb/is-logged-in
 * POST /api/auth/thirdweb/login
 * POST /api/auth/thirdweb/logout
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ thirdweb: string[] }> }
) {
  const p = await params;
  const action = p.thirdweb[0];

  // ── Generate Login Payload ──
  if (action === "payload") {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    const chainIdStr = url.searchParams.get("chainId");
    const chainId = chainIdStr ? parseInt(chainIdStr, 10) : 8453;

    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const payload = await thirdwebAuth.generatePayload({ address, chainId });
    return NextResponse.json(payload);
  }

  // ── Check Login Status ──
  if (action === "is-logged-in") {
    const token = req.cookies.get("thirdweb_auth_token")?.value;
    if (!token) return NextResponse.json(false);

    try {
      const authResult = await thirdwebAuth.verifyJWT({ jwt: token });
      if (!authResult.valid || !authResult.parsedJWT.sub) {
        return NextResponse.json(false);
      }
      return NextResponse.json(true);
    } catch {
      return NextResponse.json(false);
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ thirdweb: string[] }> }
) {
  const p = await params;
  const action = p.thirdweb[0];

  // ── Login ──
  if (action === "login") {
    try {
      const payload = await req.json();
      const verified = await thirdwebAuth.verifyPayload(payload);
      if (!verified.valid) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
      }

      const jwt = await thirdwebAuth.generateJWT({ payload: verified.payload });
      const address = verified.payload.address;

      // Upsert a placeholder in Users if no thirdweb_address exists yet.
      // The onboarding step will link this to an existing user by email.
      const existingByAddress = await prismadb.users.findFirst({
        where: { thirdweb_address: address },
      });

      if (!existingByAddress) {
        // Don't create a user yet — the onboarding route handles account
        // linking and creation. Just store the Thirdweb JWT so the
        // onboarding endpoint can verify the caller.
        console.log(
          `[ThirdwebAuth] New address ${address} — deferring to onboarding for account linking.`
        );
      }

      const res = NextResponse.json({ success: true, needsOnboarding: !existingByAddress });
      res.cookies.set("thirdweb_auth_token", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      });

      // NextAuth session cookie is set via the /bridge endpoint (full navigation)
      // to avoid browser silently dropping Set-Cookie headers from fetch() responses.

      return res;
    } catch (e: any) {
      console.error("[ThirdwebAuth] Login error:", e);
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── Logout ──
  if (action === "logout") {
    const res = NextResponse.json({ success: true });
    // Clear Thirdweb cookie
    res.cookies.set("thirdweb_auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    });
    // Clear NextAuth session cookie
    res.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    // Also clear the secure variant used in production
    res.cookies.set("__Secure-next-auth.session-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
