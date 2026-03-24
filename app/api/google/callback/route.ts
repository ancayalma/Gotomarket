import { NextResponse } from "next/server";
import { exchangeCodeForTokens, getGmailClientForUser } from "@/lib/gmail";
import { systemLogger } from "@/lib/logger";

/**
 * GET /api/google/callback
 * OAuth2 redirect URI handler for Google (Gmail/Calendar).
 * - Expects query params: ?code=...&state=base64url({ u: userId })
 * - Exchanges code for tokens and persists them in gmail_Tokens.
 * - Redirects back to CRM UI.
 *
 * Ensure your GMAIL_REDIRECT_URI env var matches this route:
 *   e.g. https://your-crm-domain.com/api/google/callback
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Fix: Use configured app URL instead of request origin (which might be internal container ID)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  // Priority: NEXT_PUBLIC_APP_URL -> NEXTAUTH_URL -> Request Origin (fallback)
  const origin = appUrl || nextAuthUrl || url.origin;

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Missing code/state", { status: 400 });
  }

  try {
    // Decode state: base64url(JSON.stringify({ u: userId }))
    let userId: string | undefined;
    try {
      const decoded = Buffer.from(state, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded);
      userId = parsed?.u as string | undefined;
    } catch {
      return new NextResponse("Invalid state", { status: 400 });
    }

    if (!userId) {
      return new NextResponse("Missing user in state", { status: 400 });
    }

    // Security: Verify session matches state to prevent CSRF/Session mismatch
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.id !== userId) {
      systemLogger.error("[GOOGLE_OAUTH_CALLBACK] Session mismatch", { sessionUser: session?.user?.id, stateUser: userId });
      const redirectErr = `${origin}/profile?tab=integration&google=error_session_mismatch`;
      return NextResponse.redirect(redirectErr, { status: 302 });
    }

    await exchangeCodeForTokens(userId, code);

    // [WEBHOOK SETUP] Register push notifications if Pub/Sub topic is configured
    try {
      const pubsubTopic = process.env.GOOGLE_PUBSUB_TOPIC;
      if (pubsubTopic) {
        const gmail = await getGmailClientForUser(userId);
        if (gmail) {
          const watchRes = await gmail.users.watch({
            userId: 'me',
            requestBody: {
              topicName: pubsubTopic,
              labelIds: ['INBOX', 'SENT'],
              labelFilterAction: 'include'
            }
          });
          
          if (watchRes.data.historyId) {
            import('@/lib/prisma').then(({ prismadb }) => {
              prismadb.gmail_Tokens.updateMany({
                where: { user: userId },
                data: { historyId: watchRes.data.historyId }
              }).catch(console.error);
            });
          }
          systemLogger.info(`[GOOGLE_WEBHOOK] Registered push for user ${userId}`);
        }
      }
    } catch (watchErr: any) {
      systemLogger.error("[GOOGLE_WEBHOOK_SETUP_FAILED]", watchErr?.message || watchErr);
      // Fail gracefully so user still gets connected
    }

    // Redirect back to Profile → Integrations tab indicating success
    const redirectOk = `${origin}/profile?tab=integration&google=connected`;
    return NextResponse.redirect(redirectOk, { status: 302 });
  } catch (e: any) {

    systemLogger.error("[GOOGLE_OAUTH_CALLBACK]", e?.message || e);
    const redirectErr = `${origin}/profile?tab=integration&google=error`;
    return NextResponse.redirect(redirectErr, { status: 302 });
  }
}
