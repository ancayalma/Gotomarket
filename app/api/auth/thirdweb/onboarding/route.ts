import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { thirdwebAuth } from "@/lib/thirdweb-auth";
import { encode } from "next-auth/jwt";

/**
 * POST /api/auth/thirdweb/onboarding
 * 
 * Called after Thirdweb login with profile data (email, name) from social auth.
 * Handles three scenarios:
 *   1. Existing user with matching email → link thirdweb_address, bridge session
 *   2. Existing user already linked → just bridge session
 *   3. New user → create account (respects ALLOW_OPEN_REGISTRATION)
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("thirdweb_auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authResult = await thirdwebAuth.verifyJWT({ jwt: token });
    if (!authResult.valid || !authResult.parsedJWT.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const address = authResult.parsedJWT.sub;
    const body = await req.json();
    const { email, displayName } = body;

    // ── Case 1: Already linked by address ──
    // Check this FIRST so SSO works without requiring an email payload
    const alreadyLinked = await prismadb.users.findFirst({
      where: { thirdweb_address: address },
    });

    if (alreadyLinked) {
      const res = NextResponse.json({ success: true, userId: alreadyLinked.id, linked: true });
      await bridgeNextAuthSession(res, alreadyLinked);
      return res;
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required for account linking", needsRegistration: true }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Case 2: Existing user with same email → link ──
    const existingByEmail = await prismadb.users.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingByEmail) {
      // Link the Thirdweb address to the existing user
      const updated = await prismadb.users.update({
        where: { id: existingByEmail.id },
        data: {
          thirdweb_address: address,
          lastLoginAt: new Date(),
          // Update avatar/name if not already set
          ...(displayName && !existingByEmail.name ? { name: displayName } : {}),
        },
      });

      console.log(
        `[ThirdwebOnboarding] Linked address ${address} to existing user ${existingByEmail.email} (${existingByEmail.id})`
      );

      const res = NextResponse.json({ success: true, userId: updated.id, linked: true, migrated: true });
      await bridgeNextAuthSession(res, updated);
      return res;
    }

    // ── Case 3: Brand new user → create ──
    const userStatus =
      process.env.ALLOW_OPEN_REGISTRATION === "true" ? "ACTIVE" : "PENDING";

    const newUser = await prismadb.users.create({
      data: {
        email: normalizedEmail,
        name: displayName || null,
        thirdweb_address: address,
        is_admin: false,
        is_account_admin: false,
        userStatus,
        lastLoginAt: new Date(),
      },
    });

    console.log(
      `[ThirdwebOnboarding] Created new user ${newUser.email} (${newUser.id}) with status ${userStatus}`
    );

    const res = NextResponse.json({
      success: true,
      userId: newUser.id,
      linked: true,
      created: true,
      needsRegistration: userStatus === "PENDING",
    });
    await bridgeNextAuthSession(res, newUser);
    return res;
  } catch (error: any) {
    console.error("[ThirdwebOnboarding] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Bridge: Issue a NextAuth-compatible JWT session cookie.
 * Duplicated from the catch-all route for isolation.
 */
async function bridgeNextAuthSession(res: NextResponse, user: any) {
  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[ThirdwebOnboarding] Cannot bridge session — JWT_SECRET not set");
      return;
    }

    const sessionToken = await encode({
      token: {
        email: user.email,
        name: user.name,
        picture: user.avatar,
        id: user.id,
        session_version: user.session_version,
      },
      secret,
      maxAge: 8 * 60 * 60,
    });

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      res.cookies.set("__Secure-next-auth.session-token", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60,
      });
    } else {
      res.cookies.set("next-auth.session-token", sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60,
      });
    }
  } catch (err) {
    console.error("[ThirdwebOnboarding] Failed to bridge NextAuth session:", err);
  }
}
