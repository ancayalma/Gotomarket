import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logActivityInternal } from "@/actions/audit";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await (prismadb.users as any).update({
        where: { email: session.user.email },
        data: {
            mfaEnabled: false,
            mfaMethod: "NONE",
            mfaSecret: null,
        },
    });

    // SOC2 Audit Logging
    await logActivityInternal(
        user.id,
        "MFA_DISABLED",
        "Security",
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

    return NextResponse.json({ success: true });
}
