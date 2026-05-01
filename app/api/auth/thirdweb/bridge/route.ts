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

/** Build a redirect URL that works behind reverse proxies (Plesk/nginx). */
function buildRedirect(req: NextRequest, path: string): URL {
  const dest = req.nextUrl.clone();
  dest.pathname = path;
  dest.search = "";
  return dest;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("thirdweb_auth_token")?.value;
    if (!token) {
      return NextResponse.redirect(buildRedirect(req, "/sign-in"));
    }

    const authResult = await thirdwebAuth.verifyJWT({ jwt: token });
    if (!authResult.valid || !authResult.parsedJWT.sub) {
      return NextResponse.redirect(buildRedirect(req, "/sign-in"));
    }

    const address = authResult.parsedJWT.sub;

    // Extract optional profile data from query params
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || undefined;
    const displayName = req.nextUrl.searchParams.get("name") || undefined;

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
        return NextResponse.redirect(buildRedirect(req, "/register"));
      }
    }

    // ── No user found and no email to create one ──
    if (!user) {
      return NextResponse.redirect(buildRedirect(req, "/sign-in"));
    }

    // ── Bridge NextAuth session ──
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[ThirdwebBridge] JWT_SECRET not set");
      return NextResponse.redirect(buildRedirect(req, "/sign-in"));
    }

    // Minimal JWT payload — only what NextAuth's session callback needs.
    const sessionToken = await encode({
      token: {
        email: user.email,
        id: user.id,
      },
      secret,
      maxAge: 8 * 60 * 60,
    });

    const res = NextResponse.redirect(buildRedirect(req, "/dashboard"));

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
    return NextResponse.json(
      { error: "Bridge failed", message: error?.message },
      { status: 500 }
    );
  }
}
