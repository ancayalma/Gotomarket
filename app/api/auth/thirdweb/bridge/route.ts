import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { thirdwebAuth } from "@/lib/thirdweb-auth";
import { encode } from "next-auth/jwt";

/**
 * GET /api/auth/thirdweb/bridge?email=...&name=...
 *
 * Full-navigation bridge endpoint. After Thirdweb login sets the
 * thirdweb_auth_token cookie (via fetch), the client redirects HERE
 * via window.location.href. Because this is a real navigation (not
 * a fetch), the Set-Cookie headers are processed by the browser
 * reliably.
 */
export async function GET(req: NextRequest) {
  // Derive the origin from the actual browser request, not env vars
  const host = req.headers.get("host") || "localhost:3002";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  try {
    const token = req.cookies.get("thirdweb_auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in?error=no_token", origin));
    }

    const authResult = await thirdwebAuth.verifyJWT({ jwt: token });
    if (!authResult.valid || !authResult.parsedJWT.sub) {
      return NextResponse.redirect(new URL("/sign-in?error=invalid_token", origin));
    }

    const address = authResult.parsedJWT.sub;

    // Extract optional profile data from query params
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim().toLowerCase() || undefined;
    const displayName = url.searchParams.get("name") || undefined;

    // ── Case 1: Already linked by address ──
    let user = await prismadb.users.findFirst({
      where: { thirdweb_address: address },
    });

    // ── Case 2: Link by email (never overwrite existing name/data) ──
    if (!user && email) {
      const existingByEmail = await prismadb.users.findFirst({
        where: { email },
      });

      if (existingByEmail) {
        user = await prismadb.users.update({
          where: { id: existingByEmail.id },
          data: {
            thirdweb_address: address,
            lastLoginAt: new Date(),
          },
        });
        console.log(`[ThirdwebBridge] Linked ${address} → ${email} (${user.id})`);
      }
    }

    // ── Case 3: Brand new user ──
    if (!user && email) {
      const userStatus =
        process.env.ALLOW_OPEN_REGISTRATION === "true" ? "ACTIVE" : "PENDING";

      user = await prismadb.users.create({
        data: {
          email,
          name: displayName || null,
          thirdweb_address: address,
          is_admin: false,
          is_account_admin: false,
          userStatus,
          lastLoginAt: new Date(),
        },
      });

      console.log(`[ThirdwebBridge] Created ${email} (${user.id}) status=${userStatus}`);

      if (userStatus === "PENDING") {
        return NextResponse.redirect(new URL("/register", origin));
      }
    }

    // ── No user found and no email to create one ──
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in?error=no_account", origin));
    }

    // ── Bridge NextAuth session ──
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[ThirdwebBridge] JWT_SECRET not set");
      return NextResponse.redirect(new URL("/sign-in?error=config", origin));
    }

    // Minimal JWT payload — only what NextAuth's session callback needs.
    // The session callback in auth.ts looks up the full user by email anyway.
    // Keeping this small avoids ERR_RESPONSE_HEADERS_TOO_BIG.
    const sessionToken = await encode({
      token: {
        email: user.email,
        id: user.id,
      },
      secret,
      maxAge: 8 * 60 * 60,
    });

    const redirectUrl = new URL("/dashboard", origin);
    const res = NextResponse.redirect(redirectUrl);

    const isSecure =
      process.env.NEXTAUTH_URL?.startsWith("https://") || !!process.env.VERCEL;

    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    res.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    console.log(
      `[ThirdwebBridge] Session bridged for ${user.email} → cookie=${cookieName}, redirecting to /dashboard`
    );

    return res;
  } catch (error: any) {
    console.error("[ThirdwebBridge] Error:", error?.message, error?.stack);
    // Return JSON with error details so we can diagnose production issues
    return NextResponse.json(
      { 
        error: "Bridge failed", 
        message: error?.message,
        // Only show stack in non-production for security
        ...(process.env.NODE_ENV !== "production" ? { stack: error?.stack } : {}),
      },
      { status: 500 }
    );
  }
}
