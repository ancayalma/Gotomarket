import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logActivityInternal } from "@/actions/audit";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let method = "all";
    try {
        const body = await req.json();
        method = body.method || "all";
    } catch {
        // No body = disable all (backwards compatible)
    }

    if (method === "totp") {
        // ── Reset TOTP only ──
        // Check if WebAuthn is still configured
        const authenticatorCount = await prismadb.authenticator.count({
            where: { userId: session.user.id },
        });

        await (prismadb.users as any).update({
            where: { email: session.user.email },
            data: {
                mfaSecret: null,
                // If WebAuthn is still configured, keep MFA enabled with WEBAUTHN as primary
                ...(authenticatorCount > 0
                    ? { mfaMethod: "WEBAUTHN" }
                    : { mfaEnabled: false, mfaMethod: "NONE" }
                ),
            },
        });

        await logActivityInternal(
            session.user.id, "MFA_TOTP_RESET", "Security",
            "User reset TOTP authenticator app configuration.",
            undefined
        );

    } else if (method === "webauthn") {
        // ── Reset WebAuthn only ──
        await prismadb.authenticator.deleteMany({
            where: { userId: session.user.id },
        });

        // Check if TOTP is still configured
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { mfaSecret: true },
        });

        await (prismadb.users as any).update({
            where: { email: session.user.email },
            data: {
                // If TOTP is still configured, keep MFA enabled with TOTP as primary
                ...(user?.mfaSecret
                    ? { mfaMethod: "TOTP" }
                    : { mfaEnabled: false, mfaMethod: "NONE" }
                ),
            },
        });

        await logActivityInternal(
            session.user.id, "MFA_WEBAUTHN_RESET", "Security",
            "User reset WebAuthn/Passkey configuration.",
            undefined
        );

    } else {
        // ── Disable ALL MFA ──
        // Delete all authenticator records
        await prismadb.authenticator.deleteMany({
            where: { userId: session.user.id },
        });

        const user = await (prismadb.users as any).update({
            where: { email: session.user.email },
            data: {
                mfaEnabled: false,
                mfaMethod: "NONE",
                mfaSecret: null,
            },
        });

        await logActivityInternal(
            user.id, "MFA_DISABLED", "Security",
            "User voluntarily disabled Multi-Factor Authentication.",
            user.team_id || undefined
        );

        // SOC2 Critical Event Escalation Notification
        try {
            const sendEmail = (await import("@/lib/sendmail")).default;
            await sendEmail({
                to: user.email,
                subject: "Security Alert: Multi-Factor Authentication Disabled",
                text: `Multi-Factor Authentication (MFA) was just disabled on your account. If you did not perform this action, your account may be compromised. Please reset your password immediately.`,
                html: `
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px;">
                        <h2 style="color: #dc2626; margin-top: 0;">Security Alert</h2>
                        <p>Multi-Factor Authentication (MFA) was just <strong>disabled</strong> on your account.</p>
                        <p>If you did not perform this action, your account may be compromised. Please reset your password immediately.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send SOC2 MFA escalation email:", emailError);
        }
    }

    return NextResponse.json({ success: true });
}
